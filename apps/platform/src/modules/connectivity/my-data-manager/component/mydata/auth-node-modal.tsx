import React, { useEffect, useState } from 'react';
import { Drawer, Form, Space, Button, message, Select } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { getNodeApprovedList } from '@/services/secretpad/connectivity/P2PProjectController';
import { authNodeData } from '@/services/secretpad/connectivity/DataController';
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

export const AuthNodeDrawer: React.FC<IProps<PropsData>> = ({
  open,
  onClose,
  // onOk,
  data,
}) => {
  const [form] = Form.useForm();
  const [nodeList, setNodeList] = useState<OptionType[]>([]);
  const handleClose = () => {
    form.resetFields();
    onClose();
  }
  const getNodeList = async () => {
    const res = await getNodeApprovedList();
    const list = res?.data || [];
    const nodeListOption = (list as API.ConnectivityProject[]).map((node) => {
      return {
        label: node.name as string,
        value: node.contractId,
      };
    })
    setNodeList(nodeListOption);

  };
  const handleOk = () => {
    form.validateFields().then(async (value) => {
      const { status } = await authNodeData({
        contract_id: value.contract_id,
        dataset_id: data.tableInfo.dataset_id,
      });
      if (status && status.code !== 0) {
        message.error(status.msg);
      } else {
        // onOk();
        handleClose();
        message.success('公开成功');
      }
    });
  }

  useEffect(() => {
    if (open) {
      getNodeList();
    }
  }, [open]);

  return (
    <Drawer
      title="公开节点数据"
      placement="right"
      width={560}
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
            <Button onClick={handleClose}>取消</Button>
            <Button
              type="primary"
              onClick={handleOk}
            >
              确定
            </Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical" autoComplete="off" requiredMark="optional">
        <Form.Item
          name="contract_id"
          label="公开对象节点"
          rules={[{ required: true, message: '请选择公开对象节点' }]}
        >
          <Select
            placeholder="请选择"
            options={nodeList}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
