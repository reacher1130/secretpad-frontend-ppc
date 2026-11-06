import { ExclamationCircleFilled } from '@ant-design/icons';
import { message, Modal, Space } from 'antd';
import { useMemo } from 'react';
import { useModel } from '@/util/valtio-helper';
import { CooperativeProjectService } from './p2p-project-list.service';

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
  data: API.ConnectivityProject;
  onOk: () => void;
}) => {
  const service = useModel(CooperativeProjectService);

  const [messageApi, contextHolder] = message.useMessage();
  const title = useMemo(() => {
    const tips = `确认要${confirmStatus === 'APPROVED' ? '同意' : '拒绝'}合作吗?`
    return (
      <Space>
        <ExclamationCircleFilled style={{ color: 'orange' }} />
        {tips}
      </Space>
    );
  }, [confirmStatus]);
  const handleDelete = async () => {
    const { status } = await service.confirmCooperativeProject(
      {
        audit_id: data.auditId,
        status: confirmStatus,
      }
    );
    if (status && status.code !== 0) {
      messageApi.error(status.msg);
      return;
    }

    onOk();
    messageApi.success('操作成功!');
    onClose();
  };

  return (
    <>
      <Modal
        title={title}
        open={open}
        onOk={handleDelete}
        onCancel={onClose}
      // okButtonProps={{ danger: true, type: 'default' }}
      // okText={'确定'}
      ></Modal>
      {contextHolder}
    </>
  );
};
