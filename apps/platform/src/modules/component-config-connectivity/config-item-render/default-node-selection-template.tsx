import { Form, Select } from 'antd';
import { parse } from 'query-string';
import { useState, useEffect } from 'react';
import { useLocation } from 'umi';

// import { NodeService } from '@/modules/node'; // 替换旧的api，全量引入文件导致请求了老式多语言组件配置组件列表接口
import { getNodeApprovedList } from '@/services/secretpad/connectivity/P2PProjectController';
import { getProject } from '@/services/secretpad/connectivity/ProjectController';
// import { useModel } from '@/util/valtio-helper';

import type { AtomicConfigNode } from '../component-config-protocol';
import styles from '../index.less';

import type { RenderProp } from './config-render-protocol';
import { getComponentByRenderStrategy } from './helper';

export const DefaultNodeSelect = (config: RenderProp<string>): React.ReactNode => {
  const {
    form,
    onChange,
    value,
    defaultVal,
    node,
    translation,
    upstreamTables = [],
    componentConfig,
    attrConfig,
  } = config;
  const [nodes, setNodes] = useState<{ label: string; value: string }[]>([]);
  // const nodeService = useModel(NodeService);

  const isNoWrap = !!attrConfig?.style?.noWrap;

  const { prefixes, list_max_length_inclusive } = node as AtomicConfigNode;

  const { search } = useLocation();
  const { projectId } = parse(search) as { projectId: string };

  let isMultiple = true;
  if (list_max_length_inclusive === 1) isMultiple = false;

  useEffect(() => {
    const getNodes = async () => {
      const nodeList = [] as { label: string; value: string }[];

      const { data } = await getProject({ projectId });

      const { nodes: nodeLs } = data || {};
      if (nodeLs) {
        const dataTableList: (API.ProjectDatatableBaseVO & {
          nodeId: string | undefined;
          nodeName: string | undefined;
        })[] = [];
        nodeLs.map((_node) => {
          const { datatables } = _node;
          if (!datatables) return;
          datatables.map((table) =>
            dataTableList.push({
              ...table,
              nodeId: _node?.nodeId,
              nodeName: _node?.nodeName,
            }),
          );
        });

        upstreamTables.map((upstream) => {
          if (upstream) {
            const participatedNode = dataTableList.find(
              (table) => table.datatableId === upstream,
            );
            if (
              participatedNode &&
              !nodeList.find(({ value }) => value === participatedNode.nodeId)
            )
              nodeList.push({
                value: participatedNode.nodeId as string,
                label: participatedNode.nodeName as string,
              });
            setNodes(nodeList);
          }
        });
      } else {
        // const fetchedNodes = await nodeService.listNode();
        const res = await getNodeApprovedList();
        const list = res?.data || [];
        list.forEach((i) => {
          const item = i as { contractId?: string; name?: string };
          if (!item.contractId || !item.name) return;
          nodeList.push({
            value: item.contractId,
            label: item.name,
          });
        });
        setNodes(nodeList);
      }
    };
    getNodes();
  }, []);

  const item = (
    <Form.Item
      label={
        <div className={styles.configItemLabel}>
          {translation[node.name] || node.name}
        </div>
      }
      name={
        node.prefixes && node.prefixes.length > 0
          ? node.prefixes.join('/') + '/' + node.name
          : node.name
      }
      messageVariables={{ label: translation[node.name] || node.name }}
      tooltip={translation[node.docString] || node.docString}
      rules={[
        {
          required: node.isRequired,
        },
      ]}
      initialValue={defaultVal}
      colon={false}
      labelCol={isNoWrap ? { span: 12 } : undefined}
    >
      <Select
        mode={isMultiple ? 'multiple' : undefined}
        value={value}
        options={nodes}
        onChange={(val) => {
          onChange(val);
        }}
      />
    </Form.Item>
  );

  return getComponentByRenderStrategy({
    prefixes,
    componentConfig,
    component: item,
    form,
    type: node.type,
    name: node.name,
  });
};
