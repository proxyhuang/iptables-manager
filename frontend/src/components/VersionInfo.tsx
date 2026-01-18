import React, { useEffect, useState } from 'react';
import { Typography, Tooltip, Tag } from 'antd';
import { InfoCircleOutlined, BuildOutlined, GithubOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Text } = Typography;

interface BackendVersion {
  version: string;
  commit: string;
  build_time: string;
}

export const VersionInfo: React.FC = () => {
  const [backendVersion, setBackendVersion] = useState<BackendVersion | null>(null);

  const frontendVersion = {
    version: process.env.REACT_APP_VERSION || 'dev',
    commit: process.env.REACT_APP_GIT_COMMIT || 'none',
    buildTime: process.env.REACT_APP_BUILD_TIME || 'unknown',
  };

  useEffect(() => {
    // Determine API base URL (handling both dev and prod)
    const apiBase = process.env.NODE_ENV === 'production' ? '/api/v1' : 'http://localhost:8080/api/v1';
    
    axios.get(`${apiBase}/version`)
      .then(response => {
        setBackendVersion(response.data);
      })
      .catch(error => {
        console.error('Failed to fetch backend version', error);
      });
  }, []);

  const formatCommit = (commit: string) => commit.substring(0, 7);
  const formatTime = (time: string) => {
    if (time === 'unknown') return time;
    try {
      return new Date(time).toLocaleString();
    } catch {
      return time;
    }
  };

  const renderTooltip = () => (
    <div style={{ fontSize: '12px' }}>
      <div style={{ marginBottom: 8 }}>
        <strong>Frontend</strong>
        <div>Version: {frontendVersion.version}</div>
        <div>Commit: {frontendVersion.commit}</div>
        <div>Built: {formatTime(frontendVersion.buildTime)}</div>
      </div>
      {backendVersion && (
        <div>
          <strong>Backend</strong>
          <div>Version: {backendVersion.version}</div>
          <div>Commit: {backendVersion.commit}</div>
          <div>Built: {formatTime(backendVersion.build_time)}</div>
        </div>
      )}
    </div>
  );

  return (
    <Tooltip title={renderTooltip()} placement="bottomRight" overlayStyle={{ maxWidth: '300px' }}>
      <div className="version-indicator">
        <BuildOutlined />
        <span>V{frontendVersion.version}</span>
      </div>
    </Tooltip>
  );
};
