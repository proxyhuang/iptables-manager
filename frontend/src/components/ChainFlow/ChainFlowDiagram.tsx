import React, { useMemo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Select, Space, Tag, Modal, Button, Badge, Empty } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  BranchesOutlined,
  CloseOutlined,
  RightOutlined,
  DownOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
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

interface ChainGroup {
  prefix: string;
  chains: string[];
  color: string;
}

// Built-in chain configuration
const builtinChainConfig: Record<string, { color: string; icon: React.ReactNode; description: string }> = {
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

// Group colors for custom chain prefixes
const groupColors = [
  '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16',
  '#f97316', '#14b8a6', '#6366f1', '#ec4899',
  '#0ea5e9', '#a855f7', '#ef4444', '#22c55e',
];

// Get prefix from chain name
const getChainPrefix = (chain: string): string => {
  // Common prefixes
  const prefixes = ['KUBE-SEP-', 'KUBE-SVC-', 'KUBE-', 'DOCKER', 'CILIUM_', 'CNI-', 'cali-'];
  for (const prefix of prefixes) {
    if (chain.startsWith(prefix)) {
      return prefix;
    }
  }
  // If no known prefix, use first part before hyphen or underscore
  const match = chain.match(/^([A-Z]+[-_])/);
  return match ? match[1] : 'OTHER';
};

export const ChainFlowDiagram: React.FC = () => {
  const { rules } = useSelector((state: RootState) => state.rules);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  // Calculate chain statistics and relationships
  const { chainStats, chainRelations, customChains, allChains, builtinChainsWithRules } = useMemo(() => {
    const stats: Record<string, ChainStats> = {};
    const relations: ChainRelation[] = [];
    const relationMap: Map<string, ChainRelation> = new Map();
    const customSet = new Set<string>();
    const chainSet = new Set<string>();
    const builtinSet = new Set<string>();

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

      chainSet.add(rule.chain);

      if (builtinChainConfig[rule.chain]) {
        builtinSet.add(rule.chain);
      }

      const target = rule.target;
      if (target && !terminalTargets.has(target.toUpperCase())) {
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

        if (!builtinChainConfig[target]) {
          customSet.add(target);
          chainSet.add(target);
        }
      }

      if (!builtinChainConfig[rule.chain]) {
        customSet.add(rule.chain);
      }
    });

    return {
      chainStats: stats,
      chainRelations: relations,
      customChains: Array.from(customSet).sort(),
      allChains: Array.from(chainSet).sort(),
      builtinChainsWithRules: Array.from(builtinSet),
    };
  }, [rules, selectedTable]);

  // Group custom chains by prefix
  const chainGroups = useMemo((): ChainGroup[] => {
    const groups: Map<string, string[]> = new Map();

    customChains.forEach((chain) => {
      const prefix = getChainPrefix(chain);
      if (!groups.has(prefix)) {
        groups.set(prefix, []);
      }
      groups.get(prefix)!.push(chain);
    });

    return Array.from(groups.entries())
      .map(([prefix, chains], idx) => ({
        prefix,
        chains: chains.sort(),
        color: groupColors[idx % groupColors.length],
      }))
      .sort((a, b) => b.chains.length - a.chains.length);
  }, [customChains]);

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

  // Handle chain click
  const handleChainClick = useCallback((chain: string) => {
    setSelectedChain(chain);
  }, []);

  // Toggle group expansion
  const toggleGroup = useCallback((prefix: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(prefix)) {
        next.delete(prefix);
      } else {
        next.add(prefix);
      }
      return next;
    });
  }, []);

  // Get chain detail info
  const getChainDetail = useCallback((chain: string) => {
    const stats = chainStats[chain];
    const incoming = chainRelations.filter((r) => r.to === chain);
    const outgoing = chainRelations.filter((r) => r.from === chain);
    const isBuiltin = !!builtinChainConfig[chain];
    const config = builtinChainConfig[chain];
    const prefix = getChainPrefix(chain);
    const groupIdx = chainGroups.findIndex((g) => g.prefix === prefix);
    const color = config?.color || groupColors[groupIdx % groupColors.length] || '#64748b';

    return { stats, incoming, outgoing, isBuiltin, config, color };
  }, [chainStats, chainRelations, chainGroups]);

  // Render built-in chain card
  const renderBuiltinChain = (chain: string) => {
    const config = builtinChainConfig[chain];
    const stats = chainStats[chain];
    const outgoing = chainRelations.filter((r) => r.from === chain);

    if (!config) return null;

    return (
      <motion.div
        key={chain}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => handleChainClick(chain)}
        style={{
          padding: 16,
          background: 'var(--cyber-bg-card)',
          borderRadius: 12,
          border: `2px solid ${config.color}`,
          cursor: 'pointer',
          minWidth: 160,
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        whileHover={{
          scale: 1.02,
          boxShadow: `0 4px 20px ${config.color}40`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20, color: config.color }}>{config.icon}</span>
          <Text strong style={{ color: config.color, fontSize: 14 }}>{chain}</Text>
        </div>
        <div style={{ fontSize: 12, color: 'var(--cyber-text-secondary)' }}>
          <div>{stats?.ruleCount || 0} rules</div>
          <div>{(stats?.packets || 0).toLocaleString()} pkts</div>
        </div>
        {outgoing.length > 0 && (
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--cyber-border)' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              → {outgoing.length} chain{outgoing.length > 1 ? 's' : ''}
            </Text>
          </div>
        )}
      </motion.div>
    );
  };

  // Render chain group
  const renderChainGroup = (group: ChainGroup) => {
    const isExpanded = expandedGroups.has(group.prefix);
    const groupStats = group.chains.reduce(
      (acc, chain) => {
        const s = chainStats[chain];
        if (s) {
          acc.rules += s.ruleCount;
          acc.packets += s.packets;
        }
        return acc;
      },
      { rules: 0, packets: 0 }
    );

    return (
      <div key={group.prefix} style={{ marginBottom: 8 }}>
        <div
          onClick={() => toggleGroup(group.prefix)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 12px',
            background: 'var(--cyber-bg-card)',
            borderRadius: isExpanded ? '8px 8px 0 0' : 8,
            border: `1px solid ${group.color}40`,
            borderLeft: `3px solid ${group.color}`,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {isExpanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
          <Badge count={group.chains.length} size="small" style={{ backgroundColor: group.color }}>
            <Text strong style={{ color: group.color }}>{group.prefix}</Text>
          </Badge>
          <span style={{ flex: 1 }} />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {groupStats.rules} rules · {groupStats.packets.toLocaleString()} pkts
          </Text>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                overflow: 'hidden',
                background: 'var(--cyber-bg-secondary)',
                borderRadius: '0 0 8px 8px',
                border: `1px solid ${group.color}40`,
                borderTop: 'none',
              }}
            >
              <div style={{ padding: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {group.chains.map((chain) => {
                  const stats = chainStats[chain];
                  const incoming = chainRelations.filter((r) => r.to === chain);
                  const outgoing = chainRelations.filter((r) => r.from === chain);

                  return (
                    <Tag
                      key={chain}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChainClick(chain);
                      }}
                      style={{
                        cursor: 'pointer',
                        background: 'var(--cyber-bg-card)',
                        border: `1px solid ${group.color}40`,
                        borderRadius: 6,
                        padding: '4px 8px',
                        margin: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: group.color, fontWeight: 500, fontSize: 12 }}>
                          {chain.replace(group.prefix, '')}
                        </span>
                        {stats && (
                          <span style={{ color: 'var(--cyber-text-muted)', fontSize: 10 }}>
                            ({stats.ruleCount}r)
                          </span>
                        )}
                        {(incoming.length > 0 || outgoing.length > 0) && (
                          <BranchesOutlined style={{ fontSize: 10, color: 'var(--cyber-text-muted)' }} />
                        )}
                      </div>
                    </Tag>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

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
        gridTemplateColumns: '40px 60px 100px 120px 120px 60px',
        gap: 8,
        alignItems: 'center',
      }}
    >
      <span style={{ color: 'var(--cyber-text-muted)' }}>#{rule.line_number}</span>
      <Tag style={{ margin: 0, fontSize: 10 }}>{rule.table}</Tag>
      <span style={{
        color: rule.target === 'ACCEPT' ? '#10b981' :
               rule.target === 'DROP' ? '#ef4444' :
               rule.target === 'REJECT' ? '#f59e0b' : 'var(--cyber-cyan)',
        fontWeight: 500,
      }}>
        {rule.target}
      </span>
      <span style={{ color: 'var(--cyber-text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
        {rule.source === '0.0.0.0/0' ? 'any' : rule.source.length > 15 ? rule.source.slice(0, 12) + '...' : rule.source}
      </span>
      <span style={{ color: 'var(--cyber-text-secondary)', fontFamily: 'monospace', fontSize: 11 }}>
        {rule.destination === '0.0.0.0/0' ? 'any' : rule.destination.length > 15 ? rule.destination.slice(0, 12) + '...' : rule.destination}
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
                <ApartmentOutlined style={{ marginRight: 8 }} />
                IPTables Chain Relationships
              </Title>
              <Text type="secondary">
                Click on any chain to view details · {allChains.length} chains, {chainRelations.length} relations
              </Text>
            </div>
            <Space wrap>
              <Space>
                <Text type="secondary">View:</Text>
                <Button.Group size="small">
                  <Button
                    type={viewMode === 'tree' ? 'primary' : 'default'}
                    onClick={() => setViewMode('tree')}
                  >
                    Tree
                  </Button>
                  <Button
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                  >
                    List
                  </Button>
                </Button.Group>
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
          </div>

          {/* Summary stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: 12,
          }}>
            <div style={{
              padding: '12px 16px',
              background: 'var(--cyber-bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-cyan)' }}>
                {allChains.length}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>Total Chains</Text>
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--cyber-bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-purple)' }}>
                {customChains.length}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>Custom Chains</Text>
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--cyber-bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-orange)' }}>
                {chainRelations.length}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>Relations</Text>
            </div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--cyber-bg-secondary)',
              borderRadius: 8,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'var(--cyber-green)' }}>
                {chainGroups.length}
              </div>
              <Text type="secondary" style={{ fontSize: 11 }}>Groups</Text>
            </div>
          </div>

          {viewMode === 'tree' ? (
            <>
              {/* Built-in Chains Section */}
              {builtinChainsWithRules.length > 0 && (
                <div>
                  <Text strong style={{ color: 'var(--cyber-text-primary)', display: 'block', marginBottom: 12 }}>
                    Built-in Chains
                  </Text>
                  <div style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}>
                    {['PREROUTING', 'INPUT', 'FORWARD', 'OUTPUT', 'POSTROUTING']
                      .filter((c) => builtinChainsWithRules.includes(c))
                      .map(renderBuiltinChain)}
                  </div>
                </div>
              )}

              {/* Custom Chains by Group */}
              {chainGroups.length > 0 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <Text strong style={{ color: 'var(--cyber-text-primary)' }}>
                      Custom Chains ({customChains.length})
                    </Text>
                    <Button
                      size="small"
                      type="link"
                      onClick={() => {
                        if (expandedGroups.size === chainGroups.length) {
                          setExpandedGroups(new Set());
                        } else {
                          setExpandedGroups(new Set(chainGroups.map((g) => g.prefix)));
                        }
                      }}
                    >
                      {expandedGroups.size === chainGroups.length ? 'Collapse All' : 'Expand All'}
                    </Button>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 12,
                  }}>
                    {chainGroups.map(renderChainGroup)}
                  </div>
                </div>
              )}

              {allChains.length === 0 && (
                <Empty description="No chains found" />
              )}
            </>
          ) : (
            /* List View */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}>
              {allChains.map((chain) => {
                const { stats, incoming, outgoing, isBuiltin, color } = getChainDetail(chain);
                return (
                  <div
                    key={chain}
                    onClick={() => handleChainClick(chain)}
                    style={{
                      padding: 12,
                      background: 'var(--cyber-bg-card)',
                      borderRadius: 8,
                      borderLeft: `3px solid ${color}`,
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      {isBuiltin ? (
                        <Tag color="cyan" style={{ margin: 0, fontSize: 9 }}>BUILTIN</Tag>
                      ) : (
                        <Tag style={{ margin: 0, fontSize: 9, background: `${color}30`, border: 'none', color }}>CUSTOM</Tag>
                      )}
                      <Text strong style={{ color, fontSize: 12 }}>
                        {chain.length > 20 ? chain.slice(0, 18) + '...' : chain}
                      </Text>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--cyber-text-secondary)' }}>
                      {stats?.ruleCount || 0} rules · {(stats?.packets || 0).toLocaleString()} pkts
                    </div>
                    {(incoming.length > 0 || outgoing.length > 0) && (
                      <div style={{ fontSize: 10, color: 'var(--cyber-text-muted)', marginTop: 4 }}>
                        {incoming.length > 0 && <span>← {incoming.length} </span>}
                        {outgoing.length > 0 && <span>→ {outgoing.length}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Space>
      </Card>

      {/* Chain Detail Modal */}
      <Modal
        open={!!selectedChain}
        onCancel={() => setSelectedChain(null)}
        footer={null}
        width={750}
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
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Title level={4} style={{ margin: 0, color: color }}>
                      {selectedChain}
                    </Title>
                    {isBuiltin ? (
                      <Tag color="cyan">BUILT-IN</Tag>
                    ) : (
                      <Tag style={{ background: `${color}30`, border: 'none', color }}>CUSTOM</Tag>
                    )}
                  </div>
                  <Text type="secondary">
                    {config?.description || `Custom chain (${getChainPrefix(selectedChain)} group)`}
                  </Text>
                </div>
              </div>

              {/* Stats Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                marginBottom: 20,
              }}>
                <div style={{ padding: 16, background: 'var(--cyber-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--cyber-cyan)' }}>
                    {stats?.ruleCount || 0}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Rules</Text>
                </div>
                <div style={{ padding: 16, background: 'var(--cyber-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--cyber-green)' }}>
                    {(stats?.packets || 0).toLocaleString()}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Packets</Text>
                </div>
                <div style={{ padding: 16, background: 'var(--cyber-bg-secondary)', borderRadius: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--cyber-purple)' }}>
                    {formatBytes(stats?.bytes || 0)}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Traffic</Text>
                </div>
              </div>

              {/* Relations */}
              {(incoming.length > 0 || outgoing.length > 0) && (
                <div style={{ marginBottom: 20, padding: 16, background: 'var(--cyber-bg-secondary)', borderRadius: 8 }}>
                  <Text strong style={{ color: 'var(--cyber-text-primary)', display: 'block', marginBottom: 12 }}>
                    Chain Relationships
                  </Text>
                  {incoming.length > 0 && (
                    <div style={{ marginBottom: incoming.length > 0 && outgoing.length > 0 ? 12 : 0 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Called from ({incoming.length}):</Text>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {incoming.slice(0, 10).map((r) => (
                          <Tag
                            key={r.from}
                            style={{ cursor: 'pointer', background: 'var(--cyber-bg-card)', border: '1px solid var(--cyber-border)' }}
                            onClick={() => setSelectedChain(r.from)}
                          >
                            ← {r.from} ({r.count})
                          </Tag>
                        ))}
                        {incoming.length > 10 && (
                          <Tag>+{incoming.length - 10} more</Tag>
                        )}
                      </div>
                    </div>
                  )}
                  {outgoing.length > 0 && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>Jumps to ({outgoing.length}):</Text>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {outgoing.slice(0, 10).map((r) => (
                          <Tag
                            key={r.to}
                            style={{ cursor: 'pointer', background: 'var(--cyber-bg-card)', border: '1px solid var(--cyber-border)' }}
                            onClick={() => setSelectedChain(r.to)}
                          >
                            → {r.to} ({r.count})
                          </Tag>
                        ))}
                        {outgoing.length > 10 && (
                          <Tag>+{outgoing.length - 10} more</Tag>
                        )}
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
                <div style={{ maxHeight: 300, overflowY: 'auto', borderRadius: 8, border: '1px solid var(--cyber-border)' }}>
                  <div style={{
                    padding: '8px 12px',
                    background: 'var(--cyber-bg-hover)',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--cyber-text-secondary)',
                    display: 'grid',
                    gridTemplateColumns: '40px 60px 100px 120px 120px 60px',
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
        .chain-detail-modal .ant-modal-content {
          background: var(--cyber-bg-card) !important;
          border: 1px solid var(--cyber-border) !important;
          border-radius: 16px !important;
          padding: 24px !important;
        }
        .chain-detail-modal .ant-modal-body {
          padding: 0 !important;
        }
      `}</style>
    </motion.div>
  );
};
