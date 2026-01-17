import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Tag, message, Select, Tooltip, Modal, Dropdown, Checkbox } from 'antd';
import type { ColumnsType, ColumnType } from 'antd/es/table';
import type { FilterValue } from 'antd/es/table/interface';
import {
  DeleteOutlined,
  ReloadOutlined,
  FilterOutlined,
  DatabaseOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
  SwapOutlined,
  ImportOutlined,
  ExportOutlined,
  QuestionOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../../store/store';
import { fetchRules, deleteRule, setSelectedTable, setSelectedChain } from '../../store/slices/rulesSlice';
import { Rule } from '../../types/rule';
import { formatBytes } from '../../utils/formatters';

// Chain direction configuration
const chainDirections: Record<string, {
  direction: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}> = {
  INPUT: {
    direction: 'inbound',
    icon: <ArrowDownOutlined />,
    description: 'Incoming traffic to local system',
    color: '#10b981',
  },
  OUTPUT: {
    direction: 'outbound',
    icon: <ArrowUpOutlined />,
    description: 'Outgoing traffic from local system',
    color: '#3b82f6',
  },
  FORWARD: {
    direction: 'forward',
    icon: <SwapOutlined />,
    description: 'Traffic passing through (routing)',
    color: '#a855f7',
  },
  PREROUTING: {
    direction: 'pre-route',
    icon: <ImportOutlined />,
    description: 'Before routing decision (NAT)',
    color: '#f59e0b',
  },
  POSTROUTING: {
    direction: 'post-route',
    icon: <ExportOutlined />,
    description: 'After routing decision (NAT)',
    color: '#ec4899',
  },
};

// Column configuration for visibility toggle
interface ColumnConfig {
  key: string;
  title: string;
  defaultVisible: boolean;
}

const allColumnConfigs: ColumnConfig[] = [
  { key: 'line_number', title: '#', defaultVisible: true },
  { key: 'table', title: 'Table', defaultVisible: true },
  { key: 'chain', title: 'Chain', defaultVisible: true },
  { key: 'target', title: 'Target', defaultVisible: true },
  { key: 'protocol', title: 'Protocol', defaultVisible: true },
  { key: 'source', title: 'Source', defaultVisible: true },
  { key: 'destination', title: 'Destination', defaultVisible: true },
  { key: 'sport', title: 'Src Port', defaultVisible: false },
  { key: 'dport', title: 'Dst Port', defaultVisible: false },
  { key: 'packets', title: 'Packets', defaultVisible: true },
  { key: 'bytes', title: 'Bytes', defaultVisible: true },
  { key: 'options', title: 'Options', defaultVisible: false },
  { key: 'raw_rule', title: 'Raw Rule', defaultVisible: false },
  { key: 'created_at', title: 'Created', defaultVisible: false },
  { key: 'actions', title: 'Actions', defaultVisible: true },
];

const COLUMN_VISIBILITY_KEY = 'rule-list-visible-columns';

const getDefaultVisibleColumns = (): string[] => {
  const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid JSON, use defaults
    }
  }
  return allColumnConfigs.filter((c) => c.defaultVisible).map((c) => c.key);
};

export const RuleList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rules, filteredRules, loading, selectedTable, selectedChain } = useSelector((state: RootState) => state.rules);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(getDefaultVisibleColumns);
  const [tableFilters, setTableFilters] = useState<Record<string, FilterValue | null>>({});

  useEffect(() => {
    dispatch(fetchRules());
  }, [dispatch]);

  // Get unique tables and chains from rules
  const tables = useMemo(() => {
    const uniqueTables = Array.from(new Set(rules.map((r) => r.table)));
    return ['all', ...uniqueTables.sort()];
  }, [rules]);

  const chains = useMemo(() => {
    const filteredByTable = selectedTable === 'all'
      ? rules
      : rules.filter((r) => r.table === selectedTable);
    const uniqueChains = Array.from(new Set(filteredByTable.map((r) => r.chain)));
    return ['all', ...uniqueChains.sort()];
  }, [rules, selectedTable]);

  // Persist column visibility to localStorage
  useEffect(() => {
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Generate dynamic filter options from data
  const filterOptions = useMemo(() => {
    const uniqueTargets = Array.from(new Set(filteredRules.map((r) => r.target))).sort();
    const uniqueProtocols = Array.from(new Set(filteredRules.map((r) => r.protocol || 'all'))).sort();
    const uniqueSources = Array.from(new Set(filteredRules.map((r) => r.source))).sort();
    const uniqueDestinations = Array.from(new Set(filteredRules.map((r) => r.destination))).sort();

    return {
      target: uniqueTargets.map((v) => ({ text: v, value: v })),
      protocol: uniqueProtocols.map((v) => ({ text: v || 'all', value: v })),
      source: uniqueSources.map((v) => ({ text: v === '0.0.0.0/0' ? 'any' : v, value: v })),
      destination: uniqueDestinations.map((v) => ({ text: v === '0.0.0.0/0' ? 'any' : v, value: v })),
    };
  }, [filteredRules]);

  const handleColumnVisibilityChange = (checkedValues: string[]) => {
    // Ensure at least one column is visible
    if (checkedValues.length > 0) {
      setVisibleColumns(checkedValues);
    }
  };

  const handleDelete = (rule: Rule) => {
    Modal.confirm({
      title: 'Delete Rule',
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: 'var(--cyber-text-secondary)' }}>
            Are you sure you want to delete this rule?
          </p>
          <div style={{
            marginTop: 12,
            padding: 12,
            background: 'var(--cyber-bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--cyber-border)',
          }}>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span><strong>Table:</strong> {rule.table}</span>
              <span><strong>Chain:</strong> {rule.chain}</span>
              <span><strong>Line:</strong> #{rule.line_number}</span>
              <span><strong>Target:</strong> {rule.target}</span>
            </div>
          </div>
        </div>
      ),
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await dispatch(deleteRule({
            table: rule.table,
            chain: rule.chain,
            line_number: rule.line_number,
          })).unwrap();
          message.success('Rule deleted successfully');
        } catch {
          message.error('Failed to delete rule');
        }
      },
    });
  };

  const handleBatchDelete = () => {
    const selectedRules = filteredRules.filter((r) =>
      selectedRowKeys.includes(`${r.table}-${r.chain}-${r.line_number}`)
    );

    if (selectedRules.length === 0) return;

    Modal.confirm({
      title: `Delete ${selectedRules.length} Rules`,
      icon: <ExclamationCircleOutlined style={{ color: '#ef4444' }} />,
      content: (
        <div style={{ marginTop: 12 }}>
          <p style={{ margin: 0, color: 'var(--cyber-text-secondary)' }}>
            Are you sure you want to delete {selectedRules.length} selected rule(s)?
          </p>
          <div style={{
            marginTop: 12,
            maxHeight: 200,
            overflowY: 'auto',
            padding: 12,
            background: 'var(--cyber-bg-secondary)',
            borderRadius: 8,
            border: '1px solid var(--cyber-border)',
          }}>
            {selectedRules.map((rule, idx) => (
              <div key={idx} style={{
                padding: '4px 0',
                borderBottom: idx < selectedRules.length - 1 ? '1px solid var(--cyber-border)' : 'none',
                fontSize: 12,
              }}>
                {rule.table}/{rule.chain} #{rule.line_number} → {rule.target}
              </div>
            ))}
          </div>
        </div>
      ),
      okText: 'Delete All',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        setDeleteLoading(true);
        try {
          // Sort by line number descending to preserve indices during deletion
          const sorted = [...selectedRules].sort((a, b) => {
            if (a.table !== b.table) return a.table.localeCompare(b.table);
            if (a.chain !== b.chain) return a.chain.localeCompare(b.chain);
            return b.line_number - a.line_number;
          });

          for (const rule of sorted) {
            await dispatch(deleteRule({
              table: rule.table,
              chain: rule.chain,
              line_number: rule.line_number,
            })).unwrap();
          }
          message.success(`Successfully deleted ${selectedRules.length} rule(s)`);
          setSelectedRowKeys([]);
        } catch {
          message.error('Failed to delete some rules');
        } finally {
          setDeleteLoading(false);
        }
      },
    });
  };

  const getTargetTag = (target: string) => {
    const configs: Record<string, { color: string; bg: string; border: string }> = {
      ACCEPT: {
        color: '#10b981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.3)',
      },
      DROP: {
        color: '#ef4444',
        bg: 'rgba(239, 68, 68, 0.15)',
        border: 'rgba(239, 68, 68, 0.3)',
      },
      REJECT: {
        color: '#f59e0b',
        bg: 'rgba(245, 158, 11, 0.15)',
        border: 'rgba(245, 158, 11, 0.3)',
      },
    };
    const config = configs[target] || {
      color: '#64748b',
      bg: 'rgba(100, 116, 139, 0.15)',
      border: 'rgba(100, 116, 139, 0.3)',
    };
    return (
      <Tag style={{
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        fontWeight: 600,
        textShadow: `0 0 10px ${config.color}40`,
      }}>
        {target}
      </Tag>
    );
  };

  // Define all available columns (wrapped in useMemo to avoid re-creation each render)
  const allColumns: ColumnsType<Rule> = useMemo(() => [
    {
      title: '#',
      dataIndex: 'line_number',
      key: 'line_number',
      width: 60,
      render: (num: number) => (
        <span style={{ color: 'var(--cyber-text-muted)', fontFamily: 'monospace' }}>
          {num}
        </span>
      ),
    },
    {
      title: 'Table',
      dataIndex: 'table',
      key: 'table',
      render: (table: string) => (
        <Tag style={{
          color: '#3b82f6',
          background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          fontWeight: 500,
        }}>
          <DatabaseOutlined style={{ marginRight: 4 }} />
          {table}
        </Tag>
      ),
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => {
        const config = chainDirections[chain] || {
          direction: 'custom',
          icon: <QuestionOutlined />,
          description: 'Custom chain',
          color: '#64748b',
        };

        return (
          <Tooltip title={config.description}>
            <Tag style={{
              color: config.color,
              background: `${config.color}20`,
              border: `1px solid ${config.color}40`,
              fontWeight: 500,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}>
              {config.icon}
              {chain}
              <span style={{
                fontSize: 10,
                opacity: 0.8,
                marginLeft: 2,
              }}>
                ({config.direction})
              </span>
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
      filters: filterOptions.target,
      filteredValue: tableFilters.target || null,
      onFilter: (value, record) => record.target === value,
      render: (target: string) => getTargetTag(target),
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
      filters: filterOptions.protocol,
      filteredValue: tableFilters.protocol || null,
      onFilter: (value, record) => (record.protocol || 'all') === value,
      render: (protocol: string) => (
        <span style={{
          color: 'var(--cyber-text-primary)',
          fontFamily: 'monospace',
          background: 'var(--cyber-bg-secondary)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          {protocol || 'all'}
        </span>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      filters: filterOptions.source,
      filteredValue: tableFilters.source || null,
      onFilter: (value, record) => record.source === value,
      render: (source: string) => (
        <Tooltip title={source}>
          <span style={{
            color: 'var(--cyber-text-primary)',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            {source === '0.0.0.0/0' ? (
              <span style={{ color: 'var(--cyber-text-muted)' }}>any</span>
            ) : source}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
      filters: filterOptions.destination,
      filteredValue: tableFilters.destination || null,
      onFilter: (value, record) => record.destination === value,
      render: (destination: string) => (
        <Tooltip title={destination}>
          <span style={{
            color: 'var(--cyber-text-primary)',
            fontFamily: 'monospace',
            fontSize: '13px',
          }}>
            {destination === '0.0.0.0/0' ? (
              <span style={{ color: 'var(--cyber-text-muted)' }}>any</span>
            ) : destination}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Src Port',
      dataIndex: 'sport',
      key: 'sport',
      render: (sport: string) => (
        <span style={{
          color: 'var(--cyber-text-primary)',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          {sport || '-'}
        </span>
      ),
    },
    {
      title: 'Dst Port',
      dataIndex: 'dport',
      key: 'dport',
      render: (dport: string) => (
        <span style={{
          color: 'var(--cyber-text-primary)',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          {dport || '-'}
        </span>
      ),
    },
    {
      title: 'Packets',
      dataIndex: 'packets',
      key: 'packets',
      render: (packets: number) => (
        <span style={{
          color: '#00f5ff',
          fontFamily: 'monospace',
          fontWeight: 500,
        }}>
          {packets.toLocaleString()}
        </span>
      ),
    },
    {
      title: 'Bytes',
      dataIndex: 'bytes',
      key: 'bytes',
      render: (bytes: number) => (
        <span style={{
          color: '#a855f7',
          fontFamily: 'monospace',
          fontWeight: 500,
        }}>
          {formatBytes(bytes)}
        </span>
      ),
    },
    {
      title: 'Options',
      dataIndex: 'options',
      key: 'options',
      ellipsis: true,
      render: (options: string) => (
        <Tooltip title={options}>
          <span style={{
            color: 'var(--cyber-text-secondary)',
            fontFamily: 'monospace',
            fontSize: '11px',
          }}>
            {options || '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Raw Rule',
      dataIndex: 'raw_rule',
      key: 'raw_rule',
      ellipsis: true,
      width: 200,
      render: (raw: string) => (
        <Tooltip title={raw}>
          <code style={{
            color: 'var(--cyber-cyan)',
            background: 'var(--cyber-bg-secondary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            display: 'inline-block',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {raw || '-'}
          </code>
        </Tooltip>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => (
        <span style={{
          color: 'var(--cyber-text-muted)',
          fontSize: '12px',
        }}>
          {date ? new Date(date).toLocaleString() : '-'}
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: unknown, record: Rule) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#ef4444',
            borderRadius: '6px',
          }}
        >
          Delete
        </Button>
      ),
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [filterOptions, tableFilters]);

  // Filter columns based on visibility
  const columns = useMemo(() => {
    return allColumns.filter((col) => {
      const key = (col as ColumnType<Rule>).key as string;
      return visibleColumns.includes(key);
    });
  }, [visibleColumns, allColumns]);

  return (
    <div className="rule-list">
      {/* Filter Section */}
      <div className="cyber-filter-section">
        <Space size="middle" wrap>
          <Space>
            <FilterOutlined style={{ color: 'var(--cyber-cyan)' }} />
            <span className="cyber-filter-label">Table:</span>
            <Select
              value={selectedTable}
              onChange={(value) => dispatch(setSelectedTable(value))}
              style={{ width: 140 }}
              options={tables.map((t) => ({
                label: t === 'all' ? 'All Tables' : t.toUpperCase(),
                value: t,
              }))}
              dropdownStyle={{
                background: 'var(--cyber-bg-card)',
                border: '1px solid var(--cyber-border)',
              }}
            />
          </Space>

          <Space>
            <span className="cyber-filter-label">Chain:</span>
            <Select
              value={selectedChain}
              onChange={(value) => dispatch(setSelectedChain(value))}
              style={{ width: 160 }}
              options={chains.map((c) => ({
                label: c === 'all' ? 'All Chains' : c,
                value: c,
              }))}
              dropdownStyle={{
                background: 'var(--cyber-bg-card)',
                border: '1px solid var(--cyber-border)',
              }}
            />
          </Space>

          <Dropdown
            trigger={['click']}
            dropdownRender={() => (
              <div style={{
                background: 'var(--cyber-bg-card)',
                border: '1px solid var(--cyber-border)',
                borderRadius: 8,
                padding: 12,
                maxHeight: 400,
                overflowY: 'auto',
              }}>
                <div style={{
                  marginBottom: 8,
                  paddingBottom: 8,
                  borderBottom: '1px solid var(--cyber-border)',
                  color: 'var(--cyber-text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                }}>
                  Toggle Columns
                </div>
                <Checkbox.Group
                  value={visibleColumns}
                  onChange={(values) => handleColumnVisibilityChange(values as string[])}
                  style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
                >
                  {allColumnConfigs.map((col) => (
                    <Checkbox
                      key={col.key}
                      value={col.key}
                      style={{ color: 'var(--cyber-text-primary)', marginLeft: 0 }}
                    >
                      {col.title}
                    </Checkbox>
                  ))}
                </Checkbox.Group>
              </div>
            )}
          >
            <Button
              icon={<SettingOutlined />}
              style={{
                background: 'transparent',
                border: '1px solid var(--cyber-border)',
                color: 'var(--cyber-text-primary)',
              }}
            >
              Columns
            </Button>
          </Dropdown>

          <Button
            icon={<ReloadOutlined spin={loading} />}
            onClick={() => dispatch(fetchRules())}
            loading={loading}
            style={{
              background: 'transparent',
              border: '1px solid var(--cyber-border)',
              color: 'var(--cyber-text-primary)',
            }}
          >
            Refresh
          </Button>

          {selectedRowKeys.length > 0 && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleBatchDelete}
              loading={deleteLoading}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.5)',
                color: '#ef4444',
              }}
            >
              Delete Selected ({selectedRowKeys.length})
            </Button>
          )}
        </Space>

        {/* Rules Count */}
        <div style={{
          marginLeft: 'auto',
          color: 'var(--cyber-text-secondary)',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span style={{
            color: 'var(--cyber-cyan)',
            fontWeight: 600,
            fontFamily: 'monospace',
          }}>
            {filteredRules.length}
          </span>
          rules found
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Table
          columns={columns}
          dataSource={filteredRules}
          rowKey={(record) => `${record.table}-${record.chain}-${record.line_number}`}
          loading={loading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE,
            ],
          }}
          onChange={(_pagination, filters) => {
            setTableFilters(filters);
          }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total, range) => (
              <span style={{ color: 'var(--cyber-text-secondary)' }}>
                Showing {range[0]}-{range[1]} of {total} rules
              </span>
            ),
          }}
          style={{
            background: 'var(--cyber-bg-card)',
          }}
          rowClassName={() => 'cyber-table-row'}
        />
      </motion.div>

      <style>{`
        .cyber-table-row:hover td {
          background: rgba(0, 245, 255, 0.05) !important;
        }
        .ant-table-cell {
          border-bottom: 1px solid var(--cyber-border) !important;
        }
        .ant-pagination-item {
          background: var(--cyber-bg-secondary) !important;
          border-color: var(--cyber-border) !important;
        }
        .ant-pagination-item a {
          color: var(--cyber-text-primary) !important;
        }
        .ant-pagination-item-active {
          border-color: var(--cyber-cyan) !important;
        }
        .ant-pagination-item-active a {
          color: var(--cyber-cyan) !important;
        }
        .ant-select-selection-item {
          color: var(--cyber-text-primary) !important;
        }
      `}</style>
    </div>
  );
};
