import { useEffect, useState } from 'react';
import { Drawer, Form, Space, Button, Input, Select, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { getNodeApprovedList } from '@/services/secretpad/connectivity/P2PProjectController';
import { useModel } from '@/util/valtio-helper';
import { CooperativeProjectService } from './p2p-project-list.service';
const { Option } = Select;
export const P2PCreateProjectModal = ({
  visible,
  onClose,
  onOk
}: {
  visible: boolean;
  onClose: () => void;
  onOk: () => void;
}) => {
  const service = useModel(CooperativeProjectService);
  const [submittable, setSubmittable] = useState(true);
  const [nodeList, setNodeList] = useState<API.NodeRouterVO[] | []>([]);
  const [form] = Form.useForm();
  const handleClose = () => {
    form.resetFields();
    onClose();
  }
  const handleOk = () => {
    form.validateFields().then(async (value) => {
      const { status } = await service.applyCooperativeProject({
        name: value.name,
        contract_id: value.contractId,
        description: value.description,
      });
      if (status && status.code !== 0) {
        message.error(status.msg);
      } else {
        onOk();
        handleClose();
        message.success('申请成功');
      }
    });
  }
  useEffect(() => {
    if (visible) {
      const getNodeList = async () => {
        return await getNodeApprovedList();
      }
      getNodeList().then((res) => {
        setNodeList((res?.data || []));
      })
    }
  }, [visible]);

  return (
    <>
      <Drawer
        title="创建项目"
        placement="right"
        width={560}
        open={visible}
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
          <Space style={{ float: 'right' }}>
            <Button onClick={handleClose}>取消</Button>
            <Button disabled={!submittable} type="primary" onClick={handleOk}>
              确定
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name={'name'}
            label={'项目名称'}
            rules={
              [
                { required: true, message: '请输入项目名称' }
              ]
            }
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>
          <Form.Item
            name={'contractId'}
            label={'合作节点'}
            rules={
              [
                { required: true, message: '请输入合作节点' }
              ]
            }
          >
            <Select
              placeholder="请选择合作节点"
              allowClear
            >
              {
                nodeList.map((nodeItem) => {
                  return <Option value={nodeItem.contractId} key={nodeItem.contractId}>{nodeItem.name}</Option>
                })
              }
            </Select>
          </Form.Item>
          <Form.Item
            name={'description'}
            label={'项目描述'}
          >
            <Input.TextArea
              rows={2}
              placeholder="请输入项目描述"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  )
}
