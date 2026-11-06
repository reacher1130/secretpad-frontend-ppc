import { Empty, Button, Popover, Space, Table, Badge, Tooltip, message, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MessageInstance } from 'antd/es/message/interface';
import { getModel, Model, useModel } from '@/util/valtio-helper';
import { toDoDataList, auditConfirmData } from '@/services/secretpad/connectivity/ToDoDataController';
import { formatTimestamp } from '@/modules/dag-result/utils';
import { confirm } from '@/components/comfirm-delete';
import styles from './index.less';
export const TodoDataComponent = () => {
  const viewInstance = useModel(TodoDataComponentView);
  const [messageApi, contextHolder] = message.useMessage();
  const handleConfirm = (record: API.ToDoDataListVO, actionFlag: boolean) => {
    confirm({
      title: `确认要${actionFlag ? '同意' : '拒绝'}${record.applyNodeName}对「${record.name || ''}」申请吗？`,
      description: ``,
      onOk: () => {
        viewInstance.confirmData(
          record.auditId || '',
          actionFlag,
          record.name as string,
          messageApi,
        );
      },
    });
  };
  const columns: ColumnsType<API.ToDoDataListVO> = [
    {
      title: '序号',
      dataIndex: 'index',
      align: 'center',
      render: (_, record, index) => index + 1,
    },
    {
      title: '数据表名',
      dataIndex: 'name',
      key: 'name',
      align: 'center',
    },
    {
      title: '申请方',
      dataIndex: 'applyNodeName',
      key: 'applyNodeName',
      align: 'center',
    },
    {
      title: '申请授权范围',
      dataIndex: 'authScope',
      key: 'authScope',
      align: 'center',
      render: (authScope: string) => (
        <>
          {
            authScope ? '项目' : '节点'
          }
        </>
      )
    },
    // {
    //   title: '数据类型',
    //   dataIndex: 'datasourceType',
    //   key: 'datasourceType',
    //   width: '15%',
    //   ellipsis: true,
    // },
    {
      title: '数据创建时间',
      dataIndex: 'datasetCreateTime',
      key: 'datasetCreateTime',
      align: 'center',
      render: (datasetCreateTime: number) => (
        <Typography.Text
          ellipsis={{
            tooltip: `${formatTimestamp(String(datasetCreateTime * 1000))}`,
          }}
        >
          {formatTimestamp(String(datasetCreateTime * 1000))}
        </Typography.Text>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      align: 'center',
      render: (applyTime: number) => (
        <Typography.Text
          ellipsis={{
            tooltip: `${formatTimestamp(String(applyTime * 1000))}`,
          }}
        >
          {formatTimestamp(String(applyTime * 1000))}
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      align: 'center',
      width: 130,
      fixed: 'right',
      render: (
        tableInfo: API.ToDoDataListVO,
      ) => {
        return (
          <div>
            <Space>
              <Button
                type="link"
                onClick={() => handleConfirm(tableInfo, true)}
              >
                同意
              </Button>
            </Space>
            <Space>
              <Button
                type="link"
                onClick={() => (handleConfirm(tableInfo, false))}
              >
                拒绝
              </Button>
            </Space>

          </div>
        );
      }
    }
  ];
  return (
    <div className={styles.mydayaList}>
      <div className={styles.content}>
        <Table
          scroll={{ x: 'max-content' }}
          loading={viewInstance.loading}
          dataSource={viewInstance.displayTableList}
          columns={columns}
          onChange={(pagination, filters, sorter) => {
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
          rowKey={(record) => record.auditId as string}
        />
      </div>
      {contextHolder}
    </div>
  );
}

export class TodoDataComponentView extends Model {
  pageNumber = 1;

  pageSize = 10;

  totalNum = 1;

  loading = false;

  pageList: API.ToDoDataListVO[] = [];

  displayTableList: API.ToDoDataListVO[] = [];

  tableInfo: API.ToDoDataListVO = {

  };

  onViewMount() {
    this.getPageList();
  }

  async getPageList() {
    const list = await toDoDataList({
      page_num: this.pageNumber,
      page_size: this.pageSize,
    });
    this.loading = false;
    this.totalNum = list?.data?.total || 0;
    this.pageList = list?.data?.records || [];
    this.displayTableList = this.pageList;
  }

  confirmData = async (
    auditId: string,
    actionFlag: boolean,
    name: string,
    messageApi: MessageInstance,
  ) => {

    const { status } = await auditConfirmData({
      audit_id: auditId,
      status: actionFlag ? 'APPROVED' : 'REJECTED',
    });
    if (status && status.code !== 0) {
      messageApi.error(status.msg);
      return;
    }
    messageApi.success(`「${name}」审批成功！`);
    this.getPageList();
  };
}
