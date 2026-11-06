import { LOCAL_NATIVE_FATE_CONFIG } from './native-config';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  ApartmentOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useEffect, useState } from 'react';

import { useModel } from '@/util/valtio-helper';
import { FateManagementService } from './fate-management.service';
import { FateCanvas } from './fate-canvas';
import { FateTemplatePicker } from './template-picker';
import { parseFateJson, type FateTemplateResult } from './job-templates';

import styles from './index.less';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const JOB_STATUS_COLORS: Record<string, string> = {
  PENDING: 'default',
  RUNNING: 'processing',
  SUCCEEDED: 'success',
  SUCCESS: 'success',
  FAILED: 'error',
  STOPPED: 'warning',
};

const parseMetric = (metric?: string | Record<string, any>): Record<string, any> => {
  if (!metric) return {};
  if (typeof metric === 'object') return metric;
  try {
    return JSON.parse(metric);
  } catch {
    return {};
  }
};

export const FateManagementComponent = ({
  section,
}: {
  section?: 'clusters' | 'jobs' | 'datasets' | 'models' | 'canvas';
}) => {
  const service = useModel(FateManagementService);
  const [activeTab, setActiveTab] = useState<string>(section || 'clusters');
  const [clusterFormVisible, setClusterFormVisible] = useState(false);
  const [editingCluster, setEditingCluster] = useState<API.FateClusterVO | null>(null);
  const [clusterForm] = Form.useForm();
  const [jobFormVisible, setJobFormVisible] = useState(false);
  const [jobForm] = Form.useForm();
  const jobClusterId = Form.useWatch('clusterId', jobForm);
  const [jobError, setJobError] = useState('');
  const [datasetFormVisible, setDatasetFormVisible] = useState(false);
  const [datasetForm] = Form.useForm();
  const [editingDataset, setEditingDataset] = useState<API.FateDatasetVO | null>(null);
  const [modelFormVisible, setModelFormVisible] = useState(false);
  const [modelForm] = Form.useForm();
  const [editingModel, setEditingModel] = useState<API.FateModelVO | null>(null);
  const [previewDataset, setPreviewDataset] = useState<API.FateDatasetVO | null>(null);
  const [previewModel, setPreviewModel] = useState<API.FateModelVO | null>(null);

  useEffect(() => {
    service.loadClusters();
  }, []);

  useEffect(() => {
    if (activeTab === 'jobs') service.loadJobs(service.currentClusterId);
    if (activeTab === 'datasets') service.loadDatasets(service.currentClusterId);
    if (activeTab === 'models') service.loadModels(service.currentClusterId);
  }, [activeTab, service.currentClusterId]);

  const hasActiveJobs = service.jobs.some((job) =>
    ['PENDING', 'RUNNING', 'AWAITING_APPROVAL'].includes(job.status || ''),
  );
  useEffect(() => {
    if (activeTab !== 'jobs' || !service.currentClusterId || !hasActiveJobs) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      try {
        await service.loadJobs(service.currentClusterId, true);
      } catch {
        // Keep the last known status and retry after a transient connection failure.
      } finally {
        if (!cancelled) timer = setTimeout(refresh, 5000);
      }
    };
    timer = setTimeout(refresh, 5000);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeTab, service.currentClusterId, hasActiveJobs]);

  const handleSaveCluster = async (values: API.FateClusterRequest) => {
    const ok = await service.saveCluster(values, editingCluster?.clusterId);
    if (ok) {
      setClusterFormVisible(false);
      setEditingCluster(null);
      clusterForm.resetFields();
    }
  };

  const openEditCluster = (cluster: API.FateClusterVO) => {
    setEditingCluster(cluster);
    clusterForm.setFieldsValue(cluster);
    setClusterFormVisible(true);
  };

  const openCreateCluster = () => {
    setEditingCluster(null);
    clusterForm.resetFields();
    setClusterFormVisible(true);
  };

  const handleDeleteCluster = (clusterId?: string) => {
    if (!clusterId) return;
    Modal.confirm({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      onOk: () => service.removeCluster(clusterId),
    });
  };

  const handleSubmitJob = async (values: any) => {
    let dag;
    let config;
    try {
      dag = parseFateJson(values.dag || '{}', 'DAG');
      config = parseFateJson(values.config || '{}', '参与方配置');
      if (!Array.isArray(dag.components) || dag.components.length === 0) {
        throw new Error('请使用模板生成流程，或填写包含组件的 DAG');
      }
    } catch (err) {
      setJobError(err instanceof Error ? err.message : '作业配置有误');
      return;
    }
    setJobError('');
    const body: API.FateJobRequest = {
      clusterId: values.clusterId,
      projectId: values.projectId,
      graphId: values.graphId,
      name: values.name,
      initiatorNodeId: values.initiatorNodeId,
      dag,
      config,
    };
    const ok = await service.submitJob(body);
    if (ok) {
      setJobFormVisible(false);
      jobForm.resetFields();
    }
  };

  const handleClusterChange = (value: string) => {
    service.currentClusterId = value;
    service.loadJobs(value);
    service.loadDatasets(value);
    service.loadModels(value);
  };

  const applyJobTemplate = (result: FateTemplateResult) => {
    const apply = () => {
      jobForm.setFieldsValue({
        dag: JSON.stringify(result.dag, null, 2),
        config: JSON.stringify(result.config, null, 2),
        name: jobForm.getFieldValue('name') || `${result.template.title}-${Date.now()}`,
      });
      setJobError('');
      message.success('模板已填入，可继续编辑并提交');
    };
    if (jobForm.getFieldValue('dag')?.trim()) {
      Modal.confirm({
        title: '替换当前作业配置？',
        content: '将替换 DAG 和参与方配置，保留作业名称及项目关联。',
        okText: '替换配置',
        cancelText: '保留当前配置',
        onOk: apply,
      });
    } else apply();
  };

  const handleSaveDataset = async (values: API.FateDatasetRequest) => {
    const body = {
      ...values,
      meta: JSON.parse((values.meta as any) || '{}'),
    };
    const ok = await service.saveDataset(body, editingDataset?.datasetId);
    if (ok) {
      setDatasetFormVisible(false);
      setEditingDataset(null);
      datasetForm.resetFields();
    }
  };

  const openEditDataset = (record: API.FateDatasetVO) => {
    setEditingDataset(record);
    const recordMeta =
      typeof record.meta === 'string'
        ? (() => {
            try {
              return JSON.parse(record.meta as string);
            } catch {
              return {};
            }
          })()
        : record.meta || {};
    datasetForm.setFieldsValue({
      ...record,
      meta: JSON.stringify(recordMeta, null, 2),
    });
    setDatasetFormVisible(true);
  };

  const openCreateDataset = () => {
    setEditingDataset(null);
    datasetForm.resetFields();
    datasetForm.setFieldsValue({ clusterId: service.currentClusterId });
    setDatasetFormVisible(true);
  };

  const handleSaveModel = async (values: API.FateModelRequest) => {
    const body = { ...values, metric: JSON.parse((values.metric as any) || '{}') };
    const ok = await service.saveModel(body, editingModel?.modelId);
    if (ok) {
      setModelFormVisible(false);
      setEditingModel(null);
      modelForm.resetFields();
    }
  };

  const openEditModel = (record: API.FateModelVO) => {
    setEditingModel(record);
    modelForm.setFieldsValue({
      ...record,
      clusterId: record.clusterId || service.currentClusterId,
      metric: JSON.stringify(record.metric || {}, null, 2),
    });
    setModelFormVisible(true);
  };

  const openCreateModel = () => {
    setEditingModel(null);
    modelForm.resetFields();
    modelForm.setFieldsValue({ clusterId: service.currentClusterId });
    setModelFormVisible(true);
  };

  const clusterColumns = [
    { title: '集群名称', dataIndex: 'name', key: 'name' },
    { title: 'FATE-Flow 地址', dataIndex: 'flowAddress', key: 'flowAddress' },
    { title: '版本', dataIndex: 'version', key: 'version' },
    { title: '状态', dataIndex: 'status', key: 'status' },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.FateClusterVO) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditCluster(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCluster(record.clusterId)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const jobColumns = [
    { title: '作业名称', dataIndex: 'name', key: 'name' },
    { title: '集群 ID', dataIndex: 'clusterId', key: 'clusterId' },
    { title: '项目 ID', dataIndex: 'projectId', key: 'projectId' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status?: string) => (
        <Tag color={JOB_STATUS_COLORS[status || ''] || 'default'}>{status || '-'}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'gmtCreate', key: 'gmtCreate' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.FateJobVO) => (
        <Button
          type="link"
          danger
          icon={<StopOutlined />}
          disabled={record.status !== 'RUNNING'}
          onClick={() => service.stopJob(record.jobId!, record.clusterId || undefined)}
        >
          停止
        </Button>
      ),
    },
  ];

  const datasetColumns = [
    { title: '数据集名称', dataIndex: 'name', key: 'name' },
    { title: '集群 ID', dataIndex: 'clusterId', key: 'clusterId' },
    { title: '表名', dataIndex: 'tableName', key: 'tableName' },
    { title: '命名空间', dataIndex: 'namespace', key: 'namespace' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '创建时间', dataIndex: 'gmtCreate', key: 'gmtCreate' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.FateDatasetVO) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setPreviewDataset(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditDataset(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              service.removeDataset(record.datasetId!, record.clusterId || undefined)
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const modelColumns = [
    { title: '模型/结果名称', dataIndex: 'name', key: 'name' },
    { title: '作业 ID', dataIndex: 'jobId', key: 'jobId' },
    { title: '组件', dataIndex: 'componentName', key: 'componentName' },
    { title: '类型', dataIndex: 'modelType', key: 'modelType' },
    { title: '创建时间', dataIndex: 'gmtCreate', key: 'gmtCreate' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: API.FateModelVO) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => setPreviewModel(record)}
          >
            查看指标
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => openEditModel(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              service.removeModel(record.modelId!, record.clusterId || undefined)
            }
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <span className={styles.sectionEyebrow}>COMPUTE RESOURCE</span>
          <Title level={4}>执行环境</Title>
          <Text type="secondary">选择本次实验使用的计算资源</Text>
        </div>
        <Select
          placeholder="选择 FATE 集群"
          value={service.currentClusterId}
          onChange={handleClusterChange}
          style={{ width: 240, maxWidth: '100%' }}
          disabled={service.clusters.length === 0}
        >
          {service.clusters.map((c) => (
            <Option key={c.clusterId} value={c.clusterId!}>
              {c.name}
            </Option>
          ))}
        </Select>
      </div>
      <Tabs
        className={section ? styles.sectionTabs : undefined}
        activeKey={activeTab}
        onChange={setActiveTab}
      >
        <TabPane tab="集群管理" key="clusters">
          <Card
            title="FATE 集群"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateCluster}
              >
                注册集群
              </Button>
            }
          >
            <Table
              rowKey="clusterId"
              dataSource={service.clusters}
              columns={clusterColumns}
              loading={service.loading}
              pagination={false}
            />
          </Card>
        </TabPane>
        <TabPane tab="作业管理" key="jobs">
          <Card
            title="FATE 作业"
            extra={
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  jobForm.setFieldsValue({ clusterId: service.currentClusterId });
                  setJobError('');
                  setJobFormVisible(true);
                }}
              >
                提交作业
              </Button>
            }
          >
            <Table
              rowKey="jobId"
              dataSource={service.jobs}
              columns={jobColumns}
              loading={service.loading}
              pagination={false}
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <DatabaseOutlined /> 数据集
            </span>
          }
          key="datasets"
        >
          <Card
            title="FATE 数据集"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={openCreateDataset}
              >
                注册数据集
              </Button>
            }
          >
            <Table
              rowKey="datasetId"
              dataSource={service.datasets}
              columns={datasetColumns}
              loading={service.loading}
              pagination={false}
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <FileTextOutlined /> 模型/结果
            </span>
          }
          key="models"
        >
          <Card
            title="FATE 模型与评估结果"
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModel}>
                登记结果
              </Button>
            }
          >
            <Table
              rowKey="modelId"
              dataSource={service.models}
              columns={modelColumns}
              loading={service.loading}
              pagination={false}
            />
          </Card>
        </TabPane>
        <TabPane
          tab={
            <span>
              <ApartmentOutlined /> 画布
            </span>
          }
          key="canvas"
        >
          <Card title="FATE 画布">
            <FateCanvas
              clusterId={service.currentClusterId}
              onClusterChange={handleClusterChange}
              clusters={service.clusters}
              datasets={service.datasets}
              submitting={service.submitting}
              onSubmit={(values) => service.submitJob(values)}
            />
          </Card>
        </TabPane>
      </Tabs>

      <Modal
        title={editingCluster ? '编辑集群' : '注册集群'}
        open={clusterFormVisible}
        onOk={() => clusterForm.submit()}
        onCancel={() => {
          setClusterFormVisible(false);
          setEditingCluster(null);
          clusterForm.resetFields();
        }}
        confirmLoading={service.submitting}
      >
        <Form form={clusterForm} layout="vertical" onFinish={handleSaveCluster}>
          <Form.Item label="集群名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：本地 FATE 2.x" />
          </Form.Item>
          <Form.Item
            label="FATE-Flow 地址"
            name="flowAddress"
            rules={[{ required: true }]}
          >
            <Input placeholder="例如：http://192.168.117.50:9380" />
          </Form.Item>
          <Form.Item label="版本" name="version">
            <Input placeholder="例如：2.0.0" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交 FATE 作业"
        open={jobFormVisible}
        width={900}
        onOk={() => jobForm.submit()}
        onCancel={() => {
          setJobFormVisible(false);
          jobForm.resetFields();
          setJobError('');
        }}
        confirmLoading={service.submitting}
      >
        <Form
          name="fate-submit-job"
          form={jobForm}
          layout="vertical"
          onFinish={handleSubmitJob}
          initialValues={{ config: LOCAL_NATIVE_FATE_CONFIG }}
        >
          <Form.Item label="目标集群" name="clusterId" rules={[{ required: true }]}>
            <Select placeholder="选择已注册的 FATE 集群" onChange={handleClusterChange}>
              {service.clusters.map((c) => (
                <Option key={c.clusterId} value={c.clusterId!}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <FateTemplatePicker
            key={jobClusterId || 'no-cluster'}
            clusterId={jobClusterId}
            datasets={service.datasets}
            target="job"
            disabled={service.submitting}
            onApply={applyJobTemplate}
          />
          {jobError && (
            <Alert
              type="error"
              showIcon
              message={jobError}
              style={{ marginBottom: 16 }}
            />
          )}
          <Form.Item label="作业名称" name="name" rules={[{ required: true }]}>
            <Input placeholder="例如：fate2-psi-lr" />
          </Form.Item>
          <Form.Item label="项目 ID" name="projectId">
            <Input />
          </Form.Item>
          <Form.Item label="画布 ID" name="graphId">
            <Input />
          </Form.Item>
          <Form.Item label="发起方节点 ID" name="initiatorNodeId">
            <Input placeholder="例如：alice" />
          </Form.Item>
          <Form.Item label="DAG (JSON)" name="dag" rules={[{ required: true }]}>
            <TextArea rows={8} placeholder='{"version":"2.0","components":{...}}' />
          </Form.Item>
          <Form.Item
            label="原生 FATE 参与方配置 (JSON)"
            name="config"
            rules={[{ required: true }]}
            extra="本地示例使用独立 FATE Guest/Host 的 party ID。Bob 仅用于 BFIA，Kimi 仅用于隐语，请勿填入此处。"
          >
            <TextArea rows={8} placeholder='{"initiator":{...},"role":{...}}' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingDataset ? '编辑 FATE 数据集' : '注册 FATE 数据集'}
        open={datasetFormVisible}
        onOk={() => datasetForm.submit()}
        onCancel={() => {
          setDatasetFormVisible(false);
          setEditingDataset(null);
          datasetForm.resetFields();
        }}
        confirmLoading={service.submitting}
      >
        <Form form={datasetForm} layout="vertical" onFinish={handleSaveDataset}>
          <Form.Item label="目标集群" name="clusterId" rules={[{ required: true }]}>
            <Select placeholder="选择集群">
              {service.clusters.map((c) => (
                <Option key={c.clusterId} value={c.clusterId!}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="数据集名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="表名" name="tableName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="命名空间" name="namespace" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="角色" name="role">
            <Input placeholder="例如：guest / host" />
          </Form.Item>
          <Form.Item label="Meta (JSON)" name="meta">
            <TextArea rows={4} placeholder='{"columns": [...]}' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingModel ? '编辑 FATE 模型/结果' : '登记 FATE 模型/结果'}
        open={modelFormVisible}
        onOk={() => modelForm.submit()}
        onCancel={() => {
          setModelFormVisible(false);
          setEditingModel(null);
          modelForm.resetFields();
        }}
        confirmLoading={service.submitting}
      >
        <Form form={modelForm} layout="vertical" onFinish={handleSaveModel}>
          <Form.Item label="目标集群" name="clusterId" rules={[{ required: true }]}>
            <Select placeholder="选择集群">
              {service.clusters.map((c) => (
                <Option key={c.clusterId} value={c.clusterId!}>
                  {c.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="关联作业" name="jobId" rules={[{ required: true }]}>
            <Select placeholder="选择作业">
              {service.jobs.map((j) => (
                <Option key={j.jobId} value={j.jobId!}>
                  {j.name || j.jobId}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="组件名" name="componentName">
            <Input placeholder="例如：hetero_lr_0" />
          </Form.Item>
          <Form.Item label="模型类型" name="modelType">
            <Input placeholder="例如：HeteroLR / Evaluation" />
          </Form.Item>
          <Form.Item label="指标 (JSON)" name="metric">
            <TextArea rows={4} placeholder='{"accuracy": 0.9}' />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="FATE 数据集详情"
        open={!!previewDataset}
        footer={null}
        onCancel={() => setPreviewDataset(null)}
        width={640}
      >
        {previewDataset && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="数据集名称">
                {previewDataset.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="集群 ID">
                {previewDataset.clusterId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="表名">
                {previewDataset.tableName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="命名空间">
                {previewDataset.namespace || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="角色">
                {previewDataset.role || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {previewDataset.gmtCreate || '-'}
              </Descriptions.Item>
            </Descriptions>
            <Card title="Meta 信息" size="small">
              <pre className={styles['fate-preview-json']}>
                {JSON.stringify(previewDataset.meta || {}, null, 2)}
              </pre>
            </Card>
          </>
        )}
      </Modal>

      <Modal
        title="FATE 模型/评估指标"
        open={!!previewModel}
        footer={null}
        onCancel={() => setPreviewModel(null)}
        width={720}
      >
        {previewModel && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="名称">
                {previewModel.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="作业 ID">
                {previewModel.jobId || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="组件">
                {previewModel.componentName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="模型类型">
                {previewModel.modelType || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {previewModel.gmtCreate || '-'}
              </Descriptions.Item>
            </Descriptions>
            <Card title="指标详情" size="small">
              {(() => {
                const metricObj = parseMetric(previewModel.metric);
                const numericEntries = Object.entries(metricObj).filter(
                  ([, v]) => typeof v === 'number',
                ) as [string, number][];
                return Object.keys(metricObj).length > 0 ? (
                  <>
                    <Row gutter={[16, 16]}>
                      {numericEntries.map(([k, v]) => (
                        <Col key={k} span={8}>
                          <Statistic
                            title={k}
                            value={v}
                            precision={Number.isInteger(v) ? 0 : 4}
                          />
                        </Col>
                      ))}
                    </Row>
                    {numericEntries.length > 0 && (
                      <div style={{ marginTop: 16 }}>
                        {numericEntries.map(([k, v]) => (
                          <div key={k} style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Text>{k}</Text>
                              <Text strong>{v.toFixed(4)}</Text>
                            </div>
                            <Progress
                              percent={Math.min(Math.max(v * 100, 0), 100)}
                              size="small"
                              status="active"
                              showInfo={false}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <pre
                      className={styles['fate-preview-json']}
                      style={{ marginTop: 16 }}
                    >
                      {JSON.stringify(metricObj, null, 2)}
                    </pre>
                  </>
                ) : (
                  <Text type="secondary">暂无指标数据</Text>
                );
              })()}
            </Card>
          </>
        )}
      </Modal>
    </div>
  );
};
