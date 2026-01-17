import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Select, Space, Tooltip, Tag } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  DesktopOutlined,
  CloudOutlined,
  NodeIndexOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { RootState } from '../../store/store';
import { formatBytes } from '../../utils/formatters';

const { Text, Title } = Typography;

interface ChainStats {
  chain: string;
  tables: string[];
  ruleCount: number;
  packets: number;
  bytes: number;
}

// Chain configuration
const chainConfig: Record<string, { color: string; icon: React.ReactNode; description: string }> = {
  PREROUTING: {
    color: '#f59e0b',
    icon: <ImportOutlined />,
    description: 'Before routing decision (nat, mangle, raw)',
  },
  INPUT: {
    color: '#10b981',
    icon: <ArrowDownOutlined />,
    description: 'Incoming traffic to local system',
  },
  FORWARD: {
    color: '#a855f7',
    icon: <SwapOutlined />,
    description: 'Traffic passing through (routing)',
  },
  OUTPUT: {
    color: '#3b82f6',
    icon: <ArrowUpOutlined />,
    description: 'Outgoing traffic from local system',
  },
  POSTROUTING: {
    color: '#ec4899',
    icon: <ExportOutlined />,
    description: 'After routing decision (nat, mangle)',
  },
};

// Table colors
const tableColors: Record<string, string> = {
  filter: '#3b82f6',
  nat: '#10b981',
  mangle: '#a855f7',
  raw: '#f59e0b',
  security: '#64748b',
};

const FlowNode: React.FC<{
  chain: string;
  stats: ChainStats;
  x: number;
  y: number;
  onClick?: () => void;
}> = ({ chain, stats, x, y, onClick }) => {
  const config = chainConfig[chain] || {
    color: '#64748b',
    icon: <NodeIndexOutlined />,
    description: 'Custom chain',
  };

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <Tooltip title={config.description}>
        <g transform={`translate(${x}, ${y})`}>
          {/* Node background */}
          <rect
            x="-70"
            y="-40"
            width="140"
            height="80"
            rx="12"
            fill="var(--cyber-bg-card)"
            stroke={config.color}
            strokeWidth="2"
            style={{
              filter: `drop-shadow(0 0 10px ${config.color}40)`,
            }}
          />
          {/* Chain name */}
          <text
            textAnchor="middle"
            y="-15"
            fill={config.color}
            fontSize="14"
            fontWeight="600"
          >
            {chain}
          </text>
          {/* Rule count */}
          <text
            textAnchor="middle"
            y="5"
            fill="var(--cyber-text-secondary)"
            fontSize="11"
          >
            {stats.ruleCount} rules
          </text>
          {/* Packet/Byte stats */}
          <text
            textAnchor="middle"
            y="22"
            fill="var(--cyber-text-muted)"
            fontSize="10"
          >
            {stats.packets.toLocaleString()} pkts
          </text>
          {/* Table indicators */}
          <g transform="translate(0, 35)">
            {stats.tables.map((table, i) => (
              <circle
                key={table}
                cx={(i - (stats.tables.length - 1) / 2) * 16}
                cy="0"
                r="5"
                fill={tableColors[table] || '#64748b'}
              />
            ))}
          </g>
        </g>
      </Tooltip>
    </motion.g>
  );
};

const FlowArrow: React.FC<{
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  animated?: boolean;
}> = ({ x1, y1, x2, y2, label, animated }) => {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;

  return (
    <g>
      {/* Arrow line */}
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--cyber-border)"
        strokeWidth="2"
        markerEnd="url(#arrowhead)"
      />
      {/* Animated packet */}
      {animated && (
        <motion.circle
          cx={x1}
          cy={y1}
          r="4"
          fill="var(--cyber-cyan)"
          animate={{
            cx: [x1, x2],
            cy: [y1, y2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      )}
      {/* Label */}
      {label && (
        <text
          x={midX}
          y={midY - 8}
          textAnchor="middle"
          fill="var(--cyber-text-muted)"
          fontSize="10"
        >
          {label}
        </text>
      )}
    </g>
  );
};

export const ChainFlowDiagram: React.FC = () => {
  const { rules } = useSelector((state: RootState) => state.rules);
  const [selectedTable, setSelectedTable] = React.useState<string>('all');

  // Calculate chain statistics
  const chainStats = useMemo(() => {
    const stats: Record<string, ChainStats> = {};
    const filteredRules = selectedTable === 'all'
      ? rules
      : rules.filter((r) => r.table === selectedTable);

    filteredRules.forEach((rule) => {
      if (!stats[rule.chain]) {
        stats[rule.chain] = {
          chain: rule.chain,
          tables: [],
          ruleCount: 0,
          packets: 0,
          bytes: 0,
        };
      }
      stats[rule.chain].ruleCount++;
      stats[rule.chain].packets += rule.packets;
      stats[rule.chain].bytes += rule.bytes;
      if (!stats[rule.chain].tables.includes(rule.table)) {
        stats[rule.chain].tables.push(rule.table);
      }
    });

    return stats;
  }, [rules, selectedTable]);

  // Get unique tables
  const tables = useMemo(() => {
    const uniqueTables = Array.from(new Set(rules.map((r) => r.table)));
    return ['all', ...uniqueTables.sort()];
  }, [rules]);

  // Node positions (centered layout)
  const layout = {
    incoming: { x: 400, y: 30 },
    prerouting: { x: 400, y: 100 },
    routing: { x: 400, y: 180 },
    input: { x: 250, y: 280 },
    forward: { x: 550, y: 280 },
    local: { x: 250, y: 380 },
    output: { x: 250, y: 480 },
    postrouting: { x: 400, y: 560 },
    outgoing: { x: 400, y: 640 },
  };

  const defaultStats: ChainStats = {
    chain: '',
    tables: [],
    ruleCount: 0,
    packets: 0,
    bytes: 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '24px' }}
    >
      <Card
        style={{
          background: 'var(--cyber-bg-card)',
          border: '1px solid var(--cyber-border)',
          borderRadius: '16px',
        }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0, color: 'var(--cyber-text-primary)' }}>
                IPTables Packet Flow
              </Title>
              <Text type="secondary">
                Visual representation of packet flow through iptables chains
              </Text>
            </div>
            <Space>
              <Text type="secondary">Filter by Table:</Text>
              <Select
                value={selectedTable}
                onChange={setSelectedTable}
                style={{ width: 140 }}
                options={tables.map((t) => ({
                  label: t === 'all' ? 'All Tables' : t.toUpperCase(),
                  value: t,
                }))}
              />
            </Space>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            padding: '12px',
            background: 'var(--cyber-bg-secondary)',
            borderRadius: '8px',
          }}>
            <Text type="secondary" style={{ marginRight: '8px' }}>Tables:</Text>
            {Object.entries(tableColors).map(([table, color]) => (
              <Tag
                key={table}
                style={{
                  background: `${color}20`,
                  border: `1px solid ${color}40`,
                  color: color,
                }}
              >
                {table}
              </Tag>
            ))}
          </div>

          {/* SVG Diagram */}
          <div style={{ overflow: 'auto' }}>
            <svg
              width="800"
              height="700"
              viewBox="0 0 800 700"
              style={{ margin: '0 auto', display: 'block' }}
            >
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="10"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill="var(--cyber-border)"
                  />
                </marker>
              </defs>

              {/* Background grid */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="var(--cyber-border)"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Incoming Packet */}
              <g transform={`translate(${layout.incoming.x}, ${layout.incoming.y})`}>
                <rect x="-60" y="-15" width="120" height="30" rx="6" fill="var(--cyber-bg-secondary)" stroke="var(--cyber-cyan)" />
                <CloudOutlined style={{ position: 'absolute' }} />
                <text textAnchor="middle" y="5" fill="var(--cyber-cyan)" fontSize="12" fontWeight="500">
                  INCOMING PACKET
                </text>
              </g>

              {/* Arrows */}
              <FlowArrow x1={400} y1={45} x2={400} y2={60} animated />

              {/* PREROUTING */}
              <FlowNode
                chain="PREROUTING"
                stats={chainStats['PREROUTING'] || defaultStats}
                x={layout.prerouting.x}
                y={layout.prerouting.y}
              />

              <FlowArrow x1={400} y1={140} x2={400} y2={155} />

              {/* Routing Decision */}
              <g transform={`translate(${layout.routing.x}, ${layout.routing.y})`}>
                <polygon
                  points="0,-25 60,0 0,25 -60,0"
                  fill="var(--cyber-bg-secondary)"
                  stroke="var(--cyber-orange)"
                  strokeWidth="2"
                />
                <text textAnchor="middle" y="5" fill="var(--cyber-orange)" fontSize="11" fontWeight="500">
                  ROUTING
                </text>
              </g>

              {/* Split arrows from routing */}
              <FlowArrow x1={340} y1={190} x2={260} y2={240} label="local" />
              <FlowArrow x1={460} y1={190} x2={540} y2={240} label="forward" />

              {/* INPUT */}
              <FlowNode
                chain="INPUT"
                stats={chainStats['INPUT'] || defaultStats}
                x={layout.input.x}
                y={layout.input.y}
              />

              {/* FORWARD */}
              <FlowNode
                chain="FORWARD"
                stats={chainStats['FORWARD'] || defaultStats}
                x={layout.forward.x}
                y={layout.forward.y}
              />

              <FlowArrow x1={250} y1={320} x2={250} y2={340} />

              {/* Local Process */}
              <g transform={`translate(${layout.local.x}, ${layout.local.y})`}>
                <rect x="-60" y="-20" width="120" height="40" rx="8" fill="var(--cyber-bg-hover)" stroke="var(--cyber-green)" strokeDasharray="4" />
                <DesktopOutlined style={{ position: 'absolute' }} />
                <text textAnchor="middle" y="5" fill="var(--cyber-green)" fontSize="11" fontWeight="500">
                  LOCAL PROCESS
                </text>
              </g>

              <FlowArrow x1={250} y1={400} x2={250} y2={440} />

              {/* OUTPUT */}
              <FlowNode
                chain="OUTPUT"
                stats={chainStats['OUTPUT'] || defaultStats}
                x={layout.output.x}
                y={layout.output.y}
              />

              {/* Merge arrows to POSTROUTING */}
              <FlowArrow x1={250} y1={520} x2={340} y2={540} />
              <FlowArrow x1={550} y1={320} x2={460} y2={540} />

              {/* POSTROUTING */}
              <FlowNode
                chain="POSTROUTING"
                stats={chainStats['POSTROUTING'] || defaultStats}
                x={layout.postrouting.x}
                y={layout.postrouting.y}
              />

              <FlowArrow x1={400} y1={600} x2={400} y2={615} animated />

              {/* Outgoing Packet */}
              <g transform={`translate(${layout.outgoing.x}, ${layout.outgoing.y})`}>
                <rect x="-60" y="-15" width="120" height="30" rx="6" fill="var(--cyber-bg-secondary)" stroke="var(--cyber-pink)" />
                <text textAnchor="middle" y="5" fill="var(--cyber-pink)" fontSize="12" fontWeight="500">
                  OUTGOING PACKET
                </text>
              </g>
            </svg>
          </div>

          {/* Stats summary */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            padding: '16px',
            background: 'var(--cyber-bg-secondary)',
            borderRadius: '8px',
          }}>
            {Object.entries(chainStats).map(([chain, stats]) => {
              const config = chainConfig[chain];
              return (
                <div
                  key={chain}
                  style={{
                    padding: '12px',
                    background: 'var(--cyber-bg-card)',
                    borderRadius: '8px',
                    borderLeft: `3px solid ${config?.color || '#64748b'}`,
                  }}
                >
                  <Text strong style={{ color: config?.color || 'var(--cyber-text-primary)' }}>
                    {chain}
                  </Text>
                  <div style={{ marginTop: '8px' }}>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {stats.ruleCount} rules
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {stats.packets.toLocaleString()} packets
                    </Text>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                      {formatBytes(stats.bytes)}
                    </Text>
                  </div>
                </div>
              );
            })}
          </div>
        </Space>
      </Card>
    </motion.div>
  );
};
