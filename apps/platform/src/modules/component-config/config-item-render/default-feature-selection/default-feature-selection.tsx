import { useDeepCompareEffect } from 'ahooks';
import { Form } from 'antd';
import { parse } from 'query-string';
import { useState, useMemo } from 'react';

import {
  getProject,
  getProjectAllOutTable,
} from '@/services/secretpad/ProjectController';

import type { AtomicConfigNode } from '../../component-config-protocol';
import styles from '../../index.less';
import type { RenderProp } from '../config-render-protocol';

import { SingleTableFeatureSelection } from './feature-selection-only-one';
import { MultiTableFeatureSelection } from './table-feature-selection';

interface IDataTable {
  datatableId: string;
  datatableName: string;
  label: string;
  value: string | string[];
  nodeId: string;
}
interface IOutputDataTable {
  datatableId: string;
  datatableName: string;
  graphNodeId: string;
  nodeId: string;
}

export const DefaultMultiTableFeatureSelection = (
  config: RenderProp<string>,
): React.ReactNode => {
  const { node, defaultVal, translation, upstreamTables = [], disabled } = config;
  const atomicNode = node as AtomicConfigNode;
  const { fromInputIndex, prefixes, name, docString } = atomicNode;
  const [tables, setTables] = useState<IDataTable[]>([]);
  const [outputTables, setOutputTables] = useState<IOutputDataTable[]>([]);

  useDeepCompareEffect(() => {
    const getTables = async () => {
      const dataTableList: IDataTable[] = [];
      const { search } = window.location;
      const { projectId, dagId } = parse(search) as {
        projectId: string;
        dagId: string;
      };

      const { data } = await getProject({ projectId });
      const { data: outputData } = await getProjectAllOutTable({
        projectId,
        graphId: dagId,
      });

      if (outputData?.nodes) {
        setOutputTables(
          outputData.nodes.reduce<IOutputDataTable[]>(
            (ret, { outputs, graphNodeId }) =>
              outputs && graphNodeId
                ? ret.concat(
                    outputs.map((output) => ({
                      graphNodeId,
                      datatableId: output,
                      datatableName: output,
                      nodeId: '',
                    })),
                  )
                : ret,
            [],
          ),
        );
      }
      if (!data) return;

      const { nodes } = data;
      if (!nodes) return;

      nodes.map((_node) => {
        const { datatables } = _node;
        if (!datatables) return;
        datatables.map((table) =>
          dataTableList.push({
            ...table,
            nodeId: _node?.nodeId,
          } as IDataTable),
        );
      });

      setTables(
        dataTableList.filter(
          ({ datatableId }) => (upstreamTables as string[]).indexOf(datatableId) > -1,
        ),
      );
    };

    getTables();
  }, [upstreamTables]);

  const fromTable = useMemo(() => {
    if (fromInputIndex !== undefined && upstreamTables[fromInputIndex]) {
      const tableName = upstreamTables[fromInputIndex];

      return outputTables.find(({ datatableName }) => datatableName === tableName);
    }
  }, [fromInputIndex, upstreamTables, outputTables]);

  return (
    <Form.Item
      label={<div className={styles.configItemLabel}>{translation[name] || name}</div>}
      name={prefixes && prefixes.length > 0 ? prefixes.join('/') + '/' + name : name}
      tooltip={translation[docString] || docString}
      messageVariables={{ label: translation[name] || name }}
      rules={[
        {
          required: atomicNode.isRequired,
        },
        {
          validator: async (_, value) => {
            // it's required
            if (
              atomicNode.is_optional !== true &&
              atomicNode.col_min_cnt_inclusive &&
              atomicNode.col_min_cnt_inclusive !== 0
            ) {
              if (
                value?.filter((val: string | undefined | null) => {
                  if (val === null || val === undefined) {
                    return false;
                  }
                  return true;
                }).length < atomicNode.col_min_cnt_inclusive
              ) {
                throw new Error(`请至少选择${atomicNode.col_min_cnt_inclusive}个特征`);
              }
            }

            if (atomicNode.col_max_cnt_inclusive && atomicNode.col_max_cnt_inclusive !== 0) {
              if (
                value?.filter((val: string | undefined | null) => {
                  if (val === null || val === undefined) {
                    return false;
                  }
                  return true;
                }).length > atomicNode.col_max_cnt_inclusive
              ) {
                throw new Error(`至多选择${atomicNode.col_max_cnt_inclusive}个特征`);
              }
            }
          },
        },
      ]}
      initialValue={defaultVal}
      colon={false}
    >
      {atomicNode.col_max_cnt_inclusive === 1 ? (
        // 最多只能选择一列则变为单选下拉框
        <SingleTableFeatureSelection tableKeys={tables} fromTableKey={fromTable} />
      ) : (
        <MultiTableFeatureSelection
          tableKeys={tables} // 上游的输出表
          outputTableKeys={outputTables} // 上游所有的输出表
          size={'small'}
          fromTableKey={fromTable} // 上游输入的样本表
          disabled={disabled}
          rules={{
            min: atomicNode.col_min_cnt_inclusive || 0,
            max: atomicNode.col_max_cnt_inclusive,
          }}
        />
      )}
    </Form.Item>
  );
};
