import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined } from '@ant-design/icons';
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
    return <Card loading />;
  }

  return (
    <Row gutter={16}>
      <Col span={12}>
        <motion.div
          key={trafficStats.total_packets}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <Statistic
              title="Total Packets"
              value={trafficStats.total_packets}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </motion.div>
      </Col>
      <Col span={12}>
        <motion.div
          key={trafficStats.total_bytes}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Card>
            <Statistic
              title="Total Bytes"
              value={formatBytes(trafficStats.total_bytes)}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </motion.div>
      </Col>
    </Row>
  );
};
