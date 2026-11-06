import { SearchOutlined } from '@ant-design/icons';
import { Input, Table, Typography, Button, Tag } from 'antd';
import { parse } from 'query-string';
import { type ChangeEvent } from 'react';

import { getModel, Model, useModel } from '@/util/valtio-helper';

import {
  BfiaResultManagerService,
  type BfiaResultVO,
  KindLabelMap,
} from './result-manager.service';
import styles from './index.less';

const { Link } = Typography;

export const BfiaResultManagerComponent = () => {
  const viewInstance = useModel(BfiaResultManagerView);

  const columns = [
    {
      title: '结果ID',
      dataIndex: 'resultId',
      key: 'resultId',
      width: '20%',
      ellipsis: true,
      render: (text: string) => <Link ellipsis>{text}</Link>,
    },
    {
      title: '结果类型',
      dataIndex: 'kind',
      key: 'kind',
      width: '10%',
      render: (kind: string) =>
        kind ? <Tag>{KindLabelMap[kind] || kind}</Tag> : '-',
    },
    {
      title: '来源项目',
      dataIndex: 'projectId',
      key: 'projectId',
      width: '18%',
      ellipsis: true,
    },
    {
      title: '所属节点',
      dataIndex: 'nodeId',
      key: 'nodeId',
      width: '12%',
      ellipsis: true,
    },
    {
      title: '任务ID',
      dataIndex: 'taskId',
      key: 'taskId',
      width: '15%',
      ellipsis: true,
    },
    {
      title: '生成时间',
      dataIndex: 'gmtCreate',
      key: 'gmtCreate',
      width: '15%',
      ellipsis: true,
      render: (gmtCreate: string) => (
        <Typography.Text ellipsis={{ tooltip: gmtCreate || '' }}>
          {gmtCreate || '-'}
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      dataIndex: 'action',
      width: '10%',
      render: (_: string, record: BfiaResultVO) => (
        <Button
          type="link"
          style={{ paddingLeft: 0 }}
          onClick={() => viewInstance.download(record)}
          disabled={!record.outputUri && !record.refId}
        >
          下载
        </Button>
      ),
    },
  ];

  return (
    <div className={styles.main}>
      <div className={styles.toolbar}>
        <div style={{ width: 220 }}>
          <Input
            placeholder="搜索结果名称"
            onChange={viewInstance.searchResult}
            suffix={<SearchOutlined style={{ color: '#aaa' }} />}
          />
        </div>
      </div>
      <div className={styles.content}>
        <Table
          loading={viewInstance.loading}
          dataSource={viewInstance.displayList}
          columns={columns}
          pagination={{
            total: viewInstance.displayList.length || 1,
            pageSize: 10,
            showSizeChanger: false,
          }}
          rowKey={(record) => record.resultId}
        />
      </div>
    </div>
  );
};

export class BfiaResultManagerView extends Model {
  loading = false;

  list: BfiaResultVO[] = [];

  displayList: BfiaResultVO[] = [];

  search = '';

  searchDebounce: number | undefined = undefined;

  resultManagerService = getModel(BfiaResultManagerService);

  onViewMount() {
    const { ownerId } = parse(window.location.search);
    if (ownerId) {
      this.getResultList(ownerId as string);
    }
  }

  getResultList = async (nodeId: string) => {
    this.loading = true;
    await this.resultManagerService.getResultList(nodeId);
    this.list = this.resultManagerService.list;
    this.displayList = this.list;
    this.loading = false;
  };

  searchResult = (e: ChangeEvent<HTMLInputElement>) => {
    this.search = e.target.value;
    clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      const keyword = this.search.toLowerCase();
      this.displayList = this.list.filter(
        (item) =>
          item.resultId?.toLowerCase().includes(keyword) ||
          item.projectId?.toLowerCase().includes(keyword) ||
          item.jobId?.toLowerCase().includes(keyword) ||
          item.taskId?.toLowerCase().includes(keyword),
      );
    }, 300) as unknown as number;
  };

  download = (record: BfiaResultVO) => {
    const { ownerId } = parse(window.location.search);
    this.resultManagerService.download((ownerId as string) || '', record);
  };
}
