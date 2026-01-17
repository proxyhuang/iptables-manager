import React from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { login, clearError } from '../../store/slices/authSlice';
import type { RootState, AppDispatch } from '../../store/store';

const { Title, Text } = Typography;

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
      background: 'var(--cyber-bg-primary)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0, 245, 255, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 245, 255, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        animation: 'float 20s linear infinite',
      }} />

      {/* Gradient Orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0, 245, 255, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 10s ease-in-out infinite reverse',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Card
          style={{
            width: 420,
            background: 'rgba(17, 24, 39, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--cyber-border)',
            borderRadius: '16px',
            boxShadow: '0 0 40px rgba(0, 0, 0, 0.5), 0 0 80px rgba(0, 245, 255, 0.1)',
            overflow: 'hidden',
          }}
          styles={{
            body: { padding: '40px' }
          }}
        >
          {/* Top Gradient Border */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, var(--cyber-cyan), var(--cyber-purple), var(--cyber-pink))',
          }} />

          {/* Logo Section */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: 32 }}
          >
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '80px',
              height: '80px',
              background: 'linear-gradient(145deg, rgba(0, 245, 255, 0.1), rgba(168, 85, 247, 0.1))',
              borderRadius: '20px',
              marginBottom: '24px',
              border: '1px solid rgba(0, 245, 255, 0.2)',
              boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)',
            }}>
              <SecurityScanOutlined style={{
                fontSize: '40px',
                background: 'linear-gradient(135deg, var(--cyber-cyan), var(--cyber-purple))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.5))',
              }} />
            </div>

            <Title level={2} style={{
              background: 'linear-gradient(135deg, var(--cyber-cyan), var(--cyber-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              margin: 0,
              fontWeight: 700,
              letterSpacing: '2px',
            }}>
              IPTABLES MANAGER
            </Title>
            <Text style={{
              color: 'var(--cyber-text-secondary)',
              fontSize: '14px',
              letterSpacing: '1px',
            }}>
              Secure Firewall Management System
            </Text>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Alert
                message="Authentication Failed"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => dispatch(clearError())}
                style={{
                  marginBottom: 24,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                }}
              />
            </motion.div>
          )}

          <Form
            name="login"
            onFinish={onFinish}
            autoComplete="off"
            size="large"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Please enter username' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: 'var(--cyber-text-secondary)' }} />}
                  placeholder="Username"
                  style={{
                    background: 'var(--cyber-bg-secondary)',
                    border: '1px solid var(--cyber-border)',
                    borderRadius: '8px',
                    height: '48px',
                  }}
                />
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Form.Item
                name="password"
                rules={[{ required: true, message: 'Please enter password' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: 'var(--cyber-text-secondary)' }} />}
                  placeholder="Password"
                  style={{
                    background: 'var(--cyber-bg-secondary)',
                    border: '1px solid var(--cyber-border)',
                    borderRadius: '8px',
                    height: '48px',
                  }}
                />
              </Form.Item>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{
                    height: '48px',
                    background: 'linear-gradient(135deg, var(--cyber-cyan), var(--cyber-blue))',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    letterSpacing: '1px',
                    boxShadow: '0 4px 20px rgba(0, 245, 255, 0.3)',
                  }}
                >
                  {loading ? 'AUTHENTICATING...' : 'ACCESS SYSTEM'}
                </Button>
              </Form.Item>
            </motion.div>
          </Form>

          {/* Bottom Decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              marginTop: 24,
              textAlign: 'center',
              color: 'var(--cyber-text-muted)',
              fontSize: '12px',
              letterSpacing: '0.5px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: 'var(--cyber-green)',
                borderRadius: '50%',
                boxShadow: '0 0 10px var(--cyber-green)',
                animation: 'pulse 2s ease-in-out infinite',
              }} />
              System Status: Online
            </div>
          </motion.div>
        </Card>
      </motion.div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
