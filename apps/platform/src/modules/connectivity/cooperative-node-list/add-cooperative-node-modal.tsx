import { Button, DatePicker, Drawer, Form, Input, message, Select, Space } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';

import { applyCooperation, type ConfiguredPeer } from './cooperative-node.service';

export const AddCooperativeNodeDrawer = ({
  open,
  onClose,
  onOk,
  peers,
}: {
  open: boolean;
  onClose: () => void;
  onOk: () => void;
  peers: ConfiguredPeer[];
}) => {
  const [form] = Form.useForm<{ nodeId: string; expiredTime: Dayjs }>();
  const selectedNodeId = Form.useWatch('nodeId', form);
  const selected = peers.find((peer) => peer.nodeId === selectedNodeId);
  const [submitting, setSubmitting] = useState(false);

  const close = () => {
    form.resetFields();
    onClose();
  };

  const submit = async ({
    nodeId,
    expiredTime,
  }: {
    nodeId: string;
    expiredTime: Dayjs;
  }) => {
    setSubmitting(true);
    try {
      await applyCooperation(nodeId, expiredTime.unix());
      message.success('合作申请已发送');
      onOk();
      close();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '合作申请提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="申请合作节点"
      placement="right"
      width={560}
      open={open}
      closable={!submitting}
      keyboard={!submitting}
      maskClosable={!submitting}
      destroyOnClose
      onClose={close}
      footer={
        <Space style={{ float: 'right' }}>
          <Button disabled={submitting} onClick={close}>
            取消
          </Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            确定
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={submit} disabled={submitting}>
        <Form.Item
          name="nodeId"
          label="合作节点"
          rules={[{ required: true, message: '请选择已配置合作节点' }]}
        >
          <Select
            placeholder="请选择已配置合作节点"
            options={peers.map((peer) => ({
              value: peer.nodeId,
              label: peer.nodeName || peer.name || peer.nodeId,
            }))}
          />
        </Form.Item>
        {selected?.netAddress && (
          <Form.Item label="节点通讯地址">
            <Input value={selected.netAddress} readOnly />
          </Form.Item>
        )}
        <Form.Item
          name="expiredTime"
          label="过期时间"
          rules={[
            { required: true, message: '请选择过期时间' },
            {
              validator: (_, value?: Dayjs) =>
                !value || value.isAfter(dayjs())
                  ? Promise.resolve()
                  : Promise.reject(new Error('过期时间必须晚于当前时间')),
            },
          ]}
        >
          <DatePicker
            disabledDate={(current) => current.isBefore(dayjs(), 'day')}
            format="YYYY-MM-DD HH:mm:ss"
            showTime
            placeholder="请选择过期时间"
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
