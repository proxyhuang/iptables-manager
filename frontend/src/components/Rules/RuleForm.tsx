import React from 'react';
import { useDispatch } from 'react-redux';
import { Form, Input, Select, Button, Card, message } from 'antd';
import { AppDispatch } from '../../store/store';
import { addRule } from '../../store/slices/rulesSlice';
import { RuleCreateRequest } from '../../types/rule';

const { Option } = Select;

export const RuleForm: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (values: RuleCreateRequest) => {
    try {
      await dispatch(addRule(values)).unwrap();
      form.resetFields();
      message.success('Rule added successfully');
    } catch (error) {
      message.error('Failed to add rule');
    }
  };

  return (
    <Card title="Add New Rule">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="table"
          label="Table"
          rules={[{ required: true, message: 'Please select a table' }]}
        >
          <Select placeholder="Select table">
            <Option value="filter">filter</Option>
            <Option value="nat">nat</Option>
            <Option value="mangle">mangle</Option>
            <Option value="raw">raw</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="chain"
          label="Chain"
          rules={[{ required: true, message: 'Please select a chain' }]}
        >
          <Select placeholder="Select chain">
            <Option value="INPUT">INPUT</Option>
            <Option value="OUTPUT">OUTPUT</Option>
            <Option value="FORWARD">FORWARD</Option>
            <Option value="PREROUTING">PREROUTING</Option>
            <Option value="POSTROUTING">POSTROUTING</Option>
          </Select>
        </Form.Item>

        <Form.Item name="protocol" label="Protocol">
          <Select placeholder="Select protocol" allowClear>
            <Option value="tcp">TCP</Option>
            <Option value="udp">UDP</Option>
            <Option value="icmp">ICMP</Option>
          </Select>
        </Form.Item>

        <Form.Item name="source" label="Source IP">
          <Input placeholder="e.g., 192.168.1.0/24" />
        </Form.Item>

        <Form.Item name="destination" label="Destination IP">
          <Input placeholder="e.g., 10.0.0.1" />
        </Form.Item>

        <Form.Item name="dport" label="Destination Port">
          <Input placeholder="e.g., 80" />
        </Form.Item>

        <Form.Item
          name="target"
          label="Target"
          rules={[{ required: true, message: 'Please select a target' }]}
        >
          <Select placeholder="Select target">
            <Option value="ACCEPT">ACCEPT</Option>
            <Option value="DROP">DROP</Option>
            <Option value="REJECT">REJECT</Option>
          </Select>
        </Form.Item>

        <Form.Item name="comment" label="Comment">
          <Input placeholder="Optional comment" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            Add Rule
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
