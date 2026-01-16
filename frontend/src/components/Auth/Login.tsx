import React from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { login, clearError } from '../../store/slices/authSlice';
import type { RootState, AppDispatch } from '../../store/store';

const { Title } = Typography;

interface LoginFormValues {
  username: string;
  password: string;
}

export const Login: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  const onFinish = (values: LoginFormValues) => {
    dispatch(login(values));
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5',
    }}>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 32 }}>
          IPTables Manager
        </Title>

        {error && (
          <Alert
            message="Login Failed"
            description={error}
            type="error"
            showIcon
            closable
            onClose={() => dispatch(clearError())}
            style={{ marginBottom: 24 }}
          />
        )}

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Please enter username' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Please enter password' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
