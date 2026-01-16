// Mock for antd
const React = require('react');

// Create a simple component factory
const createMockComponent = (name) => {
  const Component = ({ children, ...props }) =>
    React.createElement('div', { 'data-testid': `antd-${name.toLowerCase()}`, ...props }, children);
  Component.displayName = name;
  return Component;
};

// Layout components
const Layout = createMockComponent('Layout');
Layout.Header = createMockComponent('Header');
Layout.Content = createMockComponent('Content');
Layout.Footer = createMockComponent('Footer');
Layout.Sider = createMockComponent('Sider');

// Typography components
const Typography = createMockComponent('Typography');
Typography.Title = createMockComponent('Title');
Typography.Text = createMockComponent('Text');
Typography.Paragraph = createMockComponent('Paragraph');
Typography.Link = createMockComponent('Link');

// Form components
const Form = createMockComponent('Form');
Form.Item = createMockComponent('FormItem');
Form.useForm = () => [{ getFieldsValue: () => ({}), setFieldsValue: () => {}, resetFields: () => {}, validateFields: () => Promise.resolve({}) }];

// Table component
const Table = createMockComponent('Table');

// Other components
module.exports = {
  Layout,
  Typography,
  Form,
  Table,
  Button: createMockComponent('Button'),
  Input: Object.assign(createMockComponent('Input'), {
    Search: createMockComponent('InputSearch'),
    TextArea: createMockComponent('TextArea'),
    Password: createMockComponent('Password'),
  }),
  Select: Object.assign(createMockComponent('Select'), {
    Option: createMockComponent('Option'),
  }),
  Tabs: createMockComponent('Tabs'),
  Space: createMockComponent('Space'),
  Card: createMockComponent('Card'),
  Row: createMockComponent('Row'),
  Col: createMockComponent('Col'),
  Modal: Object.assign(createMockComponent('Modal'), {
    confirm: () => ({ destroy: () => {} }),
    info: () => ({ destroy: () => {} }),
    success: () => ({ destroy: () => {} }),
    error: () => ({ destroy: () => {} }),
    warning: () => ({ destroy: () => {} }),
  }),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
  },
  notification: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    open: jest.fn(),
  },
  Spin: createMockComponent('Spin'),
  Alert: createMockComponent('Alert'),
  Tag: createMockComponent('Tag'),
  Tooltip: createMockComponent('Tooltip'),
  Popconfirm: createMockComponent('Popconfirm'),
  Statistic: createMockComponent('Statistic'),
  Progress: createMockComponent('Progress'),
  Divider: createMockComponent('Divider'),
  ConfigProvider: ({ children }) => children,
  theme: {
    defaultAlgorithm: {},
    darkAlgorithm: {},
  },
};
