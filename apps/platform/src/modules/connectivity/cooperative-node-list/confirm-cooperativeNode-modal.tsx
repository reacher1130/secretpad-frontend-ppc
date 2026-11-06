import { ExclamationCircleFilled } from '@ant-design/icons';
import { message, Modal, Space } from 'antd';
import { useState } from 'react';

import {
  confirmCooperation,
  type CooperationRequest,
} from './cooperative-node.service';

export const ConfirmCooperativeNodeModal = ({
  open,
  onClose,
  confirmStatus,
  data,
  onOk,
}: {
  open: boolean;
  onClose: () => void;
  confirmStatus: string;
  data: CooperationRequest;
  onOk: () => void;
}) => {
  const [submitting, setSubmitting] = useState(false);
  const action = confirmStatus === 'APPROVED' ? '同意' : '拒绝';

  const confirm = async () => {
    setSubmitting(true);
    try {
      await confirmCooperation(data.contractId, confirmStatus);
      message.success(`已${action}合作申请`);
      onOk();
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '合作审批失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleFilled style={{ color: 'orange' }} />
          确认要{action}合作吗？
        </Space>
      }
      open={open}
      confirmLoading={submitting}
      onOk={confirm}
      onCancel={submitting ? undefined : onClose}
      cancelButtonProps={{ disabled: submitting }}
      closable={!submitting}
      maskClosable={!submitting}
      keyboard={!submitting}
    />
  );
};
