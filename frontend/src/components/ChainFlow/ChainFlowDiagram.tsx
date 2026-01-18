import React, { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Select, Space, Tooltip, Tag, Switch } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  BranchesOutlined,
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

interface ChainRelation {
  from: string;
  to: string;
  count: number;
  table: string;
}

// Built-in chain configuration
const builtinChainConfig: Record<string, { color: string; icon: React.ReactNode; description: string; type: 'builtin' }> = {
  PREROUTING: {
    color: '#f59e0b',
    icon: <ImportOutlined />,
    description: 'Before routing decision (nat, mangle, raw)',
    type: 'builtin',
  },
  INPUT: {
    color: '#10b981',
    icon: <ArrowDownOutlined />,
    description: 'Incoming traffic to local system',
    type: 'builtin',
  },
  FORWARD: {
    color: '#a855f7',
    icon: <SwapOutlined />,
    description: 'Traffic passing through (routing)',
    type: 'builtin',
  },
  OUTPUT: {
    color: '#3b82f6',
    icon: <ArrowUpOutlined />,
    description: 'Outgoing traffic from local system',
    type: 'builtin',
  },
  POSTROUTING: {
    color: '#ec4899',
    icon: <ExportOutlined />,
    description: 'After routing decision (nat, mangle)',
    type: 'builtin',
  },
};

// Known terminal targets (not chain jumps)
const terminalTargets = new Set([
  'ACCEPT', 'DROP', 'REJECT', 'RETURN', 'QUEUE', 'NFQUEUE',
  'LOG', 'ULOG', 'MARK', 'CONNMARK', 'TOS', 'DSCP',
  'MASQUERADE', 'SNAT', 'DNAT', 'REDIRECT', 'NETMAP',
  'TCPMSS', 'CLUSTERIP', 'TTL', 'HL', 'SECMARK', 'CONNSECMARK',
  'NOTRACK', 'TRACE', 'SET', 'CT', 'CHECKSUM', 'AUDIT',
  'SYNPROXY', 'TPROXY', 'CLASSIFY',
]);

// Table colors
const tableColors: Record<string, string> = {
  filter: '#3b82f6',
  nat: '#10b981',
  mangle: '#a855f7',
  raw: '#f59e0b',
  security: '#64748b',
};

// Generate a color for custom chains
const getChainColor = (chain: string, index: number): string => {
  if (builtinChainConfig[chain]) {
    return builtinChainConfig[chain].color;
  }
  const colors = ['#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#f97316', '#14b8a6', '#6366f1', '#ec4899'];
  return colors[index % colors.length];
};

export const ChainFlowDiagram: React.FC = () => {
  const { rules } = useSelector((state: RootState) => state.rules);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [showCustomOnly, setShowCustomOnly] = useState<boolean>(false);

  // Calculate chain statistics and relationships
  const { chainStats, chainRelations, customChains, allChains } = useMemo(() => {
    const stats: Record<string, ChainStats> = {};
    const relations: ChainRelation[] = [];
    const relationMap: Map<string, ChainRelation> = new Map();
    const customSet = new Set<string>();
    const chainSet = new Set<string>();

    const filteredRules = selectedTable === 'all'
      ? rules
      : rules.filter((r) => r.table === selectedTable);

    filteredRules.forEach((rule) => {
      // Track chain stats
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

      chainSet.add(rule.chain);

      // Check if target is a chain jump (not a terminal target)
      const target = rule.target;
      if (target && !terminalTargets.has(target.toUpperCase())) {
        // This is likely a jump to another chain
        const key = `${rule.chain}->${target}`;
        if (relationMap.has(key)) {
          relationMap.get(key)!.count++;
        } else {
          const rel: ChainRelation = {
            from: rule.chain,
            to: target,
            count: 1,
            table: rule.table,
          };
          relationMap.set(key, rel);
          relations.push(rel);
        }

        // Mark target as a custom chain if it's not builtin
        if (!builtinChainConfig[target]) {
          customSet.add(target);
          chainSet.add(target);
        }
      }

      // Mark source chain as custom if not builtin
      if (!builtinChainConfig[rule.chain]) {
        customSet.add(rule.chain);
      }
    });

    return {
      chainStats: stats,
      chainRelations: relations,
      customChains: Array.from(customSet).sort(),
      allChains: Array.from(chainSet).sort(),
    };
  }, [rules, selectedTable]);

  // Get unique tables
  const tables = useMemo(() => {
    const uniqueTables = Array.from(new Set(rules.map((r) => r.table)));
    return ['all', ...uniqueTables.sort()];
  }, [rules]);

  // Calculate layout positions for chains
  const layoutPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const builtinChains = ['PREROUTING', 'INPUT', 'FORWARD', 'OUTPUT', 'POSTROUTING'];
    const width = 900;
    const height = Math.max(700, 200 + customChains.length * 80);

    // Built-in chains layout (standard iptables flow)
    const builtinLayout: Record<string, { x: number; y: number }> = {
      PREROUTING: { x: width / 2, y: 80 },
      INPUT: { x: width / 3, y: 220 },
      FORWARD: { x: (2 * width) / 3, y: 220 },
      OUTPUT: { x: width / 3, y: 400 },
      POSTROUTING: { x: width / 2, y: 540 },
    };

    // Add builtin chains that have rules
    builtinChains.forEach((chain) => {
      if (chainStats[chain] || chainRelations.some((r) => r.from === chain || r.to === chain)) {
        positions[chain] = builtinLayout[chain];
      }
    });

    // Layout custom chains on the right side
    const customChainsWithStats = customChains.filter(
      (c) => chainStats[c] || chainRelations.some((r) => r.from === c || r.to === c)
    );

    customChainsWithStats.forEach((chain, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      positions[chain] = {
        x: width - 180 + col * 160,
        y: 100 + row * 100,
      };
    });

    return { positions, width, height };
  }, [chainStats, chainRelations, customChains]);

  // Calculate path for curved arrows
  const getArrowPath = useCallback((x1: number, y1: number, x2: number, y2: number): string => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Curve control point offset
    const curveOffset = Math.min(50, dist * 0.3);

    // Calculate perpendicular offset for curve
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    // Perpendicular direction
    const px = -dy / dist;
    const py = dx / dist;

    const cx = mx + px * curveOffset;
    const cy = my + py * curveOffset;

    return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
  }, []);

  // Render a chain node
  const renderChainNode = useCallback((chain: string, x: number, y: number, index: number) => {
    const defaultStats: ChainStats = {
      chain: '',
      tables: [],
      ruleCount: 0,
      packets: 0,
      bytes: 0,
    };
    const stats = chainStats[chain] || defaultStats;
    const isBuiltin = !!builtinChainConfig[chain];
    const config = builtinChainConfig[chain] || {
      color: getChainColor(chain, index),
      icon: <BranchesOutlined />,
      description: 'Custom chain',
    };

    // Find incoming and outgoing relations
    const incoming = chainRelations.filter((r) => r.to === chain);
    const outgoing = chainRelations.filter((r) => r.from === chain);

    return (
      <motion.g
        key={chain}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Tooltip
          title={
            <div>
              <div><strong>{chain}</strong></div>
              <div>{config.description}</div>
              <div style={{ marginTop: 8 }}>
                {incoming.length > 0 && (
                  <div>← From: {incoming.map((r) => r.from).join(', ')}</div>
                )}
                {outgoing.length > 0 && (
                  <div>→ To: {outgoing.map((r) => r.to).join(', ')}</div>
                )}
              </div>
            </div>
          }
        >
          <g transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }}>
            {/* Node background */}
            <rect
              x="-70"
              y="-45"
              width="140"
              height="90"
              rx="12"
              fill="var(--cyber-bg-card)"
              stroke={config.color}
              strokeWidth={isBuiltin ? 2 : 2}
              strokeDasharray={isBuiltin ? undefined : '4'}
              style={{
                filter: `drop-shadow(0 0 8px ${config.color}40)`,
              }}
            />

            {/* Chain type indicator */}
            {!isBuiltin && (
              <rect
                x="-70"
                y="-45"
                width="50"
                height="18"
                rx="6"
                fill={config.color}
                opacity="0.9"
              />
            )}
            {!isBuiltin && (
              <text x="-45" y="-32" fill="#fff" fontSize="9" fontWeight="500">
                CUSTOM
              </text>
            )}

            {/* Chain name */}
            <text
              textAnchor="middle"
              y={isBuiltin ? -15 : -10}
              fill={config.color}
              fontSize="13"
              fontWeight="600"
            >
              {chain.length > 14 ? chain.substring(0, 12) + '...' : chain}
            </text>

            {/* Rule count */}
            <text
              textAnchor="middle"
              y="8"
              fill="var(--cyber-text-secondary)"
              fontSize="11"
            >
              {stats.ruleCount} rules
            </text>

            {/* Packet stats */}
            <text
              textAnchor="middle"
              y="24"
              fill="var(--cyber-text-muted)"
              fontSize="10"
            >
              {stats.packets.toLocaleString()} pkts
            </text>

            {/* Table indicators */}
            <g transform="translate(0, 38)">
              {stats.tables.map((table, i) => (
                <circle
                  key={table}
                  cx={(i - (stats.tables.length - 1) / 2) * 14}
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
  }, [chainStats, chainRelations]);

  // Filter chains to display
  const displayChains = useMemo(() => {
    if (showCustomOnly) {
      return allChains.filter((c) => !builtinChainConfig[c]);
    }
    return allChains;
  }, [allChains, showCustomOnly]);

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <Title level={4} style={{ margin: 0, color: 'var(--cyber-text-primary)' }}>
                IPTables Chain Relationships
              </Title>
              <Text type="secondary">
                Visual representation of chain relationships and packet flow
              </Text>
            </div>
            <Space wrap>
              <Space>
                <Text type="secondary">Show Custom Only:</Text>
                <Switch checked={showCustomOnly} onChange={setShowCustomOnly} size="small" />
              </Space>
              <Space>
                <Text type="secondary">Table:</Text>
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
            alignItems: 'center',
          }}>
            <Text type="secondary">Tables:</Text>
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
            <span style={{ margin: '0 8px', color: 'var(--cyber-border)' }}>|</span>
            <Text type="secondary">Chains:</Text>
            <Tag style={{ border: '2px solid var(--cyber-cyan)', background: 'transparent', color: 'var(--cyber-text-secondary)' }}>
              Built-in
            </Tag>
            <Tag style={{ border: '2px dashed var(--cyber-purple)', background: 'transparent', color: 'var(--cyber-text-secondary)' }}>
              Custom
            </Tag>
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            padding: '12px 16px',
            background: 'var(--cyber-bg-secondary)',
            borderRadius: '8px',
          }}>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Total Chains</Text>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cyber-cyan)' }}>
                {allChains.length}
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Custom Chains</Text>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cyber-purple)' }}>
                {customChains.length}
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>Chain Relations</Text>
              <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--cyber-orange)' }}>
                {chainRelations.length}
              </div>
            </div>
          </div>

          {/* SVG Diagram */}
          <div style={{ overflow: 'auto', background: 'var(--cyber-bg-secondary)', borderRadius: 12, padding: 16 }}>
            <svg
              width={layoutPositions.width}
              height={layoutPositions.height}
              viewBox={`0 0 ${layoutPositions.width} ${layoutPositions.height}`}
              style={{ margin: '0 auto', display: 'block', minWidth: 800 }}
            >
              {/* Definitions */}
              <defs>
                {/* Arrow markers with different colors */}
                <marker
                  id="arrowhead-default"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="var(--cyber-cyan)" />
                </marker>
                <marker
                  id="arrowhead-custom"
                  markerWidth="8"
                  markerHeight="6"
                  refX="8"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="var(--cyber-purple)" />
                </marker>

                {/* Background grid */}
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
              <rect width="100%" height="100%" fill="url(#grid)" rx="8" />

              {/* Draw relation arrows */}
              {chainRelations.map((rel, idx) => {
                const fromPos = layoutPositions.positions[rel.from];
                const toPos = layoutPositions.positions[rel.to];

                if (!fromPos || !toPos) return null;

                const isToCustom = !builtinChainConfig[rel.to];
                const markerId = isToCustom ? 'arrowhead-custom' : 'arrowhead-default';

                // Adjust start/end points to edge of nodes
                const dx = toPos.x - fromPos.x;
                const dy = toPos.y - fromPos.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const offsetX = (dx / dist) * 70;
                const offsetY = (dy / dist) * 45;

                const x1 = fromPos.x + offsetX;
                const y1 = fromPos.y + offsetY;
                const x2 = toPos.x - offsetX;
                const y2 = toPos.y - offsetY;

                return (
                  <g key={`rel-${idx}`}>
                    <motion.path
                      d={getArrowPath(x1, y1, x2, y2)}
                      fill="none"
                      stroke={isToCustom ? 'var(--cyber-purple)' : 'var(--cyber-cyan)'}
                      strokeWidth="2"
                      strokeOpacity="0.6"
                      markerEnd={`url(#${markerId})`}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    />
                    {/* Relation count badge */}
                    <g transform={`translate(${(x1 + x2) / 2}, ${(y1 + y2) / 2 - 10})`}>
                      <rect
                        x="-12"
                        y="-8"
                        width="24"
                        height="16"
                        rx="8"
                        fill={isToCustom ? 'var(--cyber-purple)' : 'var(--cyber-cyan)'}
                        opacity="0.9"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fill="#fff"
                        fontSize="9"
                        fontWeight="600"
                      >
                        {rel.count}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Draw chain nodes */}
              {displayChains.map((chain, idx) => {
                const pos = layoutPositions.positions[chain];
                if (!pos) return null;
                return renderChainNode(chain, pos.x, pos.y, idx);
              })}

              {/* No data message */}
              {displayChains.length === 0 && (
                <text
                  x={layoutPositions.width / 2}
                  y={layoutPositions.height / 2}
                  textAnchor="middle"
                  fill="var(--cyber-text-muted)"
                  fontSize="14"
                >
                  No chains to display
                </text>
              )}
            </svg>
          </div>

          {/* Chain details grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}>
            {Object.entries(chainStats)
              .filter(([chain]) => !showCustomOnly || !builtinChainConfig[chain])
              .map(([chain, stats], idx) => {
                const isBuiltin = !!builtinChainConfig[chain];
                const config = builtinChainConfig[chain];
                const color = config?.color || getChainColor(chain, idx);
                const incoming = chainRelations.filter((r) => r.to === chain);
                const outgoing = chainRelations.filter((r) => r.from === chain);

                return (
                  <div
                    key={chain}
                    style={{
                      padding: '12px',
                      background: 'var(--cyber-bg-card)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${color}`,
                      border: isBuiltin ? undefined : `1px dashed ${color}40`,
                      borderLeftWidth: 3,
                      borderLeftStyle: 'solid',
                      borderLeftColor: color,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {!isBuiltin && (
                        <Tag style={{ fontSize: 9, padding: '0 4px', background: `${color}30`, border: 'none', color }}>
                          CUSTOM
                        </Tag>
                      )}
                      <Text strong style={{ color, fontSize: 13 }}>
                        {chain}
                      </Text>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--cyber-text-secondary)' }}>
                      <div>{stats.ruleCount} rules</div>
                      <div>{stats.packets.toLocaleString()} packets</div>
                      <div>{formatBytes(stats.bytes)}</div>
                    </div>
                    {(incoming.length > 0 || outgoing.length > 0) && (
                      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--cyber-border)', fontSize: 11 }}>
                        {incoming.length > 0 && (
                          <div style={{ color: 'var(--cyber-text-muted)' }}>
                            ← {incoming.map((r) => r.from).join(', ')}
                          </div>
                        )}
                        {outgoing.length > 0 && (
                          <div style={{ color: 'var(--cyber-text-muted)' }}>
                            → {outgoing.map((r) => r.to).join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </Space>
      </Card>
    </motion.div>
  );
};
