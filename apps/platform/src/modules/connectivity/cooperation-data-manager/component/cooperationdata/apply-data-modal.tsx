import React, { useEffect, useState } from 'react';
import { Drawer, Form, Space, Button, message, Select, DatePicker } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import { applyData } from '@/services/secretpad/connectivity/CooperationDataController';
import { listP2PProject } from '@/services/secretpad/connectivity/P2PProjectController';
import type { GetProps } from 'antd';
import dayjs from 'dayjs';
type RangePickerProps = GetProps<typeof DatePicker.RangePicker>;
// eslint-disable-next-line arrow-body-style
const disabledDate: RangePickerProps['disabledDate'] = (current) => {
  // Can not select days before today and today
  return current && current < dayjs().endOf('day');
};


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

export const ApplyDataDrawer: React.FC<IProps<PropsData>> = ({
  open,
  onClose,
  // onOk,
  data,
}) => {
  const [form] = Form.useForm();
  const [nodeList, setNodeList] = useState<OptionType[]>([]);
  const [projectList, setProjectList] = useState<OptionType[]>([]);
  const [showProjectSelectFlag, setShowProjectSelectFlag] = useState(false);
  const handleClose = () => {
    form.resetFields();
    onClose();
  }
  const getProjectList = async () => {
    const res = await listP2PProject({
      contract_id: data.tableInfo.contract_id,
    });
    const list = ((res?.data || []) as API.ConnectivityProject[]);
    const projectListOption = list.map((project) => {
      return {
        label: project.name,
        value: project.projectId,
        disabled: project.status !== 'APPROVED',
      };
    })
    setProjectList(projectListOption);

  };
  const handleOk = () => {
    form.validateFields().then(async (value) => {
      const params: Record<string, any> = {
        time_limit: dayjs(value.time_limit).unix(),
        dataset_id: data.tableInfo.dataset_id as string,
        contract_id: data.tableInfo.contract_id as string,
      }
      if (value.auth_scope === 'project') {
        params.auth_scope = {
          PROJECT: [value.projectId],
        }
      }
      const { status } = await applyData(params);
      if (status && status.code !== 0) {
        message.error(status.msg);
      } else {
        // onOk();
        handleClose();
        message.success('申请成功');
      }
    });
  }
  const onAuthScopeChange = (value: string) => {
    setShowProjectSelectFlag(value === 'project');
  }
  useEffect(() => {
    if (open) {
      getProjectList();
    }
  }, [open]);
  useEffect(() => {
    if (open) {
      const nodeListOption = [{
        label: data.tableInfo.owner as string,
        value: data.tableInfo.contract_id as string,
      }];
      form.setFieldsValue({ contract_id: data.tableInfo.contract_id });
      setNodeList(nodeListOption);
    }
  }, [open]);

  return (
    <Drawer
      title="申请合作方数据"
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
          name="auth_scope"
          label="申请授权范围"
          rules={[{ required: true, message: '请选择申请授权范围' }]}
        >
          <Select
            placeholder="请选择"
            onChange={onAuthScopeChange}
          >
            <Option value="node">节点</Option>
            <Option value="project">项目</Option>
          </Select>
        </Form.Item>
        {showProjectSelectFlag && (<Form.Item
          name="projectId"
          label="申请授权项目"
          tooltip="合作项目状态为已同意的才可以选中"
          rules={[{ required: true, message: '请选择申请授权项目' }]}
        >
          <Select
            placeholder="请选择"
            options={projectList}
          />
        </Form.Item>)}
        <Form.Item
          name={'time_limit'}
          label={'过期时间'}
          rules={
            [
              { required: true, message: '请输入过期时间' },
            ]
          }
        >
          <DatePicker disabledDate={disabledDate} format="YYYY-MM-DD HH:mm:ss" showTime placeholder={"请输入过期时间"} />
        </Form.Item>
      </Form>
    </Drawer>
  )
}
