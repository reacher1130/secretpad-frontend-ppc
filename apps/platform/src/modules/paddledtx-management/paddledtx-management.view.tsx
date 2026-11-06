import {
  ArrowRightOutlined,
  CheckCircleOutlined,
  ClusterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Empty, Input, Space, Table, Tag } from 'antd';
import { parse, stringify } from 'query-string';
import { useEffect } from 'react';
import { history, useLocation } from 'umi';

import type { PaddleDtxTask } from '@/services/secretpad/PaddleDtxController';
import { useModel } from '@/util/valtio-helper';

import { PaddleDtxManagementService } from './paddledtx-management.service';
import { PaddleTaskWizard } from './task-wizard';
import styles from './workspace.less';

export const PaddleDtxManagementComponent = ({
  section = 'overview',
}: {
  section?: 'overview' | 'task' | 'results';
}) => {
  const service = useModel(PaddleDtxManagementService);
  const location = useLocation();
  const taskId = String(parse(location.search).taskId || '');
  useEffect(() => {
    service.loadStatus();
  }, []);
  useEffect(() => {
    if (section !== 'results') return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const refresh = async () => {
      if (taskId && !service.starting) await service.loadTask(taskId);
      if (stopped) return;
      await service.loadTasks();
      if (!stopped) timer = setTimeout(refresh, 5000);
    };
    void refresh();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [section, taskId]);
  const ready = service.status.ready === true;
  const executors = (service.status.executors || []) as {
    address: string;
    ready: boolean;
    error?: string;
  }[];
  const navigate = (tab: string, selectedTaskId?: string) => {
    const { ownerId, nodeId } = parse(window.location.search);
    history.replace(
      `/edge?${stringify({ ownerId, nodeId, tab, taskId: selectedTaskId })}`,
    );
  };
  const taskStatus = service.lastTask?.task?.status || 'Unknown';
  const statusLabels: Record<string, string> = {
    Publishing: '等待发布',
    Confirming: '等待审批',
    Ready: '等待执行',
    ToProcess: '等待调度',
    Processing: '执行中',
    Finished: '已完成',
    Failed: '执行失败',
    Rejected: '审批拒绝',
    Unknown: '状态待查询',
  };
  if (section === 'task')
    return (
      <PaddleTaskWizard
        service={service}
        onResults={() => navigate('paddledtx-results', service.selectedTaskId)}
      />
    );
  if (section === 'results')
    return (
      <Card
        title="链上任务记录"
        extra={<Button onClick={() => navigate('paddledtx-task')}>发起新任务</Button>}
      >
        <p>最近 100 条本方任务，每 5 秒刷新。更早的任务可按任务 ID 查询。</p>
        <Input.Search
          key={taskId}
          defaultValue={taskId}
          placeholder="输入完整任务 ID，查询或继续已有任务"
          aria-label="查询链桨任务 ID"
          enterButton="查询任务"
          onSearch={(value) => {
            if (value.trim()) navigate('paddledtx-results', value.trim());
          }}
        />
        {(service.listError || service.taskError) && (
          <Alert
            type="warning"
            showIcon
            message={service.taskError || service.listError}
          />
        )}
        <Table<PaddleDtxTask>
          rowKey="taskId"
          dataSource={service.tasks}
          loading={service.tasksLoading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 650 }}
          columns={[
            {
              title: '任务名称',
              dataIndex: 'name',
              render: (name, task) => name || task.taskId,
            },
            { title: '类型', dataIndex: 'type' },
            {
              title: '状态',
              dataIndex: 'status',
              render: (status) => statusLabels[status] || status,
            },
            { title: '发布时间', dataIndex: 'publishTime' },
            {
              title: '操作',
              render: (_, task) => (
                <Button onClick={() => navigate('paddledtx-results', task.taskId)}>
                  查看任务
                </Button>
              ),
            },
          ]}
        />
        {service.lastTask?.taskId === taskId && (
          <div className={styles.result}>
            <Space>
              <Tag
                color={
                  taskStatus === 'Finished'
                    ? 'success'
                    : taskStatus === 'Failed' || taskStatus === 'Rejected'
                    ? 'error'
                    : 'processing'
                }
              >
                {statusLabels[taskStatus] || taskStatus}
              </Tag>
              {taskStatus === 'Ready' && (
                <Button
                  type="primary"
                  loading={service.starting}
                  onClick={() => service.startTask(taskId)}
                >
                  继续执行
                </Button>
              )}
            </Space>
            <h3>任务 {service.lastTask.taskId || '执行反馈'}</h3>
            <p>审批通过后可继续同一任务；刷新页面后可从链上重新查询。</p>
            <details>
              <summary>查看执行日志与返回信息</summary>
              <pre>{JSON.stringify(service.lastTask, null, 2)}</pre>
            </details>
          </div>
        )}
      </Card>
    );
  return (
    <div className={styles.overview}>
      <div className={styles.metrics}>
        <div>
          <small>协作环境</small>
          <strong>{service.loading ? '检查中' : ready ? '已就绪' : '需处理'}</strong>
          <span>
            {ready
              ? '可以发起训练与预测任务'
              : service.status.error || '请检查请求端、执行器与模型存储状态'}
          </span>
        </div>
        <div>
          <small>可用执行器</small>
          <strong>
            {service.loading
              ? '—'
              : `${executors.filter((node) => node.ready).length} / ${
                  executors.length
                }`}
          </strong>
          <span>基于最近一次链上查询</span>
        </div>
        <div>
          <small>请求端</small>
          <strong>
            {service.loading
              ? '—'
              : service.status.requesterConfigured
              ? '已配置'
              : '未配置'}
          </strong>
          <span>任务发布与协同调度入口</span>
        </div>
      </div>
      {service.status.error && (
        <Alert type="warning" showIcon message={service.status.error} />
      )}
      <Card
        title="协同执行网络"
        extra={
          <Button
            icon={<ReloadOutlined />}
            loading={service.loading}
            onClick={() => service.loadStatus()}
          >
            刷新状态
          </Button>
        }
      >
        <div className={styles.network}>
          <div className={styles.requester}>
            <ClusterOutlined />
            <strong>本方请求端</strong>
            <span>组织数据 · 发布任务</span>
            <Tag color={service.status.requesterConfigured ? 'success' : 'default'}>
              {service.status.requesterConfigured ? '已配置' : '等待配置'}
            </Tag>
          </div>
          <div className={styles.connection}>
            <span />
            <ArrowRightOutlined />
          </div>
          <div className={styles.executorList}>
            {executors.map((node, index) => (
              <div className={styles.executor} key={node.address}>
                <span className={styles.executorIcon}>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong>协作执行器 {index + 1}</strong>
                  <span>{node.ready ? '链上查询成功' : node.error || '暂不可用'}</span>
                </div>
                <Tag color={node.ready ? 'success' : 'warning'}>
                  {node.ready ? '可用' : '需检查'}
                </Tag>
              </div>
            ))}
            {!executors.length && (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={service.loading ? '正在查询执行器' : '暂无执行器信息'}
              />
            )}
          </div>
        </div>
        <details className={styles.diagnostics}>
          <summary>连接诊断详情</summary>
          <dl>
            <dt>计算引擎</dt>
            <dd>{service.status.engine || 'paddlempc'}</dd>
            <dt>探测响应</dt>
            <dd>{service.status.httpStatus || '—'}</dd>
            {executors.map((node) => (
              <div key={node.address}>
                <dt>执行器地址</dt>
                <dd>{node.address}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Card>
      <div className={styles.startCard}>
        <div>
          <span className={styles.kicker}>READY FOR YOUR NEXT TASK</span>
          <h2>从一次计算，开启可信协作</h2>
          <p>选择训练或预测，指定双方数据，再确认执行参数。</p>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<CheckCircleOutlined />}
          onClick={() => navigate('paddledtx-task')}
        >
          开始配置任务
        </Button>
      </div>
    </div>
  );
};
