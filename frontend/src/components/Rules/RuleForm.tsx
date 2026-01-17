import React from 'react';
import { useDispatch } from 'react-redux';
import { Form, Input, Select, Button, Card, message, Row, Col, Divider, Typography, type GetProps } from 'antd';
import { PlusOutlined, ThunderboltOutlined, GlobalOutlined, AimOutlined, TagOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { AppDispatch } from '../../store/store';
import { addRule } from '../../store/slices/rulesSlice';
import { RuleCreateRequest, EXPIRY_OPTIONS } from '../../types/rule';

type DividerProps = GetProps<typeof Divider>;

const { Option } = Select;
const { Text } = Typography;

export const RuleForm: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (values: RuleCreateRequest) => {
    try {
      await dispatch(addRule(values)).unwrap();
      form.resetFields();
      message.success('Rule added successfully');
    } catch {
      message.error('Failed to add rule');
    }
  };

  const inputStyle = {
    background: 'var(--cyber-bg-secondary)',
    border: '1px solid var(--cyber-border)',
    borderRadius: '8px',
  };

  const labelStyle = {
    color: 'var(--cyber-text-secondary)',
    fontWeight: 500,
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ padding: '24px' }}
    >
      <Card
        className="cyber-form-card"
        style={{
          maxWidth: 800,
          margin: '0 auto',
          background: 'linear-gradient(145deg, var(--cyber-bg-card), var(--cyber-bg-secondary))',
          border: '1px solid var(--cyber-border)',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
        }}
        styles={{
          header: {
            background: 'transparent',
            borderBottom: '1px solid var(--cyber-border)',
            padding: '20px 24px',
          },
          body: { padding: '32px' }
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(145deg, rgba(0, 245, 255, 0.2), rgba(168, 85, 247, 0.1))',
              border: '1px solid rgba(0, 245, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <PlusOutlined style={{ color: '#00f5ff', fontSize: '18px' }} />
            </div>
            <div>
              <Text style={{
                color: 'var(--cyber-cyan)',
                fontSize: '18px',
                fontWeight: 600,
                display: 'block',
              }}>
                Add New Firewall Rule
              </Text>
              <Text style={{
                color: 'var(--cyber-text-muted)',
                fontSize: '12px',
              }}>
                Configure and deploy new iptables rule
              </Text>
            </div>
          </div>
        }
      >
        {/* Top Gradient Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--cyber-purple), var(--cyber-cyan), var(--cyber-pink))',
        }} />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          requiredMark={false}
        >
          {/* Basic Configuration Section */}
          <Divider orientation={"left" as DividerProps['orientation']} style={{ color: 'var(--cyber-text-secondary)', borderColor: 'var(--cyber-border)' }}>
            <ThunderboltOutlined style={{ marginRight: 8, color: 'var(--cyber-cyan)' }} />
            Basic Configuration
          </Divider>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="table"
                label={<span style={labelStyle}>Table</span>}
                rules={[{ required: true, message: 'Please select a table' }]}
              >
                <Select
                  placeholder="Select table"
                  style={inputStyle}
                  dropdownStyle={{
                    background: 'var(--cyber-bg-card)',
                    border: '1px solid var(--cyber-border)',
                  }}
                >
                  <Option value="filter">
                    <span style={{ color: '#3b82f6' }}>filter</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      (default)
                    </span>
                  </Option>
                  <Option value="nat">
                    <span style={{ color: '#10b981' }}>nat</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      (address translation)
                    </span>
                  </Option>
                  <Option value="mangle">
                    <span style={{ color: '#a855f7' }}>mangle</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      (packet alteration)
                    </span>
                  </Option>
                  <Option value="raw">
                    <span style={{ color: '#f59e0b' }}>raw</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      (connection tracking)
                    </span>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item
                name="chain"
                label={<span style={labelStyle}>Chain</span>}
                rules={[{ required: true, message: 'Please select a chain' }]}
              >
                <Select
                  placeholder="Select chain"
                  style={inputStyle}
                  dropdownStyle={{
                    background: 'var(--cyber-bg-card)',
                    border: '1px solid var(--cyber-border)',
                  }}
                >
                  <Option value="INPUT">INPUT</Option>
                  <Option value="OUTPUT">OUTPUT</Option>
                  <Option value="FORWARD">FORWARD</Option>
                  <Option value="PREROUTING">PREROUTING</Option>
                  <Option value="POSTROUTING">POSTROUTING</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Network Configuration Section */}
          <Divider orientation={"left" as DividerProps['orientation']} style={{ color: 'var(--cyber-text-secondary)', borderColor: 'var(--cyber-border)' }}>
            <GlobalOutlined style={{ marginRight: 8, color: 'var(--cyber-purple)' }} />
            Network Configuration
          </Divider>

          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="protocol"
                label={<span style={labelStyle}>Protocol</span>}
              >
                <Select
                  placeholder="Any protocol"
                  allowClear
                  style={inputStyle}
                  dropdownStyle={{
                    background: 'var(--cyber-bg-card)',
                    border: '1px solid var(--cyber-border)',
                  }}
                >
                  <Option value="tcp">TCP</Option>
                  <Option value="udp">UDP</Option>
                  <Option value="icmp">ICMP</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="source"
                label={<span style={labelStyle}>Source IP</span>}
              >
                <Input
                  placeholder="e.g., 192.168.1.0/24"
                  style={inputStyle}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="destination"
                label={<span style={labelStyle}>Destination IP</span>}
              >
                <Input
                  placeholder="e.g., 10.0.0.1"
                  style={inputStyle}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="dport"
                label={<span style={labelStyle}>Destination Port</span>}
              >
                <Input
                  placeholder="e.g., 80 or 80:443"
                  style={inputStyle}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Target Configuration Section */}
          <Divider orientation={"left" as DividerProps['orientation']} style={{ color: 'var(--cyber-text-secondary)', borderColor: 'var(--cyber-border)' }}>
            <AimOutlined style={{ marginRight: 8, color: 'var(--cyber-pink)' }} />
            Target Action
          </Divider>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="target"
                label={<span style={labelStyle}>Target</span>}
                rules={[{ required: true, message: 'Please select a target' }]}
              >
                <Select
                  placeholder="Select action"
                  style={inputStyle}
                  dropdownStyle={{
                    background: 'var(--cyber-bg-card)',
                    border: '1px solid var(--cyber-border)',
                  }}
                >
                  <Option value="ACCEPT">
                    <span style={{ color: '#10b981', fontWeight: 500 }}>ACCEPT</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      Allow traffic
                    </span>
                  </Option>
                  <Option value="DROP">
                    <span style={{ color: '#ef4444', fontWeight: 500 }}>DROP</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      Silently discard
                    </span>
                  </Option>
                  <Option value="REJECT">
                    <span style={{ color: '#f59e0b', fontWeight: 500 }}>REJECT</span>
                    <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                      Reject with response
                    </span>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Comment Section */}
          <Divider orientation={"left" as DividerProps['orientation']} style={{ color: 'var(--cyber-text-secondary)', borderColor: 'var(--cyber-border)' }}>
            <TagOutlined style={{ marginRight: 8, color: 'var(--cyber-green)' }} />
            Additional Info
          </Divider>

          <Form.Item
            name="comment"
            label={<span style={labelStyle}>Comment</span>}
          >
            <Input
              placeholder="Optional description for this rule"
              style={inputStyle}
            />
          </Form.Item>

          {/* Rule Lifetime Section */}
          <Divider orientation={"left" as DividerProps['orientation']} style={{ color: 'var(--cyber-text-secondary)', borderColor: 'var(--cyber-border)' }}>
            <ClockCircleOutlined style={{ marginRight: 8, color: 'var(--cyber-yellow, #f59e0b)' }} />
            Rule Lifetime
          </Divider>

          <Row gutter={24}>
            <Col xs={24} sm={12}>
              <Form.Item
                name="expires_in"
                label={<span style={labelStyle}>Auto-Expire</span>}
                initialValue={0}
                tooltip="Test rules will be automatically deleted after the specified time"
              >
                <Select
                  style={inputStyle}
                  dropdownStyle={{
                    background: 'var(--cyber-bg-card)',
                    border: '1px solid var(--cyber-border)',
                  }}
                >
                  {EXPIRY_OPTIONS.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <span style={{
                        color: opt.value > 0 ? '#f59e0b' : 'var(--cyber-text-primary)',
                        fontWeight: opt.value > 0 ? 500 : 400,
                      }}>
                        {opt.label}
                      </span>
                      {opt.value > 0 && (
                        <span style={{ color: 'var(--cyber-text-muted)', marginLeft: 8, fontSize: 12 }}>
                          (test mode)
                        </span>
                      )}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Submit Button */}
          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              size="large"
              style={{
                background: 'linear-gradient(135deg, var(--cyber-cyan), var(--cyber-blue))',
                border: 'none',
                borderRadius: '8px',
                height: '48px',
                fontWeight: 600,
                letterSpacing: '1px',
                boxShadow: '0 4px 20px rgba(0, 245, 255, 0.3)',
                paddingLeft: 32,
                paddingRight: 32,
              }}
            >
              DEPLOY RULE
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <style>{`
        .ant-form-item-label > label {
          color: var(--cyber-text-secondary) !important;
        }
        .ant-select-selection-placeholder {
          color: var(--cyber-text-muted) !important;
        }
        .ant-input::placeholder {
          color: var(--cyber-text-muted) !important;
        }
        .ant-divider-inner-text {
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 0.5px !important;
        }
      `}</style>
    </motion.div>
  );
};
