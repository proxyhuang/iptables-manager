import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Table, Button, Space, Tag, message, Select } from 'antd';
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { RootState, AppDispatch } from '../../store/store';
import { fetchRules, deleteRule, setSelectedTable, setSelectedChain } from '../../store/slices/rulesSlice';
import { Rule } from '../../types/rule';
import { formatBytes } from '../../utils/formatters';

export const RuleList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { rules, filteredRules, loading, selectedTable, selectedChain } = useSelector((state: RootState) => state.rules);

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

  const handleDelete = (rule: Rule) => {
    if (window.confirm(`Delete rule ${rule.line_number} from ${rule.chain}?`)) {
      dispatch(deleteRule({
        table: rule.table,
        chain: rule.chain,
        line_number: rule.line_number,
      })).then(() => {
        message.success('Rule deleted successfully');
      }).catch(() => {
        message.error('Failed to delete rule');
      });
    }
  };

  const columns = [
    {
      title: 'Line',
      dataIndex: 'line_number',
      key: 'line_number',
      width: 60,
    },
    {
      title: 'Table',
      dataIndex: 'table',
      key: 'table',
      render: (table: string) => <Tag color="blue">{table}</Tag>,
    },
    {
      title: 'Chain',
      dataIndex: 'chain',
      key: 'chain',
      render: (chain: string) => <Tag color="green">{chain}</Tag>,
    },
    {
      title: 'Target',
      dataIndex: 'target',
      key: 'target',
      render: (target: string) => {
        const color = target === 'ACCEPT' ? 'success' :
                     target === 'DROP' ? 'error' : 'default';
        return <Tag color={color}>{target}</Tag>;
      },
    },
    {
      title: 'Protocol',
      dataIndex: 'protocol',
      key: 'protocol',
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Destination',
      dataIndex: 'destination',
      key: 'destination',
    },
    {
      title: 'Packets',
      dataIndex: 'packets',
      key: 'packets',
      render: (packets: number) => packets.toLocaleString(),
    },
    {
      title: 'Bytes',
      dataIndex: 'bytes',
      key: 'bytes',
      render: (bytes: number) => formatBytes(bytes),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Rule) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        >
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="rule-list">
      <Space style={{ marginBottom: 16 }} wrap>
        <span>Table:</span>
        <Select
          value={selectedTable}
          onChange={(value) => dispatch(setSelectedTable(value))}
          style={{ width: 120 }}
          options={tables.map((t) => ({ label: t === 'all' ? 'All Tables' : t, value: t }))}
        />
        <span>Chain:</span>
        <Select
          value={selectedChain}
          onChange={(value) => dispatch(setSelectedChain(value))}
          style={{ width: 140 }}
          options={chains.map((c) => ({ label: c === 'all' ? 'All Chains' : c, value: c }))}
        />
        <Button
          icon={<ReloadOutlined />}
          onClick={() => dispatch(fetchRules())}
          loading={loading}
        >
          Refresh
        </Button>
      </Space>

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
          pagination={{ pageSize: 20 }}
        />
      </motion.div>
    </div>
  );
};
