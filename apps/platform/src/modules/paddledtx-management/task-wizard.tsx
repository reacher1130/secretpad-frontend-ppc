import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  Row,
  Select,
  Steps,
} from 'antd';
import { useState } from 'react';

import type { PaddleDtxManagementService } from './paddledtx-management.service';
import styles from './workspace.less';

export const PaddleTaskWizard = ({
  service,
  onResults,
}: {
  service: PaddleDtxManagementService;
  onResults: () => void;
}) => {
  const [form] = Form.useForm();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const taskType = Form.useWatch('type', form) || 'train';
  const ready = service.status.ready === true;
  const next = async () => {
    try {
      await form.validateFields(
        step === 0
          ? [
              'name',
              'type',
              'algorithm',
              ...(taskType === 'predict' ? ['modelTaskId'] : []),
            ]
          : ['files', 'executors', ...(taskType === 'train' ? ['label'] : [])],
      );
      setStep(step + 1);
    } catch {
      /* Field-level feedback keeps the user on the incomplete step. */
    }
  };
  const values = form.getFieldsValue(true);
  return (
    <div className={styles.wizard}>
      <Card>
        <Steps
          current={step}
          items={[
            { title: '定义任务', description: '类型与算法' },
            { title: '参与数据', description: '数据与执行器' },
            { title: '确认执行', description: '检查配置' },
          ]}
        />
      </Card>
      {!ready && (
        <Alert
          showIcon
          type="warning"
          message={
            service.status.error ||
            (service.loading
              ? '正在检查请求端、执行器与模型存储状态'
              : '请求端、执行器或模型存储尚未就绪，可先配置任务')
          }
        />
      )}
      <Card title={['定义这次计算', '连接参与数据', '准备好发起计算了吗？'][step]}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: 'train',
            algorithm: 'linear-vl',
            executors: 'executor1,executor2',
            psiLabel: 'id,id',
            label: 'MEDV',
            amplitude: 100,
          }}
          onFinish={async (payload) => {
            if (step !== 2) {
              await next();
              return;
            }
            if (!ready || submitted || service.submitting) return;
            if (await service.submitTask(payload)) {
              setSubmitted(true);
              onResults();
            }
          }}
          onFinishFailed={() => setStep(0)}
        >
          <div hidden={step !== 0}>
            <p className={styles.formHint}>
              为任务取一个容易识别的名字，再选择计算方式。
            </p>
            <Form.Item
              name="name"
              label="任务名称"
              rules={[{ required: true, message: '请输入任务名称' }]}
            >
              <Input placeholder="例如：联合销售预测实验" maxLength={128} />
            </Form.Item>
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { value: 'train', label: '模型训练' },
                      { value: 'predict', label: '模型预测' },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="algorithm"
                  label="计算算法"
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { value: 'linear-vl', label: '纵向线性回归' },
                      { value: 'logistic-vl', label: '纵向逻辑回归' },
                      { value: 'dtc-vl', label: '纵向决策树' },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
            {taskType === 'predict' && (
              <Form.Item
                name="modelTaskId"
                label="已完成的训练任务 ID"
                rules={[{ required: true, message: '请输入已完成训练的任务 ID' }]}
              >
                <Input placeholder="用于本次预测的模型任务" />
              </Form.Item>
            )}
          </div>
          <div hidden={step !== 1}>
            <p className={styles.formHint}>
              文件与执行器的顺序需要一一对应，多个值用英文逗号分隔。
            </p>
            <Form.Item
              name="files"
              label="参与文件 ID"
              rules={[{ required: true, message: '请填写双方文件 ID' }]}
            >
              <Input placeholder="alice-file-id,partner-file-id" />
            </Form.Item>
            <Form.Item
              name="executors"
              label="协作执行器"
              rules={[{ required: true, message: '请填写执行器' }]}
            >
              <Input />
            </Form.Item>
            <Row gutter={20}>
              <Col xs={24} sm={12}>
                <Form.Item name="psiLabel" label="双方 ID 列">
                  <Input placeholder="id,id" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="label"
                  label="训练目标列"
                  rules={[
                    { required: taskType === 'train', message: '请填写训练目标列' },
                  ]}
                >
                  <Input placeholder="例如：MEDV" />
                </Form.Item>
              </Col>
            </Row>
            <details className={styles.advanced}>
              <summary>高级参数</summary>
              <Row gutter={20}>
                <Col xs={24} sm={12}>
                  <Form.Item name="labelName" label="分类目标值（可选）">
                    <Input placeholder="逻辑回归时填写" />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item name="amplitude" label="精度系数">
                    <Input type="number" />
                  </Form.Item>
                </Col>
              </Row>
            </details>
          </div>
          {step === 2 && (
            <div>
              <p className={styles.formHint}>
                确认后将向计算引擎提交任务，并由双方执行器协同计算。
              </p>
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="任务名称">{values.name}</Descriptions.Item>
                <Descriptions.Item label="计算方式">
                  {taskType === 'train' ? '模型训练' : '模型预测'} · {values.algorithm}
                </Descriptions.Item>
                <Descriptions.Item label="参与文件">{values.files}</Descriptions.Item>
                <Descriptions.Item label="执行器">{values.executors}</Descriptions.Item>
                <Descriptions.Item label="目标列 / ID 列">
                  {values.label || '—'} / {values.psiLabel || '—'}
                </Descriptions.Item>
                {taskType === 'predict' && (
                  <Descriptions.Item label="训练任务">
                    {values.modelTaskId}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          )}
          {submitted && (
            <Alert
              className={styles.submitted}
              type="success"
              showIcon
              message="计算引擎已返回执行反馈"
              action={
                <Button size="small" onClick={onResults}>
                  查看反馈
                </Button>
              }
            />
          )}
          <div className={styles.formActions}>
            <span>步骤 {step + 1} / 3</span>
            <div>
              {step > 0 && (
                <Button
                  htmlType="button"
                  disabled={service.submitting}
                  icon={<ArrowLeftOutlined />}
                  onClick={() => setStep(step - 1)}
                >
                  上一步
                </Button>
              )}
              {step < 2 ? (
                <Button
                  key="next-step"
                  type="primary"
                  htmlType="button"
                  onClick={(event) => {
                    event.preventDefault();
                    void next();
                  }}
                >
                  继续 <ArrowRightOutlined />
                </Button>
              ) : (
                <Button
                  key="submit-task"
                  type="primary"
                  htmlType="submit"
                  disabled={!ready || submitted}
                  loading={service.submitting}
                  icon={<PlayCircleOutlined />}
                >
                  发布并执行
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
};
