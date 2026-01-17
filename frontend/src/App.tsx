import React from 'react';
import { Layout, Typography, Tabs, Space, Button, ConfigProvider, theme } from 'antd';
import { LogoutOutlined, SecurityScanOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RuleList } from './components/Rules/RuleList';
import { RuleForm } from './components/Rules/RuleForm';
import { LiveStats } from './components/Statistics/LiveStats';
import { Login } from './components/Auth/Login';
import { logout } from './store/slices/authSlice';
import type { RootState, AppDispatch } from './store/store';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  if (!isAuthenticated) {
    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#00f5ff',
            colorBgContainer: '#111827',
            colorBgElevated: '#1a2332',
            colorBorder: '#1e293b',
            colorText: '#e2e8f0',
            colorTextSecondary: '#94a3b8',
            borderRadius: 8,
            fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
          },
        }}
      >
        <Login />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00f5ff',
          colorBgContainer: '#111827',
          colorBgElevated: '#1a2332',
          colorBorder: '#1e293b',
          colorText: '#e2e8f0',
          colorTextSecondary: '#94a3b8',
          borderRadius: 8,
          fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        },
      }}
    >
      {/* Scanning Line Effect */}
      <div className="scanline-effect" />

      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Header className="cyber-header" style={{
          padding: '0 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px',
          lineHeight: '70px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <SecurityScanOutlined style={{
              fontSize: '32px',
              color: '#00f5ff',
              filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.5))'
            }} />
            <Title level={3} className="cyber-title" style={{ margin: 0 }}>
              IPTABLES MANAGER
            </Title>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span className="live-indicator">System Online</span>
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={() => dispatch(logout())}
              className="logout-btn"
            >
              Logout
            </Button>
          </div>
        </Header>

        <Content className="cyber-content">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <LiveStats />

            <div className="cyber-table-container">
              <Tabs
                defaultActiveKey="1"
                items={[
                  {
                    key: '1',
                    label: (
                      <span style={{ padding: '0 8px' }}>
                        <SecurityScanOutlined style={{ marginRight: 8 }} />
                        Rules List
                      </span>
                    ),
                    children: <RuleList />
                  },
                  {
                    key: '2',
                    label: (
                      <span style={{ padding: '0 8px' }}>
                        <span style={{ marginRight: 8 }}>+</span>
                        Add Rule
                      </span>
                    ),
                    children: <RuleForm />
                  }
                ]}
                style={{ padding: '0 16px' }}
                tabBarStyle={{
                  marginBottom: 0,
                  borderBottom: '1px solid var(--cyber-border)',
                }}
              />
            </div>
          </Space>
        </Content>
      </Layout>
    </ConfigProvider>
  );
};

export default App;
