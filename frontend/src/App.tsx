import React from 'react';
import { Layout, Typography, Tabs, Space, Button, ConfigProvider, theme, Tooltip } from 'antd';
import { LogoutOutlined, SecurityScanOutlined, SunOutlined, MoonOutlined, ApartmentOutlined } from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RuleList } from './components/Rules/RuleList';
import { RuleForm } from './components/Rules/RuleForm';
import { LiveStats } from './components/Statistics/LiveStats';
import { ChainFlowDiagram } from './components/ChainFlow/ChainFlowDiagram';
import { Login } from './components/Auth/Login';
import { logout } from './store/slices/authSlice';
import { useTheme } from './context/ThemeContext';
import type { RootState, AppDispatch } from './store/store';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { toggleTheme, isDark } = useTheme();

  const themeConfig = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: isDark ? {
      colorPrimary: '#00f5ff',
      colorBgContainer: '#111827',
      colorBgElevated: '#1a2332',
      colorBorder: '#1e293b',
      colorText: '#e2e8f0',
      colorTextSecondary: '#94a3b8',
      borderRadius: 8,
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    } : {
      colorPrimary: '#0891b2',
      colorBgContainer: '#ffffff',
      colorBgElevated: '#f8fafc',
      colorBorder: '#e2e8f0',
      colorText: '#0f172a',
      colorTextSecondary: '#475569',
      borderRadius: 8,
      fontFamily: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
    },
  };

  if (!isAuthenticated) {
    return (
      <ConfigProvider theme={themeConfig}>
        <Login />
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={themeConfig}>
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
            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{
                  color: 'var(--cyber-text-primary)',
                  fontSize: '18px',
                }}
              />
            </Tooltip>
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
                  },
                  {
                    key: '3',
                    label: (
                      <span style={{ padding: '0 8px' }}>
                        <ApartmentOutlined style={{ marginRight: 8 }} />
                        Chain Flow
                      </span>
                    ),
                    children: <ChainFlowDiagram />
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
