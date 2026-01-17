import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { ThunderboltOutlined, CloudServerOutlined, WifiOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { RootState } from '../../store/store';
import { updateTrafficStats } from '../../store/slices/statsSlice';
import { useWebSocket } from '../../hooks/useWebSocket';
import { formatBytes } from '../../utils/formatters';
import { getWebSocketUrl } from '../../utils/websocket';

export const LiveStats: React.FC = () => {
  const dispatch = useDispatch();
  const { trafficStats } = useSelector((state: RootState) => state.stats);

  useWebSocket(getWebSocketUrl('/ws/stats'), {
    onMessage: (message) => {
      if (message.type === 'stats') {
        dispatch(updateTrafficStats(message.data));
      }
    },
  });

  if (!trafficStats) {
    return (
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="cyber-stats-card" style={{ height: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="cyber-stats-card" style={{ height: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={24} lg={8}>
          <Card className="cyber-stats-card" style={{ height: '140px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin size="large" />
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  const statsData = [
    {
      title: 'Total Packets',
      value: trafficStats.total_packets,
      icon: <ThunderboltOutlined />,
      color: '#00f5ff',
      gradient: 'linear-gradient(135deg, rgba(0, 245, 255, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
      borderColor: 'rgba(0, 245, 255, 0.3)',
      formatter: (val: number) => val.toLocaleString(),
    },
    {
      title: 'Total Bytes',
      value: trafficStats.total_bytes,
      icon: <CloudServerOutlined />,
      color: '#a855f7',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.1) 100%)',
      borderColor: 'rgba(168, 85, 247, 0.3)',
      formatter: (val: number) => formatBytes(val),
    },
    {
      title: 'Connection Status',
      value: 'Active',
      icon: <WifiOutlined />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(52, 211, 153, 0.1) 100%)',
      borderColor: 'rgba(16, 185, 129, 0.3)',
      formatter: () => 'Online',
    },
  ];

  return (
    <Row gutter={[24, 24]}>
      {statsData.map((stat, index) => (
        <Col xs={24} sm={12} lg={8} key={stat.title}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <motion.div
              key={`${stat.title}-${stat.value}`}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <Card
                className="cyber-stats-card"
                style={{
                  background: stat.gradient,
                  border: `1px solid ${stat.borderColor}`,
                  borderRadius: '16px',
                  overflow: 'hidden',
                  position: 'relative',
                }}
                styles={{
                  body: { padding: '24px' }
                }}
              >
                {/* Top Gradient Line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                }} />

                {/* Background Icon */}
                <div style={{
                  position: 'absolute',
                  right: '-10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '100px',
                  color: stat.color,
                  opacity: 0.08,
                  pointerEvents: 'none',
                }}>
                  {stat.icon}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                  {/* Icon Box */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    background: `linear-gradient(145deg, ${stat.color}20, ${stat.color}10)`,
                    border: `1px solid ${stat.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    color: stat.color,
                    boxShadow: `0 0 20px ${stat.color}30`,
                    flexShrink: 0,
                  }}>
                    {stat.icon}
                  </div>

                  {/* Stats Content */}
                  <div style={{ flex: 1 }}>
                    <Statistic
                      title={
                        <span style={{
                          color: 'var(--cyber-text-secondary)',
                          fontSize: '13px',
                          textTransform: 'uppercase',
                          letterSpacing: '1px',
                          fontWeight: 500,
                        }}>
                          {stat.title}
                        </span>
                      }
                      value={stat.formatter(stat.value as number)}
                      valueStyle={{
                        color: stat.color,
                        fontSize: '28px',
                        fontWeight: 700,
                        textShadow: `0 0 20px ${stat.color}50`,
                        lineHeight: 1.2,
                      }}
                    />
                  </div>
                </div>

                {/* Live Indicator for Connection Status */}
                {stat.title === 'Connection Status' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '16px',
                    right: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--cyber-text-muted)',
                    fontSize: '12px',
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: stat.color,
                      borderRadius: '50%',
                      boxShadow: `0 0 10px ${stat.color}`,
                      animation: 'pulse 1.5s ease-in-out infinite',
                    }} />
                    Live
                  </div>
                )}
              </Card>
            </motion.div>
          </motion.div>
        </Col>
      ))}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
      `}</style>
    </Row>
  );
};
