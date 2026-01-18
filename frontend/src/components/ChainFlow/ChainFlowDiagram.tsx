import React, { useMemo, useState, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Select, Space, Tooltip, Tag, Switch, Modal, Button, Slider } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  BranchesOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { RootState } from '../../store/store';
import { formatBytes } from '../../utils/formatters';
import { Rule } from '../../types/rule';

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
  const [zoom, setZoom] = useState<number>(100);
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Get rules for selected chain
  const selectedChainRules = useMemo(() => {
    if (!selectedChain) return [];
    return rules.filter((r) => r.chain === selectedChain || r.target === selectedChain);
  }, [rules, selectedChain]);

  // Get unique tables
  const tables = useMemo(() => {
    const uniqueTables = Array.from(new Set(rules.map((r) => r.table)));
    return ['all', ...uniqueTables.sort()];
  }, [rules]);

  // Calculate layout positions for chains
  const layoutPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const builtinChains = ['PREROUTING', 'INPUT', 'FORWARD', 'OUTPUT', 'POSTROUTING'];

    // Calculate dimensions based on custom chains
    const customCount = customChains.length;
    const customRows = Math.ceil(customCount / 2);
    const width = 800;
    const baseHeight = 620;
    const height = Math.max(baseHeight, 150 + customRows * 120);

    // Built-in chains layout (standard iptables flow) - centered
    const centerX = width / 2;
    const builtinLayout: Record<string, { x: number; y: number }> = {
      PREROUTING: { x: centerX, y: 80 },
      INPUT: { x: centerX - 150, y: 220 },
      FORWARD: { x: centerX + 150, y: 220 },
      OUTPUT: { x: centerX - 150, y: 400 },
      POSTROUTING: { x: centerX, y: 540 },
    };

    // Add builtin chains that have rules
    builtinChains.forEach((chain) => {
      if (chainStats[chain] || chainRelations.some((r) => r.from === chain || r.to === chain)) {
        positions[chain] = builtinLayout[chain];
      }
    });

    // Layout custom chains on the right side in a grid
    const customChainsWithStats = customChains.filter(
      (c) => chainStats[c] || chainRelations.some((r) => r.from === c || r.to === c)
    );

    customChainsWithStats.forEach((chain, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      positions[chain] = {
        x: width - 200 + col * 180,
        y: 100 + row * 120,
      };
    });

    return { positions, width, height };
  }, [chainStats, chainRelations, customChains]);

  // Calculate path for curved arrows
  const getArrowPath = useCallback((x1: number, y1: number, x2: number, y2: number): string => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return `M ${x1} ${y1} L ${x2} ${y2}`;

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

  // Handle chain click
  const handleChainClick = useCallback((chain: string) => {
    setSelectedChain(chain);
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

    return (
      <motion.g
        key={chain}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        onClick={() => handleChainClick(chain)}
        style={{ cursor: 'pointer' }}
      >
        <g transform={`translate(${x}, ${y})`}>
          {/* Node background */}
          <rect
            x="-70"
            y="-45"
            width="140"
            height="90"
            rx="12"
            fill="var(--cyber-bg-card)"
            stroke={config.color}
            strokeWidth={2}
            strokeDasharray={isBuiltin ? undefined : '4'}
            style={{
              filter: `drop-shadow(0 0 8px ${config.color}40)`,
            }}
          />

          {/* Hover effect */}
          <rect
            x="-70"
            y="-45"
            width="140"
            height="90"
            rx="12"
            fill="transparent"
            stroke="transparent"
            className="chain-node-hover"
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
              <Tooltip key={table} title={table}>
                <circle
                  cx={(i - (stats.tables.length - 1) / 2) * 14}
                  cy="0"
                  r="5"
                  fill={tableColors[table] || '#64748b'}
                />
              </Tooltip>
            ))}
          </g>

          {/* Click hint */}
          <text
            textAnchor="middle"
            y="55"
            fill="var(--cyber-text-muted)"
            fontSize="8"
            opacity="0.6"
          >
            Click for details
          </text>
        </g>
      </motion.g>
    );
  }, [chainStats, handleChainClick]);

  // Filter chains to display
  const displayChains = useMemo(() => {
    if (showCustomOnly) {
      return allChains.filter((c) => !builtinChainConfig[c]);
    }
    return allChains;
  }, [allChains, showCustomOnly]);

  // Get chain detail info
  const getChainDetail = useCallback((chain: string) => {
    const stats = chainStats[chain];
    const incoming = chainRelations.filter((r) => r.to === chain);
    const outgoing = chainRelations.filter((r) => r.from === chain);
    const isBuiltin = !!builtinChainConfig[chain];
    const config = builtinChainConfig[chain];
    const color = config?.color || getChainColor(chain, 0);

    return { stats, incoming, outgoing, isBuiltin, config, color };
  }, [chainStats, chainRelations]);

  // Render rule row for modal
  const renderRuleRow = (rule: Rule, index: number) => (
    <div
      key={`${rule.table}-${rule.chain}-${rule.line_number}-${index}`}
      style={{
        padding: '8px 12px',
        background: index % 2 === 0 ? 'var(--cyber-bg-secondary)' : 'transparent',
        borderRadius: 4,
        fontSize: 12,
        display: 'grid',
        gridTemplateColumns: '40px 60px 80px 100px 100px 80px',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <span style={{ color: 'var(--cyber-text-muted)' }}>#{rule.line_number}</span>
      <Tag style={{ margin: 0, fontSize: 10 }} color={tableColors[rule.table] ? undefined : 'default'}>
        {rule.table}
      </Tag>
      <span style={{ color: rule.target === 'ACCEPT' ? '#10b981' : rule.target === 'DROP' ? '#ef4444' : 'var(--cyber-cyan)' }}>
        {rule.target}
      </span>
      <span style={{ color: 'var(--cyber-text-secondary)', fontFamily: 'monospace' }}>
        {rule.source === '0.0.0.0/0' ? 'any' : rule.source}
      </span>
      <span style={{ color: 'var(--cyber-text-secondary)', fontFamily: 'monospace' }}>
        {rule.destination === '0.0.0.0/0' ? 'any' : rule.destination}
      </span>
      <span style={{ color: 'var(--cyber-text-muted)' }}>
        {rule.protocol || 'all'}
      </span>
    </div>
  );

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
                Click on any chain to view details
              </Text>
            </div>
            <Space wrap>
              <Space>
                <Text type="secondary">Custom Only:</Text>
                <Switch checked={showCustomOnly} onChange={setShowCustomOnly} size="small" />
              </Space>
              <Space>
                <Text type="secondary">Table:</Text>
                <Select
                  value={selectedTable}
                  onChange={setSelectedTable}
                  style={{ width: 120 }}
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
            gap: '12px',
            flexWrap: 'wrap',
            padding: '10px 12px',
            background: 'var(--cyber-bg-secondary)',
            borderRadius: '8px',
            alignItems: 'center',
            fontSize: 12,
          }}>
            <Text type="secondary">Tables:</Text>
            {Object.entries(tableColors).map(([table, color]) => (
              <Tag
                key={table}
                style={{
                  background: `${color}20`,
                  border: `1px solid ${color}40`,
                  color: color,
                  fontSize: 11,
                }}
              >
                {table}
              </Tag>
            ))}
            <span style={{ margin: '0 4px', color: 'var(--cyber-border)' }}>|</span>
            <Tag style={{ border: '2px solid var(--cyber-cyan)', background: 'transparent', color: 'var(--cyber-text-secondary)', fontSize: 11 }}>
              Built-in
            </Tag>
            <Tag style={{ border: '2px dashed var(--cyber-purple)', background: 'transparent', color: 'var(--cyber-text-secondary)', fontSize: 11 }}>
              Custom
            </Tag>
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'flex',
            gap: '24px',
            flexWrap: 'wrap',
            padding: '10px 16px',
            background: 'var(--cyber-bg-secondary)',
            borderRadius: '8px',
          }}>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>Total Chains</Text>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cyber-cyan)' }}>
                {allChains.length}
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>Custom Chains</Text>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cyber-purple)' }}>
                {customChains.length}
              </div>
            </div>
            <div>
              <Text type="secondary" style={{ fontSize: 11 }}>Chain Relations</Text>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--cyber-orange)' }}>
                {chainRelations.length}
              </div>
            </div>
          </div>

          {/* Zoom Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px',
            background: 'var(--cyber-bg-secondary)',
            borderRadius: '8px',
          }}>
            <ZoomOutOutlined style={{ color: 'var(--cyber-text-muted)' }} />
            <Slider
              min={50}
              max={150}
              value={zoom}
              onChange={setZoom}
              style={{ flex: 1, maxWidth: 200 }}
              tooltip={{ formatter: (v) => `${v}%` }}
            />
            <ZoomInOutlined style={{ color: 'var(--cyber-text-muted)' }} />
            <Text type="secondary" style={{ fontSize: 12, minWidth: 40 }}>{zoom}%</Text>
            <Button
              size="small"
              icon={<FullscreenOutlined />}
              onClick={() => setZoom(100)}
              style={{ marginLeft: 8 }}
            >
              Reset
            </Button>
          </div>

          {/* SVG Diagram */}
          <div
            ref={containerRef}
            style={{
              overflow: 'auto',
              background: 'var(--cyber-bg-secondary)',
              borderRadius: 12,
              padding: 16,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <div style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
            }}>
              <svg
                width={layoutPositions.width}
                height={layoutPositions.height}
                viewBox={`0 0 ${layoutPositions.width} ${layoutPositions.height}`}
                style={{ display: 'block' }}
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
                  if (dist === 0) return null;

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
                    onClick={() => handleChainClick(chain)}
                    style={{
                      padding: '12px',
                      background: 'var(--cyber-bg-card)',
                      borderRadius: '8px',
                      borderLeft: `3px solid ${color}`,
                      border: isBuiltin ? undefined : `1px dashed ${color}40`,
                      borderLeftWidth: 3,
                      borderLeftStyle: 'solid',
                      borderLeftColor: color,
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
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

      {/* Chain Detail Modal */}
      <Modal
        open={!!selectedChain}
        onCancel={() => setSelectedChain(null)}
        footer={null}
        width={700}
        title={null}
        closeIcon={<CloseOutlined style={{ color: 'var(--cyber-text-secondary)' }} />}
        className="chain-detail-modal"
      >
        {selectedChain && (() => {
          const { stats, incoming, outgoing, isBuiltin, config, color } = getChainDetail(selectedChain);
          return (
            <div>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
                paddingBottom: 16,
                borderBottom: '1px solid var(--cyber-border)',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: `${color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: color,
                }}>
                  {config?.icon || <BranchesOutlined />}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Title level={4} style={{ margin: 0, color: color }}>
                      {selectedChain}
                    </Title>
                    {!isBuiltin && (
                      <Tag style={{ background: `${color}30`, border: 'none', color, fontSize: 10 }}>
                        CUSTOM
                      </Tag>
                    )}
                  </div>
                  <Text type="secondary">
                    {config?.description || 'Custom chain'}
                  </Text>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 20,
              }}>
                <div style={{
                  padding: 16,
                  background: 'var(--cyber-bg-secondary)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-cyan)' }}>
                    {stats?.ruleCount || 0}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Rules</Text>
                </div>
                <div style={{
                  padding: 16,
                  background: 'var(--cyber-bg-secondary)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-green)' }}>
                    {(stats?.packets || 0).toLocaleString()}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Packets</Text>
                </div>
                <div style={{
                  padding: 16,
                  background: 'var(--cyber-bg-secondary)',
                  borderRadius: 8,
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-purple)' }}>
                    {formatBytes(stats?.bytes || 0)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Traffic</Text>
                </div>
              </div>

              {/* Relations */}
              {(incoming.length > 0 || outgoing.length > 0) && (
                <div style={{
                  marginBottom: 20,
                  padding: 16,
                  background: 'var(--cyber-bg-secondary)',
                  borderRadius: 8,
                }}>
                  <Text strong style={{ color: 'var(--cyber-text-primary)', display: 'block', marginBottom: 12 }}>
                    Chain Relationships
                  </Text>
                  {incoming.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Called from:</Text>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        {incoming.map((r) => (
                          <Tag
                            key={r.from}
                            style={{
                              background: 'var(--cyber-bg-card)',
                              border: '1px solid var(--cyber-border)',
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedChain(r.from)}
                          >
                            ← {r.from} ({r.count} rules)
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                  {outgoing.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Jumps to:</Text>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        {outgoing.map((r) => (
                          <Tag
                            key={r.to}
                            style={{
                              background: 'var(--cyber-bg-card)',
                              border: '1px solid var(--cyber-border)',
                              cursor: 'pointer',
                            }}
                            onClick={() => setSelectedChain(r.to)}
                          >
                            → {r.to} ({r.count} rules)
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Rules in this chain */}
              <div>
                <Text strong style={{ color: 'var(--cyber-text-primary)', display: 'block', marginBottom: 12 }}>
                  Rules ({selectedChainRules.length})
                </Text>
                <div style={{
                  maxHeight: 300,
                  overflowY: 'auto',
                  borderRadius: 8,
                  border: '1px solid var(--cyber-border)',
                }}>
                  {/* Header */}
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--cyber-bg-hover)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--cyber-text-secondary)',
                    display: 'grid',
                    gridTemplateColumns: '40px 60px 80px 100px 100px 80px',
                    gap: 8,
                    position: 'sticky',
                    top: 0,
                  }}>
                    <span>#</span>
                    <span>Table</span>
                    <span>Target</span>
                    <span>Source</span>
                    <span>Dest</span>
                    <span>Proto</span>
                  </div>
                  {selectedChainRules.length > 0 ? (
                    selectedChainRules.map((rule, idx) => renderRuleRow(rule, idx))
                  ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--cyber-text-muted)' }}>
                      No rules in this chain
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <style>{`
        .chain-node-hover:hover {
          stroke: var(--cyber-cyan) !important;
          stroke-width: 3px;
        }
        .chain-detail-modal .ant-modal-content {
          background: var(--cyber-bg-card) !important;
          border: 1px solid var(--cyber-border) !important;
          border-radius: 16px !important;
          padding: 24px !important;
        }
        .chain-detail-modal .ant-modal-header {
          background: transparent !important;
          border-bottom: none !important;
        }
        .chain-detail-modal .ant-modal-body {
          padding: 0 !important;
        }
      `}</style>
    </motion.div>
  );
};
