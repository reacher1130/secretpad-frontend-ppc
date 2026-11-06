import React, { useEffect, useState } from 'react';
import { Drawer, Form, Space, Button, message, Select } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { listP2PProject } from '@/services/secretpad/connectivity/P2PProjectController';
import { authProjectData } from '@/services/secretpad/connectivity/DataController';
interface PropsData {
  tableInfo: API.MyDataListVO;
  node: API.NodeVO;
}
interface IProps<T> {
  open: boolean;
  onClose: () => void;
  onOk: () => void;
  data: T;
}
type OptionType = {
  label: string;
  value: string;
};

export const AuthProjectDrawer: React.FC<IProps<PropsData>> = ({
  open,
  onClose,
  onOk,
  data,
}) => {
  const [form] = Form.useForm();
  const [projectList, setProjectList] = useState<OptionType[]>([]);
  const handleClose = () => {
    form.resetFields();
    onClose();
  }
  const getProjectList = async () => {
    const res = await listP2PProject({});
    const list = (res?.data || []) as API.ConnectivityProject[];
    const projectListOption = list.map((project) => {
      return {
        label: project.name,
        value: project.projectId,
      };
    })
    setProjectList(projectListOption);

  };
  const handleOk = () => {
    form.validateFields().then(async (value) => {
      const { status } = await authProjectData({
        projectId: value.projectId,
        nodeId: data.node.nodeId,
        datatableId: data.tableInfo.dataset_id,
        configs: data.tableInfo.schema as API.TableColumnConfigParam[],
        type: data.tableInfo.type,
      });
      if (status && status.code !== 0) {
        message.error(status.msg);
      } else {
        onOk();
        handleClose();
        message.success('授权成功');
      }
    });
  }

  useEffect(() => {
    if (open) {
      getProjectList();
    }
  }, [open]);

  return (
    <Drawer
      title="授权项目数据"
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
          name="projectId"
          label="授权项目"
          rules={[{ required: true, message: '请选择授权项目' }]}
        >
          <Select
            placeholder="请选择"
            options={projectList}
          />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
