import React, { useEffect, useState } from 'react';
import { Drawer, Form, Space, Button, Typography, Select, Table, Badge } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CloseOutlined } from '@ant-design/icons';
import { authHistory } from '@/services/secretpad/connectivity/DataController';
import { formatTimestamp } from '@/modules/dag-result/utils';

interface PropsData {
  tableInfo: API.MyDataListVO;
  // node: API.NodeVO;
}
interface IProps<T> {
  open: boolean;
  onClose: () => void;
  // onOk: () => void;
  data: T;
}
type OptionType = {
  label: string;
  value: string;
};
const { Option } = Select;

export const AuthHistoryDrawer: React.FC<IProps<PropsData>> = ({
  open,
  onClose,
  // onOk,
  data,
}) => {
  const [form] = Form.useForm();
  const [nodeList, setNodeList] = useState<OptionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [displayTableList, setDisplayTableList] = useState<API.CooperationHistoryVO_[]>([]);
  const handleClose = () => {
    form.resetFields();
    onClose();
  }

  const onFinish = async (values: any) => {
    setLoading(true);
    const params: { datasetId: string, status?: string } = {
      datasetId: data.tableInfo.dataset_id,
    }
    if (values.status) {
      params.status = values.status;
    }
    const res = await authHistory(params);
    setLoading(false);
    if (res?.status && (res?.status?.code === 0)) {
      setDisplayTableList((res.data as API.CooperationHistoryVO_[]) || [])
    }
  };
  const columns: ColumnsType<API.CooperationHistoryVO_> = [
    {
      title: '序号',
      dataIndex: 'index',
      width: 80,
      render: (_, record, index) => index + 1,
    },
    {
      title: '授权范围',
      dataIndex: 'authScope',
      key: 'authScope',
      width: '25%',
      ellipsis: true,
      render: (authScope: string) => (
        <>
          {
            authScope ? '项目' : '节点'
          }
        </>
      )
    },
    {
      title: '授权结果',
      dataIndex: 'status',
      key: 'status',
      width: '25%',
      ellipsis: true,
      render: (status: string) => (
        <>
          {['APPROVED'].includes(status) && (
            <Badge key="green" color="green" text="已同意" />
          )}
          {['REJECTED'].includes(status) && (
            <Badge key="red" color="red" text="已拒绝" />
          )}
          {['APPLIED'].includes(status) && (
            <Badge key="yellow" color="yellow" text="审批中" />
          )}
        </>
      ),
    },
    {
      title: '申请时间',
      dataIndex: 'applyTime',
      key: 'applyTime',
      width: '25%',
      ellipsis: true,
      render: (applyTime: number) => {
        if (applyTime) {
          return (<Typography.Text
            ellipsis={{
              tooltip: `${formatTimestamp(String(applyTime * 1000))}`,
            }}
          >
            {formatTimestamp(String(applyTime * 1000))}
          </Typography.Text>)
        }
        return '--';

      },
    },
    {
      title: '审批时间',
      dataIndex: 'approvedTime',
      key: 'approvedTime',
      width: '25%',
      ellipsis: true,
      render: (approvedTime: number) => {
        if (approvedTime) {
          return (<Typography.Text
            ellipsis={{
              tooltip: `${formatTimestamp(String(approvedTime * 1000))}`,
            }}
          >
            {formatTimestamp(String(approvedTime * 1000))}
          </Typography.Text>)
        }
        return '--';
      },
    },
  ];
  useEffect(() => {
    if (open) {
      const nodeListOption = [{
        label: data.tableInfo.owner as string,
        value: data.tableInfo.contract_id as string,
      }];
      form.setFieldsValue({ contract_id: data.tableInfo.contract_id, status: '' });
      setNodeList(nodeListOption);
      onFinish({});
    }
  }, [open]);

  return (
    <Drawer
      title={`「${data.tableInfo.tableName}」授权记录`}
      placement="right"
      width={700}
      open={open}
      closable={false}
      destroyOnClose
      extra={
        <CloseOutlined
          style={{ fontSize: 12 }}
          onClick={() => {
            handleClose();
          }}
        />
      }
      footer={
        <div>
          <Space>
            <Button onClick={handleClose}>关闭</Button>
            {/* <Button
              type="primary"
              onClick={handleOk}
            >
              确定
            </Button> */}
          </Space>
        </div>
      }
    >
      <Form form={form} onFinish={onFinish} layout="inline" autoComplete="off" requiredMark="optional">
        <Form.Item
          name="contract_id"
          label="数据所属节点"
          rules={[{ required: true, message: '请选择数据所属节点' }]}
        >
          <Select
            disabled
            placeholder="请选择"
            options={nodeList}
          />
        </Form.Item>
        <Form.Item
          name="status"
          label="授权状态"
        >
          <Select
            placeholder="请选择"
            style={{ width: '85px' }}
          >
            <Option value="">全部</Option>
            <Option value="APPLIED">申请中</Option>
            <Option value="APPROVED">已同意</Option>
            <Option value="REJECTED">已拒绝</Option>
          </Select>
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
        </Form.Item>
      </Form>
      <Table
        loading={loading}
        dataSource={displayTableList}
        columns={columns}
        size="small"
        rowKey={(record) => record.auditId as string}
        style={{ marginTop: '30px' }}
      />
    </Drawer>
  )
}
