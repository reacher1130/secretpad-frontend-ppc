import React, { useEffect, useState } from 'react';
import { history, useLocation } from 'umi'
import classNames from 'classnames';
import { parse, stringify } from 'query-string';
import { DatabaseOutlined, LeftOutlined } from '@ant-design/icons';
import { Button, Tooltip, Table, Space, Typography, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { confirm } from '@/components/comfirm-delete';
import { flowList, applyFlow, confirmFlow } from '@/services/secretpad/connectivity/FlowController';
import { formatTimestamp } from '@/modules/dag-result/utils';
import { getModel, Model, useModel } from '@/util/valtio-helper';
import { AddFlowDrawer } from '@/modules/connectivity/flow-list/add-flow-modal'
import styles from './index.less';
import { getPlatformNodeId } from '@/components/platform-wrapper';

interface ApplyMap {
  APPROVED: string;
  REJECTED: string;
  TERMINATED: string;
  APPLIED: string;
  UNAPPROVED: string;
}
const applyMap: ApplyMap = {
  APPROVED: '已同意',
  REJECTED: '已拒绝',
  TERMINATED: '已解除',
  APPLIED: '申请中',
  UNAPPROVED: '审批中',
}

const applyColorMap = {
  APPROVED: 'success',
  REJECTED: 'error',
  TERMINATED: 'error',
  APPLIED: 'processing',
  UNAPPROVED: 'warning',
}

export const ConnectivityFlowComponent: React.FC = () => {
  const viewInstance = useModel(FlowListView);
  const { handleCreateFlow } = viewInstance;
  const [messageApi, contextHolder] = message.useMessage();
  const { nodeId: queryNodeId, ownerId, projectName } = parse(window.location.search);
  // BFIA mode uses ownerId in the URL; fall back to it
  const nodeId = getPlatformNodeId() || queryNodeId;
  const goBack = () => {
    history.replace(
      {
        pathname: '/edge',
        search: stringify({ nodeId, ownerId: ownerId || nodeId, tab: 'connectivity-my-project' }),
      },
    );
  }
  const handleApply = async (record: API.FlowListVO_Content) => {
    const { status } = await applyFlow({ projectId: viewInstance.projectId, flowId: record.flowId })
    if (status?.code === 0) {
      message.success('操作成功');
      viewInstance.getPageList();
    } else {
      message.error(status.msg);
    }
  }
  const handleConfirm = (record: API.FlowListVO_Content, actionFlag: boolean) => {
    confirm({
      title: `确认要${actionFlag ? '同意' : '拒绝'}${record.applyNodeName}对「${record.name || ''}」申请吗？`,
      description: ``,
      onOk: async () => {
        const { status } = await confirmFlow({ status: actionFlag ? 'APPROVED' : 'REJECTED', audit_id: record.auditId })
        if (status?.code === 0) {
          message.success('操作成功');
          viewInstance.getPageList();
        }
      },
    });
  }
  const columns: ColumnsType<API.FlowListVO_Content> = [
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      render: (_, record, index) => index + 1,
    },
    {
      title: '流程名',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
      render: (name: string, record: API.FlowListVO_Content) => (
        <Tooltip title={name}>
          <a
            onClick={() => {
              window.localStorage.setItem('flowListUrl', window.location.href);
              window.localStorage.setItem('fisrtJumpToflowListUrlFlag', '1');
              history.push(
                {
                  pathname: '/connectivity-dag',
                  search: `projectId=${viewInstance.projectId}&projectName=${projectName}&mode=${viewInstance.computeMode || 'MPC'
                    }&type=${viewInstance.computeFunc || 'DAG'}&dagId=${record.flowId}&flowName=${record.name}&nodeId=${nodeId}&ownerId=${record.ownerId}&isDraft=${record.isDraft}&status=${record.status}`,
                },
                {
                  origin: 'my-project',
                },
              )
            }}
          >
            {name}
          </a>
        </Tooltip>
      ),
    },
    {
      title: '申请方',
      dataIndex: 'applyNodeName',
      key: 'applyNodeName',
      align: 'center',
      render: (applyNodeName: string | null) => {
        return applyNodeName || '--';
      }
    },
    {
      title: '审批方',
      dataIndex: 'participantNodeName',
      key: 'participantNodeName',
      align: 'center',
      render: (participantNodeName: string | null) => {
        return participantNodeName || '--';
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      ellipsis: true,
      render: (status: string | null) => {
        if (status) {
          return <Tag bordered={false} color={status && applyColorMap[status]}>{status && applyMap[status]}</Tag>
        }
        return '--';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      align: 'center',
      render: (gmtCreate: number) => (
        !gmtCreate ? '--' : (<Typography.Text
          ellipsis={{
            tooltip: `${formatTimestamp(String(gmtCreate * 1000))}`,
          }}
        >
          {formatTimestamp(String(gmtCreate * 1000))}
        </Typography.Text>
        )),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      align: 'center',
      render: (applyTime: number) => (
        !applyTime ? '--' : (<Typography.Text
          ellipsis={{
            tooltip: `${formatTimestamp(String(applyTime * 1000))}`,
          }}
        >
          {formatTimestamp(String(applyTime * 1000))}
        </Typography.Text>
        )),
    },
    {
      title: '审批结束时间',
      dataIndex: 'approvedTime',
      key: 'approvedTime',
      align: 'center',
      render: (approvedTime: number) => (
        !approvedTime ? '--' : (<Typography.Text
          ellipsis={{
            tooltip: `${formatTimestamp(String(approvedTime * 1000))}`,
          }}
        >
          {formatTimestamp(String(approvedTime * 1000))}
        </Typography.Text>)
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      align: 'center',
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 130,
      fixed: 'right',
      render: (_, record: API.FlowListVO_Content) => {
        return (
          <div>
            <Space>
              {/* <Button
                type="link"
                onClick={() => {
                  window.localStorage.setItem('flowListUrl', window.location.href);
                  window.localStorage.setItem('fisrtJumpToflowListUrlFlag', '1');
                  history.push(
                    {
                      pathname: '/connectivity-dag',
                      search: `projectId=${viewInstance.projectId}&projectName=${projectName}&mode=${viewInstance.computeMode || 'MPC'
                        }&type=${viewInstance.computeFunc || 'DAG'}&dagId=${record.flowId}&flowName=${record.name}&nodeId=${nodeId}&ownerId=${record.ownerId}&isDraft=${record.isDraft}&status=${record.status}`,
                    },
                    {
                      origin: 'my-project',
                    },
                  )
                }}
              >
                查看
              </Button> */}
              {
                !record.status && record.ownerId === nodeId &&
                (
                  <Tooltip
                    title={record.isDraft != 1 ? '操作查看后点击提交成功后才允许申请' : ''}
                  >
                    <Button
                      type="link"
                      disabled={record.isDraft != 1}
                      onClick={
                        () => handleApply(record)
                      }
                    >
                      申请
                    </Button>
                  </Tooltip>
                )
              }
              {
                (record.status === 'UNAPPROVED' && record.ownerId !== nodeId) &&
                (<Button
                  type="link"
                  onClick={
                    () => handleConfirm(record, true)
                  }
                >
                  同意
                </Button>)
              }
              {
                (record.status === 'UNAPPROVED' && record.ownerId !== nodeId) &&
                (<Button
                  type="link"
                  onClick={
                    () => handleConfirm(record, false)
                  }
                >
                  拒绝
                </Button>)
              }
            </Space>
          </div>
        )
      },
    }
  ]
  return (
    <div className={classNames(styles.projectList)}>
      <div className={styles.projectListHeader}>
        <Space>
          <LeftOutlined />
          <div onClick={goBack}>返回</div>
          <div className={styles.line} />
          <div className={styles.projectName}>{projectName}</div>
        </Space>
        <Button type="primary" onClick={handleCreateFlow}>新建流程</Button>
      </div>
      <div className={styles.content}>
        {/* <div className={styles.applyContent}>
          <Space>
            <Tag className={styles.tagApply}>发起</Tag>
            <div className={styles.nodeName}>
              <DatabaseOutlined />
              {initiatorName}{nodeId === initiatorNodeId && <div>(我的)</div>}
            </div>
          </Space>
          <div className={styles.tagProcessBox}>
            <Space>
              <Tag className={styles.tagProcess}>受邀</Tag>
              <div className={styles.nodeName}>
                <DatabaseOutlined />
                {partyVoteName}{nodeId === partyVoteId && <div>(我的)</div>}
              </div>
            </Space>
          </div>
        </div> */}
        <Table
          scroll={{ x: 'max-content' }}
          loading={viewInstance.loading}
          dataSource={viewInstance.displayTableList}
          columns={columns}
          onChange={(pagination, filters, sorter) => {
            // viewInstance.typeFilters = filters?.datasourceType as FilterValue;
            viewInstance.getPageList();
          }}
          pagination={{
            total: viewInstance.totalNum || 1,
            current: viewInstance.pageNumber,
            pageSize: viewInstance.pageSize,
            onChange: (page, pageSize) => {
              viewInstance.pageNumber = page;
              viewInstance.pageSize = pageSize;
            },
            size: 'default',
            showSizeChanger: true,
          }}
          size="small"
          rowKey={(record) => record.flowId as string}
        />
      </div>
      <AddFlowDrawer
        projectId={viewInstance.projectId}
        open={viewInstance.showAddFlowDrawer}
        onClose={() => (viewInstance.showAddFlowDrawer = false)}
        onOk={
          // () => viewInstance.getPageList()
          ({ flowId, flowName }: { flowId: string; flowName: string }) => {
            window.localStorage.setItem('fisrtJumpToflowListUrlFlag', '1');
            window.localStorage.setItem('flowListUrl', window.location.href);
            history.push(
              {
                pathname: '/connectivity-dag',
                search: `projectId=${viewInstance.projectId}&projectName=${viewInstance.projectName}&mode=${viewInstance.computeMode || 'MPC'
                  }&type=${viewInstance.computeFunc || 'DAG'}&dagId=${flowId}&flowName=${flowName}&nodeId=${nodeId}&ownerId=${nodeId}&isDraft=${0}`,
              },
              {
                origin: 'my-project',
              },
            )
          }
        }
      />
      {contextHolder}
    </div>
  )
}

export class FlowListView extends Model {
  projectId = '';

  projectName = '';

  computeMode = '';

  computeFunc = '';

  showAddFlowDrawer = false;

  pageNumber = 1;

  pageSize = 10;

  totalNum = 1;

  loading = false;

  pageList: API.FlowListVO_Content[] = [];

  displayTableList: API.FlowListVO_Content[] = [];

  handleCreateFlow = () => {
    this.showAddFlowDrawer = true;
  };

  onViewMount() {
    const { projectId } = parse(window.location.search);
    if (projectId) {
      this.projectId = projectId as string;
    }
    this.getPageList();
  }

  async getPageList() {
    const list = await flowList({
      page_num: this.pageNumber,
      page_size: this.pageSize,
      projectId: this.projectId as string,
    });
    this.loading = false;
    this.totalNum = list?.data?.totalElements || 0;
    this.pageList = (list?.data?.content || [])
    // .map((item) => {
    //   return {
    //     ...item,
    //     projectFlowDOName: item.projectFlowDO?.name || '',
    //     projectFlowDODescription: item.projectFlowDO?.description || '',
    //     projectFlowDOStatus: item.projectFlowDO?.status || '',
    //   }
    // });
    this.displayTableList = this.pageList;
  }
}
