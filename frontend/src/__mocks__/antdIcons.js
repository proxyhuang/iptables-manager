// Mock for @ant-design/icons
const React = require('react');

const createIconMock = (name) => {
  const Icon = (props) => React.createElement('span', { 'data-testid': `icon-${name}`, ...props });
  Icon.displayName = name;
  return Icon;
};

module.exports = {
  LogoutOutlined: createIconMock('LogoutOutlined'),
  LoginOutlined: createIconMock('LoginOutlined'),
  UserOutlined: createIconMock('UserOutlined'),
  LockOutlined: createIconMock('LockOutlined'),
  SearchOutlined: createIconMock('SearchOutlined'),
  PlusOutlined: createIconMock('PlusOutlined'),
  DeleteOutlined: createIconMock('DeleteOutlined'),
  EditOutlined: createIconMock('EditOutlined'),
  ReloadOutlined: createIconMock('ReloadOutlined'),
  SettingOutlined: createIconMock('SettingOutlined'),
  CheckOutlined: createIconMock('CheckOutlined'),
  CloseOutlined: createIconMock('CloseOutlined'),
  InfoCircleOutlined: createIconMock('InfoCircleOutlined'),
  WarningOutlined: createIconMock('WarningOutlined'),
  ExclamationCircleOutlined: createIconMock('ExclamationCircleOutlined'),
  QuestionCircleOutlined: createIconMock('QuestionCircleOutlined'),
  LoadingOutlined: createIconMock('LoadingOutlined'),
  SyncOutlined: createIconMock('SyncOutlined'),
  FilterOutlined: createIconMock('FilterOutlined'),
  DownOutlined: createIconMock('DownOutlined'),
  UpOutlined: createIconMock('UpOutlined'),
  RightOutlined: createIconMock('RightOutlined'),
  LeftOutlined: createIconMock('LeftOutlined'),
  MenuOutlined: createIconMock('MenuOutlined'),
  HomeOutlined: createIconMock('HomeOutlined'),
  DashboardOutlined: createIconMock('DashboardOutlined'),
  TableOutlined: createIconMock('TableOutlined'),
  FileOutlined: createIconMock('FileOutlined'),
  CopyOutlined: createIconMock('CopyOutlined'),
  SaveOutlined: createIconMock('SaveOutlined'),
  CloudOutlined: createIconMock('CloudOutlined'),
  DesktopOutlined: createIconMock('DesktopOutlined'),
  GlobalOutlined: createIconMock('GlobalOutlined'),
  SafetyOutlined: createIconMock('SafetyOutlined'),
  SecurityScanOutlined: createIconMock('SecurityScanOutlined'),
  FireOutlined: createIconMock('FireOutlined'),
};
