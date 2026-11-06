import { Form, Button, Input } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useState } from 'react';

import styles from './index.less';

export interface UserInfo {
  name: string;
  password: string;
}

export const LoginForm = (props: {
  onConfirm: (userInfo: UserInfo) => Promise<void>;
}) => {
  const [loginState, setLoginState] = useState(false);

  const onFinish = async (values: UserInfo) => {
    setLoginState(true);
    await props.onConfirm(values);
    setLoginState(false);
  };

  return (
    <Form
      name="basic"
      initialValues={{ remember: true }}
      onFinish={onFinish}
      autoComplete="off"
    >
      <Form.Item
        label=""
        name="name"
        rules={[{ required: true, message: '请输入您的账号' }]}
      >
        <Input
          className={styles.loginInput}
          size="large"
          placeholder="请输入您的账号"
          prefix={<UserOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
        />
      </Form.Item>

      <Form.Item
        label=""
        name="password"
        rules={[{ required: true, message: '请输入密码' }]}
      >
        <Input.Password
          className={styles.loginInput}
          size="large"
          placeholder="请输入密码"
          prefix={<LockOutlined style={{ color: 'rgba(255,255,255,0.5)' }} />}
        />
      </Form.Item>

      <Form.Item>
        <Button
          className={styles.loginBtn}
          size="large"
          htmlType="submit"
          loading={loginState}
          block
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};
