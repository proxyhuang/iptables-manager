import React, { useState } from 'react';
import { Layout, Typography, Tabs, Space, Button, ConfigProvider, theme, Tooltip } from 'antd';
import {
  LogoutOutlined,
  SecurityScanOutlined,
  SunOutlined,
  MoonOutlined,
  ApartmentOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import { useSelector, useDispatch } from 'react-redux';
import { RuleList } from './components/Rules/RuleList';
import { RuleForm } from './components/Rules/RuleForm';
import { LiveStats } from './components/Statistics/LiveStats';
import { ChainFlowDiagram } from './components/ChainFlow/ChainFlowDiagram';
import { Login } from './components/Auth/Login';
import { VersionInfo } from './components/VersionInfo';
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
  const [showScanline, setShowScanline] = useState(true);

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
      {showScanline && <div className="scanline-effect" />}

      <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
        <Header className="cyber-header" style={{
          padding: '0 50px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '70px',
          lineHeight: '70px'
        }}>
          <a 
            href="https://github.com/proxyhuang/iptables-manager.git" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: '16px', textDecoration: 'none' }}
          >
            <SecurityScanOutlined style={{
              fontSize: '32px',
              color: '#00f5ff',
              filter: 'drop-shadow(0 0 10px rgba(0, 245, 255, 0.5))'
            }} />
            <Title level={3} className="cyber-title" style={{ margin: 0 }}>
              IPTABLES MANAGER
            </Title>
          </a>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <VersionInfo />
            <span className="live-indicator">System Online</span>
            
            <Tooltip title={showScanline ? 'Hide Scanline' : 'Show Scanline'}>
              <Button
                type="text"
                icon={showScanline ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                onClick={() => setShowScanline(!showScanline)}
                style={{
                  color: 'var(--cyber-text-secondary)',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(148, 163, 184, 0.05)',
                  border: '1px solid rgba(148, 163, 184, 0.1)',
                  transition: 'all 0.3s ease',
                }}
              />
            </Tooltip>

            <Tooltip title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <Button
                type="text"
                icon={isDark ? <SunOutlined /> : <MoonOutlined />}
                onClick={toggleTheme}
                style={{
                  color: isDark ? 'var(--cyber-cyan)' : 'var(--cyber-purple)',
                  fontSize: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isDark ? 'rgba(0, 245, 255, 0.05)' : 'rgba(168, 85, 247, 0.1)',
                  border: `1px solid ${isDark ? 'rgba(0, 245, 255, 0.1)' : 'rgba(168, 85, 247, 0.2)'}`,
                  transition: 'all 0.3s ease',
                }}
                className="theme-toggle-btn"
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
                        <ApartmentOutlined style={{ marginRight: 8 }} />
                        Rule Flow
                      </span>
                    ),
                    children: <ChainFlowDiagram />
                  },
                  {
                    key: '3',
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
