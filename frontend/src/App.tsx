import React from 'react';
import { Layout, Typography, Tabs, Space, Button } from 'antd';
import { LogoutOutlined } from '@ant-design/icons';
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
    return <Login />;
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 50px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ color: 'white', margin: '16px 0' }}>
          IPTables Manager
        </Title>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          onClick={() => dispatch(logout())}
          style={{ color: 'white' }}
        >
          Logout
        </Button>
      </Header>
      <Content style={{ padding: '50px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <LiveStats />

          <Tabs defaultActiveKey="1" items={[
            {
              key: '1',
              label: 'Rules List',
              children: <RuleList />
            },
            {
              key: '2',
              label: 'Add Rule',
              children: <RuleForm />
            }
          ]} />
        </Space>
      </Content>
    </Layout>
  );
};

export default App;
