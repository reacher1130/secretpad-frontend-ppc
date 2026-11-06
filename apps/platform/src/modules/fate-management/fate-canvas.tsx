import { LOCAL_NATIVE_FATE_CONFIG } from './native-config';
import { Graph } from '@antv/x6';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ApartmentOutlined,
  ClearOutlined,
  DeleteOutlined,
  DownloadOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FateTemplatePicker } from './template-picker';
import {
  parseFateJson,
  templateDatasetOptions,
  type FateDagComponent,
  type FateTemplateResult,
} from './job-templates';

const { Text, Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Panel } = Collapse;

export type FateComponentCategory = 'data' | 'preprocessing' | 'model' | 'evaluation';

export interface FateComponentTemplate {
  name: string;
  componentName: string;
  provider: string;
  version: string;
  category: FateComponentCategory;
  description?: string;
  defaultParameter?: Record<string, any>;
}

export const FATE_COMPONENTS: FateComponentTemplate[] = [
  {
    name: 'psi_0',
    componentName: 'psi',
    provider: 'fate',
    version: '2.0.0',
    category: 'preprocessing',
    description: 'FATE 隐私求交（guest/host）',
    defaultParameter: { protocol: 'ecdh_psi', curve_type: 'curve25519' },
  },
  {
    name: 'coordinated_lr_0',
    componentName: 'coordinated_lr',
    provider: 'fate',
    version: '2.0.0',
    category: 'model',
    description: 'FATE 纵向协调逻辑回归',
    defaultParameter: { epochs: 20, batch_size: null },
  },
  {
    name: 'hetero_secureboost_0',
    componentName: 'hetero_secureboost',
    provider: 'fate',
    version: '2.0.0',
    category: 'model',
    description: 'FATE 纵向安全梯度提升树',
    defaultParameter: { num_trees: 3, learning_rate: 0.3, max_depth: 3 },
  },
];

const CATEGORY_COLORS: Record<FateComponentCategory, { fill: string; stroke: string }> =
  {
    data: { fill: '#e6fffb', stroke: '#13c2c2' },
    preprocessing: { fill: '#f6ffed', stroke: '#52c41a' },
    model: { fill: '#e6f7ff', stroke: '#1890ff' },
    evaluation: { fill: '#fff7e6', stroke: '#fa8c16' },
  };

const CATEGORY_LABELS: Record<FateComponentCategory, string> = {
  data: '数据',
  preprocessing: '预处理',
  model: '模型',
  evaluation: '评估',
};

interface FateCanvasProps {
  clusterId?: string;
  onClusterChange: (clusterId: string) => void;
  clusters: API.FateClusterVO[];
  datasets: API.FateDatasetVO[];
  submitting: boolean;
  onSubmit: (body: API.FateJobRequest) => Promise<boolean>;
}

interface NodeData extends FateComponentTemplate {
  nodeId: string;
  name: string;
  parameter: Record<string, any>;
}

const validateDag = (graph: Graph): { ok: boolean; msg?: string } => {
  const nodes = graph.getNodes();
  const edges = graph.getEdges();
  if (nodes.length === 0) return { ok: false, msg: '画布为空，请先添加组件' };

  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  nodes.forEach((n) => {
    inDegree[n.id] = 0;
    adj[n.id] = [];
  });
  edges.forEach((e) => {
    const source = e.getSourceCellId();
    const target = e.getTargetCellId();
    if (source && target) {
      inDegree[target] = (inDegree[target] || 0) + 1;
      adj[source] = adj[source] || [];
      adj[source].push(target);
    }
  });

  // cycle detection
  const visited = new Set<string>();
  const recStack = new Set<string>();
  const dfs = (id: string): boolean => {
    visited.add(id);
    recStack.add(id);
    for (const next of adj[id] || []) {
      if (!visited.has(next) && dfs(next)) return true;
      if (recStack.has(next)) return true;
    }
    recStack.delete(id);
    return false;
  };
  for (const id of Object.keys(adj)) {
    if (!visited.has(id) && dfs(id))
      return { ok: false, msg: 'DAG 存在循环依赖，请检查连线' };
  }

  const names = nodes.map((node) => (node.getData() as NodeData).name);
  if (new Set(names).size !== names.length)
    return { ok: false, msg: '节点名称不能重复' };
  for (const node of nodes) {
    const data = node.getData() as NodeData;
    if (data.componentName === 'psi' && inDegree[node.id] !== 0) {
      return { ok: false, msg: 'PSI 是数据入口，请移除指向 PSI 的连线' };
    }
    if (data.componentName !== 'psi' && inDegree[node.id] !== 1) {
      return { ok: false, msg: `${data.name} 需要一条上游数据连线` };
    }
  }

  // Native FATE reads each party's registered dataset from task_params.
  const psiNodes = nodes.filter(
    (n) => (n.getData() as NodeData)?.componentName === 'psi',
  );
  if (psiNodes.length === 0)
    return { ok: false, msg: '至少需要一个 psi 组件作为数据对齐入口' };

  return { ok: true };
};

export const FateCanvas: React.FC<FateCanvasProps> = ({
  clusterId,
  onClusterChange,
  clusters,
  datasets,
  submitting,
  onSubmit,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<Graph | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [jobForm] = Form.useForm();
  const [nodeForm] = Form.useForm();

  useEffect(() => {
    jobForm.setFieldsValue({ clusterId });
  }, [clusterId]);

  const updateSelectedId = (id: string | null) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  };

  const dagJson = useMemo(() => {
    const graph = graphRef.current;
    if (!graph) return JSON.stringify({ version: '2.0', components: [] }, null, 2);
    const components: any[] = [];
    graph.getNodes().forEach((node) => {
      const data = (node.getData() as NodeData) || ({} as NodeData);
      const component: any = {
        name: data.name,
        componentName: data.componentName,
        provider: data.provider,
        version: data.version,
        input: [],
        output: [{ key: 'data', type: 'dataset' }],
      };
      if (data.parameter && Object.keys(data.parameter).length) {
        component.parameter = data.parameter;
      }
      components.push(component);
    });
    graph.getEdges().forEach((edge) => {
      const source = edge.getSourceCellId();
      const target = edge.getTargetCellId();
      const targetNode = graph.getCellById(target);
      const sourceNode = graph.getCellById(source);
      if (!targetNode || !sourceNode || !targetNode.isNode() || !sourceNode.isNode())
        return;
      const sourceData = sourceNode.getData() as NodeData;
      const targetData = targetNode.getData() as NodeData;
      const component = components.find((item) => item.name === targetData.name);
      if (!component) return;
      component.input = component.input || [];
      component.input.push({ key: `${sourceData.name}.data`, type: 'dataset' });
    });
    return JSON.stringify({ version: '2.0', components }, null, 2);
  }, [selectedId, nodeCount]);

  useEffect(() => {
    if (!containerRef.current) return;
    // Ant Design cards can report zero height during the first effect pass
    // while their layout is still settling.  Give X6 a real initial viewport
    // so drag/drop and node hit testing work on the first render; the resize
    // listener will reconcile it with the actual container afterwards.
    const initialWidth = containerRef.current.clientWidth || 560;
    const initialHeight = Math.max(containerRef.current.clientHeight, 620);
    const graph = new Graph({
      container: containerRef.current,
      width: initialWidth,
      height: initialHeight,
      grid: { size: 10, visible: true },
      connecting: {
        allowBlank: false,
        allowLoop: false,
        allowNode: false,
        allowMulti: false,
        snap: true,
        connector: 'normal',
        connectionPoint: 'anchor',
        router: { name: 'manhattan' },
        validateConnection({ sourceMagnet, targetMagnet }) {
          return (
            sourceMagnet?.getAttribute('port') === 'out' &&
            targetMagnet?.getAttribute('port') === 'in'
          );
        },
      },
      panning: false,
      mousewheel: { enabled: true, modifiers: ['ctrl', 'meta'] },
      background: { color: '#fafafa' },
    });
    graphRef.current = graph;

    graph.on('node:click', ({ node }) => {
      updateSelectedId(node.id);
      const data = (node.getData() as NodeData) || ({} as NodeData);
      nodeForm.setFieldsValue({
        nodeId: node.id,
        name: data.name,
        componentName: data.componentName,
        guestDatasetId: data.parameter?.__guestDatasetId,
        hostDatasetId: data.parameter?.__hostDatasetId,
        parameter: JSON.stringify(data.parameter || {}, null, 2),
      });
    });

    graph.on('edge:click', ({ edge }) => {
      updateSelectedId(edge.id);
    });

    graph.on('blank:click', () => {
      updateSelectedId(null);
      nodeForm.resetFields();
    });

    const refreshDag = () => setNodeCount((c) => c + 1);
    graph.on('cell:changed', refreshDag);
    graph.on('cell:added', refreshDag);
    graph.on('cell:removed', refreshDag);
    graph.on('edge:connected', refreshDag);

    graph.on('scale', ({ sx }) => {
      setScale(sx);
    });

    const handleResize = () => {
      if (containerRef.current) {
        graph.resize(
          containerRef.current.clientWidth,
          containerRef.current.clientHeight,
        );
      }
    };
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, [contenteditable="true"], .ant-select'))
        return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const id = selectedIdRef.current;
        const selected = id ? graph.getCellById(id) : null;
        if (selected) {
          graph.removeCells([id as string]);
          updateSelectedId(null);
          nodeForm.resetFields();
          setNodeCount((c) => c + 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      window.removeEventListener('keydown', handleKeyDown);
      graph.dispose();
      graphRef.current = null;
    };
  }, []);

  const addComponent = (
    tpl: FateComponentTemplate,
    x?: number,
    y?: number,
    component?: FateDagComponent,
  ) => {
    const graph = graphRef.current;
    if (!graph) return;
    const count = graph.getNodes().length;
    const baseName = tpl.name.replace(/_\d+$/, '');
    let suffix = count;
    while (graph.getCellById(`${baseName}_${suffix}`)) suffix++;
    const id = component?.name || `${baseName}_${suffix}`;
    const uniqueName = id;
    const colors = CATEGORY_COLORS[tpl.category];
    const node = graph.addNode({
      id,
      x: x ?? 80 + (count % 5) * 200,
      y: y ?? 120 + Math.floor(count / 5) * 120,
      shape: 'rect',
      width: 172,
      height: 64,
      label: `${tpl.componentName}\n${uniqueName}`,
      attrs: {
        body: {
          fill: colors.fill,
          stroke: colors.stroke,
          rx: 8,
          ry: 8,
          strokeWidth: 2,
        },
        label: {
          fill: '#262626',
          fontSize: 12,
          whiteSpace: 'pre',
        },
      },
      ports: {
        groups: {
          top: {
            position: 'top',
            attrs: {
              circle: { r: 5, magnet: true, stroke: colors.stroke, fill: '#fff' },
            },
          },
          bottom: {
            position: 'bottom',
            attrs: {
              circle: { r: 5, magnet: true, stroke: colors.stroke, fill: '#fff' },
            },
          },
        },
        items: [
          { id: 'in', group: 'top' },
          { id: 'out', group: 'bottom' },
        ],
      },
      data: {
        ...tpl,
        nodeId: id,
        name: uniqueName,
        parameter: component ? { ...component.parameter } : { ...tpl.defaultParameter },
      } as NodeData,
    });
    setNodeCount((c) => c + 1);
    setErrorMsg(null);
    return node;
  };

  const applyTemplate = (result: FateTemplateResult) => {
    const graph = graphRef.current;
    if (!graph) return;
    const apply = () => {
      graph.clearCells();
      updateSelectedId(null);
      nodeForm.resetFields();
      result.dag.components.forEach((component, index) => {
        const tpl = FATE_COMPONENTS.find(
          (item) => item.componentName === component.componentName,
        )!;
        const node = addComponent(tpl, 100, 70 + index * 150, component);
        if (node && component.componentName === 'psi') {
          node.setData({
            ...node.getData(),
            parameter: {
              ...component.parameter,
              __guestDatasetId: result.bindings.guestDatasetId,
              __hostDatasetId: result.bindings.hostDatasetId,
              __guestDatasetRef: result.bindings.guestDatasetRef,
              __hostDatasetRef: result.bindings.hostDatasetRef,
            },
          });
        }
        component.input.forEach((input) => {
          graph.addEdge({
            source: { cell: input.key.split('.')[0], port: 'out' },
            target: { cell: component.name, port: 'in' },
            attrs: {
              line: { stroke: '#8a67cc', strokeWidth: 2, targetMarker: 'classic' },
            },
          });
        });
      });
      jobForm.setFieldsValue({
        clusterId,
        name: jobForm.getFieldValue('name') || `${result.template.title}-${Date.now()}`,
        config: JSON.stringify(result.config, null, 2),
      });
      graph.centerContent();
      setNodeCount((count) => count + 1);
      setErrorMsg(null);
      message.success('模板已生成，可点击节点继续编辑');
    };
    if (graph.getNodes().length > 0) {
      Modal.confirm({
        title: '用模板替换当前画布？',
        content: '将替换当前节点、连线和参与方配置，保留作业名称。',
        okText: '替换画布',
        cancelText: '保留当前画布',
        onOk: apply,
      });
    } else apply();
  };

  const onDragStart = (e: React.DragEvent, tpl: FateComponentTemplate) => {
    e.dataTransfer.setData('application/json', JSON.stringify(tpl));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const raw = e.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
      const tpl = JSON.parse(raw) as FateComponentTemplate;
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        addComponent(tpl, e.clientX - rect.left - 86, e.clientY - rect.top - 32);
      }
    } catch {
      // ignore invalid drop
    }
  };

  const removeSelected = () => {
    const graph = graphRef.current;
    if (!graph || !selectedIdRef.current) return;
    graph.removeCells([selectedIdRef.current]);
    updateSelectedId(null);
    nodeForm.resetFields();
    setNodeCount((c) => c + 1);
  };

  const clearCanvas = () => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.clearCells();
    updateSelectedId(null);
    nodeForm.resetFields();
    setNodeCount((c) => c + 1);
    setErrorMsg(null);
  };

  const autoLayout = () => {
    const graph = graphRef.current;
    if (!graph) return;
    const nodes = graph.getNodes();
    const levels: Record<string, number> = {};
    const inDegree: Record<string, number> = {};
    const parents: Record<string, string[]> = {};
    nodes.forEach((n) => {
      levels[n.id] = 0;
      inDegree[n.id] = 0;
      parents[n.id] = [];
    });
    graph.getEdges().forEach((e) => {
      const s = e.getSourceCellId();
      const t = e.getTargetCellId();
      if (s && t) {
        inDegree[t] = (inDegree[t] || 0) + 1;
        parents[t] = parents[t] || [];
        parents[t].push(s);
      }
    });

    const queue = nodes.filter((n) => !inDegree[n.id]).map((n) => n.id);
    let qi = 0;
    while (qi < queue.length) {
      const id = queue[qi++];
      nodes.forEach((n) => {
        if (parents[n.id]?.includes(id)) {
          levels[n.id] = Math.max(levels[n.id], levels[id] + 1);
          inDegree[n.id]--;
          if (inDegree[n.id] === 0) queue.push(n.id);
        }
      });
    }

    const levelGroups: Record<number, string[]> = {};
    nodes.forEach((n) => {
      const lv = levels[n.id] || 0;
      levelGroups[lv] = levelGroups[lv] || [];
      levelGroups[lv].push(n.id);
    });

    Object.entries(levelGroups).forEach(([lv, ids]) => {
      ids.forEach((id, idx) => {
        const node = graph.getCellById(id);
        if (node && node.isNode()) {
          node.setPosition(80 + Number(lv) * 240, 80 + idx * 120);
        }
      });
    });
    graph.centerContent();
    setNodeCount((c) => c + 1);
  };

  const handleUpdateNode = (values: any) => {
    const graph = graphRef.current;
    if (!graph || !selectedIdRef.current) return;
    const node = graph.getCellById(selectedIdRef.current);
    if (node && node.isNode()) {
      const data = node.getData() as NodeData;
      let parameter = {};
      try {
        parameter = parseFateJson(values.parameter || '{}', '节点参数');
      } catch {
        setErrorMsg('节点参数 JSON 解析失败');
        return;
      }
      // Bind registered datasets from the selected cluster only.
      if (data.componentName === 'psi') {
        const guest = templateDatasetOptions(datasets, clusterId, 'guest').find(
          (d) => d.datasetId === values.guestDatasetId,
        );
        const host = templateDatasetOptions(datasets, clusterId, 'host').find(
          (d) => d.datasetId === values.hostDatasetId,
        );
        if (!guest || !host) {
          setErrorMsg('请选择当前集群的 Guest 和 Host 数据集');
          return;
        }
        parameter = {
          ...parameter,
          ...(values.guestDatasetId ? { __guestDatasetId: values.guestDatasetId } : {}),
          ...(values.hostDatasetId ? { __hostDatasetId: values.hostDatasetId } : {}),
          ...(guest
            ? { __guestDatasetRef: `${guest.namespace}#${guest.tableName}` }
            : {}),
          ...(host ? { __hostDatasetRef: `${host.namespace}#${host.tableName}` } : {}),
        };
      }
      const newName = values.name?.trim();
      if (
        graph
          .getNodes()
          .some((item) => item.id !== node.id && item.getData()?.name === newName)
      ) {
        setErrorMsg('节点名称不能重复');
        return;
      }
      if (newName && newName !== data.name) {
        node.setData({ ...data, name: newName, parameter } as NodeData);
        node.attr('label/text', `${data.componentName}\n${newName}`);
      } else {
        node.setData({ ...data, parameter } as NodeData);
      }
      setNodeCount((c) => c + 1);
      setErrorMsg(null);
    }
  };

  const handleSubmitJob = async (values: any) => {
    const graph = graphRef.current;
    if (!graph) return;
    const validation = validateDag(graph);
    if (!validation.ok) {
      setErrorMsg(validation.msg || 'DAG 校验失败');
      return;
    }
    // Keep the form payload typed as a map so the FATE task_params merge below
    // is checked without weakening the rest of the canvas types.
    let config: Record<string, any> = {};
    try {
      config = parseFateJson(values.config || '{}', '参与方配置');
    } catch {
      setErrorMsg('Config JSON 解析失败');
      return;
    }
    const dag = JSON.parse(dagJson);

    // Merge current node parameters and dataset bindings into task_params.
    const taskParams = (
      config.task_params && typeof config.task_params === 'object'
        ? { ...config.task_params }
        : {}
    ) as Record<string, any>;
    const common =
      taskParams.common && typeof taskParams.common === 'object'
        ? { ...taskParams.common }
        : {};
    const guest =
      taskParams.guest && typeof taskParams.guest === 'object'
        ? { ...taskParams.guest }
        : {};
    const host =
      taskParams.host && typeof taskParams.host === 'object'
        ? { ...taskParams.host }
        : {};
    const guestZero =
      guest['0'] && typeof guest['0'] === 'object' ? { ...guest['0'] } : {};
    const hostZero = host['0'] && typeof host['0'] === 'object' ? { ...host['0'] } : {};

    graph.getNodes().forEach((node) => {
      const data = (node.getData() as NodeData) || ({} as NodeData);
      const rawParameter =
        data.parameter && typeof data.parameter === 'object'
          ? { ...data.parameter }
          : {};
      const publicParameter = Object.fromEntries(
        Object.entries(rawParameter).filter(([key]) => !key.startsWith('__')),
      );
      if (Object.keys(publicParameter).length > 0) {
        common[data.name] = { ...(common[data.name] || {}), ...publicParameter };
      }
      if (data.componentName === 'psi') {
        const guestRef = rawParameter.__guestDatasetRef;
        const hostRef = rawParameter.__hostDatasetRef;
        if (guestRef) {
          guestZero[data.name] = {
            ...(guestZero[data.name] || {}),
            dataset_id: guestRef,
          };
        }
        if (hostRef) {
          hostZero[data.name] = { ...(hostZero[data.name] || {}), dataset_id: hostRef };
        }
      }
    });
    guest['0'] = guestZero;
    host['0'] = hostZero;
    const normalizedConfig = {
      ...config,
      task_params: { ...taskParams, common, guest, host },
    };
    for (const node of graph.getNodes()) {
      const data = node.getData() as NodeData;
      if (data.componentName !== 'psi') continue;
      for (const role of ['guest', 'host'] as const) {
        const datasetId =
          data.parameter?.[role === 'guest' ? '__guestDatasetId' : '__hostDatasetId'];
        if (
          datasetId &&
          !templateDatasetOptions(datasets, clusterId, role).some(
            (item) => item.datasetId === datasetId,
          )
        ) {
          setErrorMsg(
            '画布绑定的数据不属于当前集群，请重新应用模板或更新 PSI 节点数据集',
          );
          return;
        }
        const ref = normalizedConfig.task_params[role]['0'][data.name]?.dataset_id;
        if (typeof ref !== 'string' || !/^[^#\s]+#[^#\s]+$/.test(ref)) {
          setErrorMsg(`请为 ${data.name} 选择 ${role} 数据集`);
          return;
        }
      }
    }
    setErrorMsg(null);
    const ok = await onSubmit({
      clusterId: values.clusterId,
      name: values.name,
      dag,
      config: normalizedConfig,
    });
    if (ok) message.success('画布作业已提交，可在“训练任务”查看进度');
  };

  const downloadDag = () => {
    const blob = new Blob([dagJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fate-dag-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const zoomIn = () => {
    graphRef.current?.zoom(0.2);
  };

  const zoomOut = () => {
    graphRef.current?.zoom(-0.2);
  };

  const zoomToFit = () => {
    graphRef.current?.zoomToFit({ padding: 20 });
  };

  const selectedData = useMemo(() => {
    if (!selectedId || !graphRef.current) return null;
    const node = graphRef.current.getCellById(selectedId);
    return node && node.isNode() ? (node.getData() as NodeData) : null;
  }, [selectedId, nodeCount]);

  return (
    <div className="fate-canvas">
      <FateTemplatePicker
        key={clusterId || 'no-cluster'}
        clusterId={clusterId}
        datasets={datasets}
        target="canvas"
        disabled={submitting}
        onApply={applyTemplate}
      />
      {errorMsg && (
        <Alert
          message={errorMsg}
          type="error"
          showIcon
          closable
          onClose={() => setErrorMsg(null)}
          style={{ marginBottom: 12 }}
        />
      )}
      <Row gutter={12} className="fate-canvas-layout">
        <Col flex="200px" className="fate-canvas-library">
          <Card title="组件库" size="small" bodyStyle={{ padding: 8 }}>
            {(
              [
                'data',
                'preprocessing',
                'model',
                'evaluation',
              ] as FateComponentCategory[]
            ).map((cat) => (
              <div key={cat} className="fate-canvas-category">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {CATEGORY_LABELS[cat]}
                </Text>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  {FATE_COMPONENTS.filter((c) => c.category === cat).map((tpl) => (
                    <div
                      key={tpl.name}
                      className="fate-canvas-component-item"
                      draggable
                      onDragStart={(e) => onDragStart(e, tpl)}
                      onClick={() => addComponent(tpl)}
                      style={{ borderLeftColor: CATEGORY_COLORS[cat].stroke }}
                      title={tpl.description}
                    >
                      <div className="fate-canvas-component-name">
                        {tpl.componentName}
                      </div>
                      <div className="fate-canvas-component-desc">
                        {tpl.description}
                      </div>
                    </div>
                  ))}
                </Space>
              </div>
            ))}
          </Card>
        </Col>
        <Col flex="auto" className="fate-canvas-center">
          <Card
            size="small"
            title={
              <Space>
                <ApartmentOutlined />
                <span>FATE 画布</span>
              </Space>
            }
            extra={
              <Space>
                <Button size="small" onClick={zoomOut}>
                  缩小
                </Button>
                <Text
                  type="secondary"
                  style={{ fontSize: 12, minWidth: 48, textAlign: 'center' }}
                >
                  {Math.round(scale * 100)}%
                </Text>
                <Button size="small" onClick={zoomIn}>
                  放大
                </Button>
                <Button size="small" onClick={zoomToFit}>
                  适应
                </Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={autoLayout}>
                  自动布局
                </Button>
                <Button size="small" icon={<DownloadOutlined />} onClick={downloadDag}>
                  导出 DAG
                </Button>
                <Button
                  size="small"
                  danger
                  icon={<ClearOutlined />}
                  onClick={clearCanvas}
                >
                  清空
                </Button>
              </Space>
            }
          >
            <div
              ref={containerRef}
              className="fate-canvas-graph"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            />
          </Card>
        </Col>
        <Col flex="280px" className="fate-canvas-panel">
          <Card title="节点配置" size="small" style={{ marginBottom: 12 }}>
            {selectedData ? (
              <Form
                name="fate-canvas-node"
                form={nodeForm}
                layout="vertical"
                onFinish={handleUpdateNode}
              >
                <Form.Item label="组件名" name="componentName">
                  <Input disabled />
                </Form.Item>
                <Form.Item
                  label="节点名称"
                  name="name"
                  rules={[
                    {
                      required: true,
                      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
                      message: '合法变量名',
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
                {selectedData?.componentName === 'psi' && (
                  <>
                    <Form.Item label="Guest 数据集" name="guestDatasetId">
                      <Select placeholder="选择 guest 已注册数据集" allowClear>
                        {templateDatasetOptions(datasets, clusterId, 'guest').map(
                          (ds) => (
                            <Option key={ds.datasetId} value={ds.datasetId!}>
                              {ds.name} ({ds.namespace}/{ds.tableName})
                            </Option>
                          ),
                        )}
                      </Select>
                    </Form.Item>
                    <Form.Item label="Host 数据集" name="hostDatasetId">
                      <Select placeholder="选择 host 已注册数据集" allowClear>
                        {templateDatasetOptions(datasets, clusterId, 'host').map(
                          (ds) => (
                            <Option key={ds.datasetId} value={ds.datasetId!}>
                              {ds.name} ({ds.namespace}/{ds.tableName})
                            </Option>
                          ),
                        )}
                      </Select>
                    </Form.Item>
                  </>
                )}
                <Form.Item label="Parameter (JSON)" name="parameter">
                  <TextArea rows={8} placeholder='{"max_iter": 30}' />
                </Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" size="small">
                    更新节点
                  </Button>
                  <Button
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={removeSelected}
                  >
                    删除
                  </Button>
                </Space>
              </Form>
            ) : (
              <Text type="secondary">点击画布中的节点以配置参数</Text>
            )}
          </Card>
          <Card title="作业提交" size="small">
            <Form
              name="fate-canvas-job"
              form={jobForm}
              layout="vertical"
              onFinish={handleSubmitJob}
              initialValues={{ config: LOCAL_NATIVE_FATE_CONFIG }}
            >
              <Form.Item label="目标集群" name="clusterId" rules={[{ required: true }]}>
                <Select placeholder="选择集群" onChange={onClusterChange}>
                  {clusters.map((c) => (
                    <Option key={c.clusterId} value={c.clusterId!}>
                      {c.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="作业名称" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item
                label="原生 FATE 参与方配置 (JSON)"
                name="config"
                rules={[{ required: true }]}
                extra="本地示例使用独立 FATE Guest/Host 的 party ID。Bob 仅用于 BFIA，Kimi 仅用于隐语，请勿填入此处。"
              >
                <TextArea rows={6} placeholder='{"initiator":{...},"role":{...}}' />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                icon={<PlayCircleOutlined />}
                block
              >
                提交画布作业
              </Button>
            </Form>
          </Card>
          <Collapse
            defaultActiveKey={[]}
            className="fate-canvas-preview"
            style={{ marginTop: 12 }}
          >
            <Panel header="DAG 预览" key="dag">
              <pre className="fate-canvas-code">{dagJson}</pre>
            </Panel>
          </Collapse>
        </Col>
      </Row>
      <div className="fate-canvas-legend">
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
          <Tag key={cat} color={CATEGORY_COLORS[cat as FateComponentCategory].stroke}>
            {label}
          </Tag>
        ))}
      </div>
    </div>
  );
};
