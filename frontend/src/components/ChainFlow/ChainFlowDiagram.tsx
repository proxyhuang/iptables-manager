import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Card, Typography, Select, Space, Tag, Modal, Button, Badge, Empty, Slider } from 'antd';
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
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
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

interface NodePosition {
  x: number;
  y: number;
  width: number;
  height: number;
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
  const prefixes = ['KUBE-SEP-', 'KUBE-SVC-', 'KUBE-FW-', 'KUBE-XLB-', 'KUBE-', 'DOCKER', 'CILIUM_', 'CNI-', 'cali-'];
  for (const prefix of prefixes) {
    if (chain.startsWith(prefix)) {
      return prefix;
    }
  }
  const match = chain.match(/^([A-Z]+[-_])/);
  return match ? match[1] : 'OTHER';
};

export const ChainFlowDiagram: React.FC = () => {
  const { rules } = useSelector((state: RootState) => state.rules);
  const [selectedTable, setSelectedTable] = useState<string>('all');
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'list' | 'diagram'>('diagram');
  const [zoom, setZoom] = useState(100);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const svgContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!svgContainerRef.current) return;
    if (!document.fullscreenElement) {
      svgContainerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };

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

  // Calculate node positions for diagram
  const { nodePositions, svgWidth, svgHeight } = useMemo(() => {
    const nodeWidth = 140;
    const nodeHeight = 70;
    const verticalGap = 120; // Increased vertical gap for better curves
    const horizontalGap = 50;
    const padding = 60;

    // Helper to resolve X overlaps in a level
    const resolveOverlaps = (chains: string[], pos: Record<string, NodePosition>, width: number, gap: number) => {
      // Sort by current X
      chains.sort((a, b) => pos[a].x - pos[b].x);
      
      // Push apart
      for (let i = 0; i < chains.length - 1; i++) {
        const c1 = chains[i];
        const c2 = chains[i + 1];
        const p1 = pos[c1];
        const p2 = pos[c2];
        
        if (p2.x < p1.x + width + gap) {
          const diff = (p1.x + width + gap) - p2.x;
          // Move both equally (simple)
          p1.x -= diff / 2;
          p2.x += diff / 2;
        }
      }
    };

    // 1. Build Graph
    const adj: Record<string, string[]> = {};
    const revAdj: Record<string, string[]> = {};
    allChains.forEach(c => {
      adj[c] = [];
      revAdj[c] = [];
    });
    chainRelations.forEach(rel => {
      if (adj[rel.from]) adj[rel.from].push(rel.to);
      if (revAdj[rel.to]) revAdj[rel.to].push(rel.from);
    });

    // 2. Assign Levels (BFS from built-ins)
    const levels: Record<string, number> = {};
    const visited = new Set<string>();
    const queue: { chain: string; level: number }[] = [];

    // Built-ins are roots (Level 0)
    // Order: PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING
    const builtinOrder = ['PREROUTING', 'INPUT', 'FORWARD', 'OUTPUT', 'POSTROUTING'];
    const activeBuiltins = builtinOrder.filter(c => builtinChainsWithRules.includes(c));
    
    activeBuiltins.forEach(c => {
      levels[c] = 0;
      visited.add(c);
      queue.push({ chain: c, level: 0 });
    });

    // BFS
    while (queue.length > 0) {
      const { chain, level } = queue.shift()!;
      
      const children = adj[chain] || [];
      children.forEach(child => {
        if (!visited.has(child)) {
          visited.add(child);
          levels[child] = level + 1;
          queue.push({ chain: child, level: level + 1 });
        } else {
          // If already visited, take max level (push down) to avoid upward arrows
          if (levels[child] < level + 1) {
            levels[child] = level + 1;
            // Re-process child to push its children down
            queue.push({ chain: child, level: level + 1 });
          }
        }
      });
    }

    // Handle Orphans (not reachable from built-ins)
    // Assign them to Level 1 or separate group
    const maxLevel = Math.max(0, ...Object.values(levels));
    const orphanLevel = 1; // Start orphans at level 1 alongside others
    allChains.forEach(c => {
      if (levels[c] === undefined) {
        levels[c] = orphanLevel;
      }
    });

    // 3. Initial X Positions & Grouping by Level
    const nodesByLevel: Record<number, string[]> = {};
    Object.entries(levels).forEach(([chain, lvl]) => {
      if (!nodesByLevel[lvl]) nodesByLevel[lvl] = [];
      nodesByLevel[lvl].push(chain);
    });

    const positions: Record<string, NodePosition> = {};
    
    // Sort built-ins manually in Level 0
    if (nodesByLevel[0]) {
      nodesByLevel[0].sort((a, b) => builtinOrder.indexOf(a) - builtinOrder.indexOf(b));
    }

    // Initial positioning: Center aligned based on count
    // We'll run a few iterations to optimize X to minimize edge length/crossing
    
    // Initialize X
    Object.keys(nodesByLevel).forEach(lvlStr => {
      const lvl = parseInt(lvlStr);
      const chains = nodesByLevel[lvl];
      
      // For level > 0, try to preserve some group affinity from prefix if possible, 
      // but topology is more important. 
      // Initial sort by prefix to keep groups somewhat together
      if (lvl > 0) {
        chains.sort();
      }

      const rowWidth = chains.length * (nodeWidth + horizontalGap) - horizontalGap;
      let startX = padding; // We'll center rows later
      
      chains.forEach((chain, idx) => {
        positions[chain] = {
          x: startX + idx * (nodeWidth + horizontalGap),
          y: padding + lvl * (nodeHeight + verticalGap),
          width: nodeWidth,
          height: nodeHeight
        };
      });
    });

    // 4. Force/Relaxation Loop for X positions
    const iterations = 10;
    for (let it = 0; it < iterations; it++) {
      // Downward pass (parents influence children)
      for (let l = 1; l <= maxLevel; l++) {
        const chains = nodesByLevel[l] || [];
        chains.forEach(chain => {
          const parents = revAdj[chain] || [];
          if (parents.length > 0) {
            const avgParentX = parents.reduce((sum, p) => sum + (positions[p]?.x || 0), 0) / parents.length;
            positions[chain].x = avgParentX;
          }
        });
        resolveOverlaps(chains, positions, nodeWidth, horizontalGap);
      }

      // Upward pass (children influence parents) - Skip Level 0 (fixed built-ins)
      for (let l = maxLevel - 1; l > 0; l--) {
        const chains = nodesByLevel[l] || [];
        chains.forEach(chain => {
          const children = adj[chain] || [];
          if (children.length > 0) {
            const avgChildX = children.reduce((sum, c) => sum + (positions[c]?.x || 0), 0) / children.length;
            // Blend current and target
            positions[chain].x = (positions[chain].x + avgChildX) / 2;
          }
        });
        resolveOverlaps(chains, positions, nodeWidth, horizontalGap);
      }
    }

    // Final Normalize/Center
    let minX = Infinity;
    let maxX = -Infinity;
    Object.values(positions).forEach(p => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x + p.width);
    });

    // Shift to start at padding
    const shiftX = padding - minX;
    Object.values(positions).forEach(p => {
      p.x += shiftX;
    });

    return {
      nodePositions: positions,
      svgWidth: maxX - minX + padding * 2,
      svgHeight: (Math.max(0, ...Object.values(levels)) + 1) * (nodeHeight + verticalGap) + padding
    };
  }, [allChains, builtinChainsWithRules, chainRelations]);

  // Generate bezier curve path between two nodes
  const generateCurvePath = useCallback((from: NodePosition, to: NodePosition, index: number, total: number): string => {
    const fromCenterX = from.x + from.width / 2;
    const fromBottomY = from.y + from.height;
    const toCenterX = to.x + to.width / 2;
    const toTopY = to.y;

    // Offset for multiple arrows between same nodes
    const offset = total > 1 ? (index - (total - 1) / 2) * 15 : 0;

    // Control points for smooth curve
    const midY = (fromBottomY + toTopY) / 2;
    const dx = toCenterX - fromCenterX;
    const controlOffset = Math.min(Math.abs(dx) * 0.3, 80);

    return `M ${fromCenterX + offset} ${fromBottomY}
            C ${fromCenterX + offset} ${midY - controlOffset},
              ${toCenterX + offset} ${midY + controlOffset},
              ${toCenterX + offset} ${toTopY}`;
  }, []);

  // Pan/zoom handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -10 : 10;
    setZoom((prev) => Math.min(200, Math.max(25, prev + delta)));
  }, []);

  const resetView = useCallback(() => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  }, []);

  // Fit diagram to container
  const fitToContainer = useCallback(() => {
    if (svgContainerRef.current) {
      const containerWidth = svgContainerRef.current.clientWidth - 40;
      const containerHeight = svgContainerRef.current.clientHeight - 40;
      const scaleX = (containerWidth / svgWidth) * 100;
      const scaleY = (containerHeight / svgHeight) * 100;
      const newZoom = Math.min(scaleX, scaleY, 100);
      setZoom(Math.max(25, Math.round(newZoom)));
      setPan({ x: 0, y: 0 });
    }
  }, [svgWidth, svgHeight]);

  // Auto-fit on mount
  useEffect(() => {
    if (viewMode === 'diagram' && svgContainerRef.current) {
      fitToContainer();
    }
  }, [viewMode, fitToContainer]);

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
                IPTables Rule Flow
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
                    type={viewMode === 'diagram' ? 'primary' : 'default'}
                    onClick={() => setViewMode('diagram')}
                    icon={<ApartmentOutlined />}
                  >
                    Diagram
                  </Button>
                  <Button
                    type={viewMode === 'tree' ? 'primary' : 'default'}
                    onClick={() => setViewMode('tree')}
                    icon={<AppstoreOutlined />}
                  >
                    Tree
                  </Button>
                  <Button
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                    icon={<UnorderedListOutlined />}
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

          {/* Diagram View */}
          {viewMode === 'diagram' && (
            <div>
              {/* Zoom controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 12,
                padding: '8px 12px',
                background: 'var(--cyber-bg-secondary)',
                borderRadius: 8,
              }}>
                <ZoomOutOutlined style={{ color: 'var(--cyber-text-muted)' }} />
                <Slider
                  value={zoom}
                  onChange={setZoom}
                  min={25}
                  max={200}
                  style={{ width: 150 }}
                  tooltip={{ formatter: (v) => `${v}%` }}
                />
                <ZoomInOutlined style={{ color: 'var(--cyber-text-muted)' }} />
                <Text type="secondary" style={{ fontSize: 12, minWidth: 40 }}>{zoom}%</Text>
                <Button size="small" icon={<FullscreenOutlined />} onClick={toggleFullScreen}>
                  {isFullScreen ? 'Exit Full' : 'Fullscreen'}
                </Button>
                <Button size="small" onClick={fitToContainer}>
                  Fit
                </Button>
                <Button size="small" onClick={resetView}>
                  Reset
                </Button>
              </div>

              {/* SVG Container */}
              <div
                ref={svgContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                style={{
                  width: '100%',
                  height: 600,
                  overflow: 'hidden',
                  borderRadius: 12,
                  border: '1px solid var(--cyber-border)',
                  background: 'var(--cyber-bg-secondary)',
                  cursor: isPanning ? 'grabbing' : 'grab',
                  position: 'relative',
                  boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
                }}
              >
                {/* Background Grid */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  backgroundImage: `
                    linear-gradient(to right, var(--cyber-border) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--cyber-border) 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * (zoom / 100)}px ${20 * (zoom / 100)}px`,
                  opacity: 0.2,
                  transform: `translate(${pan.x % (20 * (zoom/100))}px, ${pan.y % (20 * (zoom/100))}px)`,
                }} />

                <svg
                  width="100%"
                  height="100%"
                  style={{
                    cursor: isPanning ? 'grabbing' : 'grab',
                  }}
                >
                  <g style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100})`,
                    transformOrigin: '0 0',
                    transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                  }}>
                    <defs>
                      {/* Define markers once */}
                      {Object.entries(tableColors).map(([table, color]) => (
                        <marker
                          key={`arrowhead-${table}`}
                          id={`arrowhead-${table}`}
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                        </marker>
                      ))}
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>

                    {/* Arrows (render first) */}
                    {(() => {
                      const arrowGroups: Map<string, ChainRelation[]> = new Map();
                      chainRelations.forEach((rel) => {
                        if (nodePositions[rel.from] && nodePositions[rel.to]) {
                          const key = `${rel.from}-${rel.to}`;
                          if (!arrowGroups.has(key)) arrowGroups.set(key, []);
                          arrowGroups.get(key)!.push(rel);
                        }
                      });

                      return Array.from(arrowGroups.entries()).map(([key, rels]) => {
                        const from = nodePositions[rels[0].from];
                        const to = nodePositions[rels[0].to];
                        const table = rels[0].table;
                        const color = tableColors[table] || '#64748b';
                        const totalCount = rels.reduce((sum, r) => sum + r.count, 0);

                        return (
                          <g key={key} style={{ pointerEvents: 'none' }}>
                            <path
                              d={generateCurvePath(from, to, 0, 1)}
                              fill="none"
                              stroke={color}
                              strokeWidth={1.5}
                              strokeOpacity={0.6}
                              markerEnd={`url(#arrowhead-${table})`}
                              style={{ filter: totalCount > 5 ? 'url(#glow)' : 'none' }}
                            />
                            {totalCount > 1 && (
                              <g transform={`translate(${ (from.x + from.width/2 + to.x + to.width/2)/2 }, ${ (from.y + from.height + to.y)/2 })`}>
                                <circle r="10" fill="var(--cyber-bg-card)" stroke={color} strokeWidth="1" />
                                <text
                                  textAnchor="middle"
                                  dy=".3em"
                                  fontSize="9"
                                  fontWeight="bold"
                                  fill={color}
                                >
                                  {totalCount}
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      });
                    })()}

                    {/* Nodes */}
                    {allChains.map((chain) => {
                      const pos = nodePositions[chain];
                      if (!pos) return null;
                      const isBuiltin = !!builtinChainConfig[chain];
                      const config = builtinChainConfig[chain];
                      const stats = chainStats[chain];
                      const prefix = getChainPrefix(chain);
                      const groupIdx = chainGroups.findIndex((g) => g.prefix === prefix);
                      const color = config?.color || groupColors[groupIdx % groupColors.length] || '#64748b';
                      const isSelected = selectedChain === chain;

                      return (
                        <g
                          key={chain}
                          onClick={() => handleChainClick(chain)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Outer Shadow/Glow */}
                          <rect
                            x={pos.x - 2}
                            y={pos.y - 2}
                            width={pos.width + 4}
                            height={pos.height + 4}
                            rx={10}
                            ry={10}
                            fill={isSelected ? `${color}40` : 'transparent'}
                            filter={isSelected ? 'blur(4px)' : 'none'}
                          />
                          {/* Main Card */}
                          <rect
                            x={pos.x}
                            y={pos.y}
                            width={pos.width}
                            height={pos.height}
                            rx={8}
                            ry={8}
                            fill="var(--cyber-bg-card)"
                            stroke={isSelected ? color : `${color}80`}
                            strokeWidth={isSelected ? 2 : 1}
                          />
                          {/* Builtin Indicator */}
                          {isBuiltin && (
                            <rect
                              x={pos.x}
                              y={pos.y}
                              width={4}
                              height={pos.height}
                              rx="2 0 0 2"
                              fill={color}
                            />
                          )}
                          {/* Text */}
                          <text
                            x={pos.x + (isBuiltin ? 12 : 8)}
                            y={pos.y + 20}
                            fill={color}
                            fontSize="11"
                            fontWeight="bold"
                          >
                            {chain.length > 18 ? chain.slice(0, 16) + '..' : chain}
                          </text>
                          <text
                            x={pos.x + (isBuiltin ? 12 : 8)}
                            y={pos.y + 40}
                            fill="var(--cyber-text-secondary)"
                            fontSize="9"
                          >
                            {stats?.ruleCount || 0} rules
                          </text>
                          <text
                            x={pos.x + (isBuiltin ? 12 : 8)}
                            y={pos.y + 54}
                            fill="var(--cyber-text-muted)"
                            fontSize="9"
                          >
                            {formatBytes(stats?.bytes || 0)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>

                {/* Floating Legend */}
                <div style={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                  padding: '12px',
                  background: 'var(--cyber-bg-card)',
                  border: '1px solid var(--cyber-border)',
                  borderRadius: 8,
                  fontSize: 10,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: 8, borderBottom: '1px solid var(--cyber-border)', paddingBottom: 4 }}>
                    TRAFFIC FLOW
                  </div>
                  {Object.entries(tableColors).map(([table, color]) => (
                    <div key={table} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 12, height: 2, background: color }} />
                      <span style={{ color: 'var(--cyber-text-secondary)', textTransform: 'uppercase' }}>{table}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tree View */}
          {viewMode === 'tree' && (
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
          )}

          {/* List View */}
          {viewMode === 'list' && (
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
        .node-hover:hover {
          fill: rgba(0, 245, 255, 0.1);
        }
      `}</style>
    </motion.div>
  );
};
