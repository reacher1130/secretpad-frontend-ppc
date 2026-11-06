import { Drawer, Form, Space, Button, Input, message } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { useModel } from '@/util/valtio-helper';
import { AddFlowService } from './index.service';
import { fullUpdateGraph } from '@/services/secretpad/connectivity/GraphController';
import styles from './index.less';

export const AddFlowDrawer = ({
  projectId,
  open,
  onClose,
  onOk,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onOk: ({ flowId, flowName }: { flowId: string; flowName: string }) => void;
}) => {
  const service = useModel(AddFlowService);
  const [form] = Form.useForm();
  const handleClose = () => {
    onClose();
    form.resetFields();
  }
  const handleOk = async () => {
    form.validateFields().then(async (value) => {
      const params: API.CreatFlowRequest = {
        projectId: projectId,
        name: value.name,
      };
      if (value.description !== undefined) {
        params.description = value.description;
      }
      const { status, data } = await service.addFlow(params);
      const result = data as unknown as string | { flowId?: string; graphId?: string };
      const flowId = typeof result === 'string' ? result : result?.flowId || result?.graphId;
      if (status?.code !== 0 || !flowId) {
        message.error(status?.msg || '后端未返回流程 ID');
      } else {
        const { status: updateStatus } = await fullUpdateGraph({
          projectId,
          graphId: flowId,
          nodes: [],
          edges: [],
        });
        if (updateStatus && updateStatus.code === 0) {
          onOk({ flowId: flowId, flowName: value.name });
          handleClose();
          message.success('创建成功');
        } else {
          message.error(updateStatus?.msg || '流程已创建，但画布初始化失败，请从流程列表打开');
          handleClose();
        }
      }
    });
  }
  return (
    <Drawer
      title="新增流程"
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
        <div className={styles.actions}>
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button
              type="primary"
              // loading={addFlowLoading}
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
          name="name"
          label="流程名称"
          rules={[{ required: true, message: '请输入流程名称' }]}
        >
          <Input placeholder="请输入流程名称" />
        </Form.Item>
        <Form.Item
          name="description"
          label="描述"
        >
          <Input placeholder="请输入描述" />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
