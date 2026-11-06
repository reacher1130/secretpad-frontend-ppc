import { Alert, Button, Space, Spin, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

import { Model, useModel } from '@/util/valtio-helper';

import { AddCooperativeNodeDrawer } from './add-cooperative-node-modal';
import { ConfirmCooperativeNodeModal } from './confirm-cooperativeNode-modal';
import {
  listConfiguredPeers,
  listCooperationRequests,
  type ConfiguredPeer,
  type CooperationRequest,
} from './cooperative-node.service';
import styles from './index.less';

const requestStatus: Record<string, { label: string; color: string }> = {
  APPROVED: { label: '已同意', color: 'success' },
  REJECTED: { label: '已拒绝', color: 'error' },
  TERMINATED: { label: '已解除', color: 'default' },
  APPLIED: { label: '申请中', color: 'processing' },
  UNAPPROVED: { label: '待审批', color: 'warning' },
  EXPIRED: { label: '已过期', color: 'default' },
};

export const ConnectivityCooperativeNodeListComponent = () => {
  const view = useModel(CooperativeNodeView);

  const columns: ColumnsType<CooperationRequest> = [
    {
      title: '合作方节点',
      dataIndex: 'name',
      render: (name, row) => name || row.nodeId || '—',
    },
    { title: '所属机构', dataIndex: 'institution' },
    { title: '合作申请 ID', dataIndex: 'contractId' },
    { title: '发起方节点', dataIndex: 'initiatorNodeName' },
    {
      title: '方向',
      dataIndex: 'direction',
      render: (direction: CooperationRequest['direction']) => {
        if (direction === 'INBOUND') return '收到的';
        if (direction === 'OUTBOUND') return '发出的';
        return '—';
      },
    },
    {
      title: '过期时间',
      dataIndex: 'expiredTime',
      render: (expiredTime: number | undefined) =>
        expiredTime ? dayjs.unix(expiredTime).format('YYYY-MM-DD HH:mm:ss') : '—',
    },
    { title: '认证方式', dataIndex: 'authType' },
    { title: '参与方地址', dataIndex: 'address' },
    {
      title: '申请状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag bordered={false} color={requestStatus[status]?.color}>
          {requestStatus[status]?.label ?? status}
        </Tag>
      ),
    },
    { title: '描述', dataIndex: 'description' },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 130,
      render: (_, record) =>
        record.canConfirm === true &&
        record.status === 'UNAPPROVED' && (
          <Space>
            <Button type="link" onClick={() => view.chooseDecision(record, 'APPROVED')}>
              同意
            </Button>
            <Button type="link" onClick={() => view.chooseDecision(record, 'REJECTED')}>
              拒绝
            </Button>
          </Space>
        ),
    },
  ];

  return (
    <div className={styles.cooperativeNodeList}>
      <div className={styles.nodeListHeader}>
        <Typography.Title level={5}>已配置合作节点</Typography.Title>
        <Space>
          <Button
            onClick={() => view.refresh()}
            disabled={view.loadingRequests || view.loadingPeers}
          >
            刷新
          </Button>
          <Button
            type="primary"
            disabled={!view.peers.length || view.loadingPeers || !!view.peersError}
            onClick={() => (view.showAddCooperativeNodeDrawer = true)}
          >
            申请合作节点
          </Button>
        </Space>
      </div>
      {view.peersError ? (
        <Alert type="error" showIcon message={view.peersError} />
      ) : (
        <Spin spinning={view.loadingPeers}>
          {view.peers.length ? (
            <Space wrap>
              {view.peers.map((peer) => (
                <Space key={peer.nodeId}>
                  <Tag>{peer.nodeName || peer.name || peer.nodeId}</Tag>
                  {peer.netAddress && (
                    <Typography.Text type="secondary">
                      {peer.netAddress}
                    </Typography.Text>
                  )}
                </Space>
              ))}
            </Space>
          ) : (
            <Typography.Text type="secondary">
              {view.loadingPeers ? '正在加载合作节点' : '暂无已配置合作节点'}
            </Typography.Text>
          )}
        </Spin>
      )}
      <div className={styles.content}>
        <Typography.Title level={5}>合作申请记录</Typography.Title>
        {view.requestsError ? (
          <Alert type="error" showIcon message={view.requestsError} />
        ) : (
          <Table
            scroll={{ x: 'max-content' }}
            loading={view.loadingRequests}
            dataSource={view.requests}
            columns={columns}
            locale={{
              emptyText: view.loadingRequests ? '正在加载合作申请' : '暂无合作申请',
            }}
            pagination={{
              total: view.total,
              current: view.pageNumber,
              pageSize: view.pageSize,
              onChange: (page, pageSize) => view.getRequests(page, pageSize),
              showSizeChanger: true,
            }}
            size="small"
            rowKey="contractId"
          />
        )}
      </div>
      <AddCooperativeNodeDrawer
        open={view.showAddCooperativeNodeDrawer}
        onClose={() => (view.showAddCooperativeNodeDrawer = false)}
        onOk={() => view.getRequests(1)}
        peers={view.peers}
      />
      {view.decision && (
        <ConfirmCooperativeNodeModal
          open
          onClose={() => (view.decision = undefined)}
          confirmStatus={view.decision.status}
          data={view.decision.request}
          onOk={() => view.getRequests()}
        />
      )}
    </div>
  );
};

class CooperativeNodeView extends Model {
  requests: CooperationRequest[] = [];
  peers: ConfiguredPeer[] = [];
  total = 0;
  pageNumber = 1;
  pageSize = 10;
  loadingRequests = true;
  loadingPeers = true;
  requestsError = '';
  peersError = '';
  showAddCooperativeNodeDrawer = false;
  decision?: { request: CooperationRequest; status: 'APPROVED' | 'REJECTED' };
  requestVersion = 0;

  onViewMount() {
    this.refresh();
  }

  onViewUnMount() {
    this.showAddCooperativeNodeDrawer = false;
    this.decision = undefined;
  }

  chooseDecision(request: CooperationRequest, status: 'APPROVED' | 'REJECTED') {
    this.decision = { request, status };
  }

  refresh() {
    void this.getRequests();
    void this.getPeers();
  }

  async getRequests(page = this.pageNumber, pageSize = this.pageSize) {
    this.pageNumber = page;
    this.pageSize = pageSize;
    const version = ++this.requestVersion;
    this.loadingRequests = true;
    this.requestsError = '';
    try {
      const data = await listCooperationRequests(page, pageSize);
      if (version === this.requestVersion) {
        this.requests = data.records;
        this.total = data.total;
      }
    } catch (error) {
      if (version === this.requestVersion) {
        this.requestsError =
          error instanceof Error ? error.message : '合作申请加载失败';
      }
    } finally {
      if (version === this.requestVersion) this.loadingRequests = false;
    }
  }

  async getPeers() {
    this.loadingPeers = true;
    this.peersError = '';
    try {
      this.peers = await listConfiguredPeers();
    } catch (error) {
      this.peersError =
        error instanceof Error ? error.message : '已配置合作节点加载失败';
    } finally {
      this.loadingPeers = false;
    }
  }
}
