import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Layout,
  Card,
  Button,
  Input,
  message,
  Tag,
  Typography,
  Space,
  Descriptions,
  Alert,
  Spin,
  Result
} from 'antd';
import { motion } from 'framer-motion';
import {
  ArrowLeftOutlined,
  UserOutlined,
  ToolOutlined,
  BuildOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  QrcodeOutlined,
  ScanOutlined
} from '@ant-design/icons';
import { qrCodeAPI } from './api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { TextArea } = Input;

// Helper function to parse QR code text
const parseQRCodeText = (qrText) => {
  if (!qrText || typeof qrText !== 'string') {
    return null;
  }

  const lines = qrText.split('\n').filter(line => line.trim());
  const info = {};

  // Check if it's a borrowing request or component rental request
  if (qrText.includes('=== BORROWING REQUEST INFO ===')) {
    info.type = 'BORROWING_REQUEST';
    lines.forEach(line => {
      if (line.startsWith('Borrower: ')) {
        info.borrower = line.replace('Borrower: ', '').trim();
      } else if (line.startsWith('Borrower ID: ')) {
        info.borrowerId = line.replace('Borrower ID: ', '').trim();
      } else if (line.startsWith('Kit Name: ')) {
        info.kitName = line.replace('Kit Name: ', '').trim();
      } else if (line.startsWith('Kit ID: ')) {
        info.kitId = line.replace('Kit ID: ', '').trim();
      } else if (line.startsWith('Request Type: ')) {
        info.requestType = line.replace('Request Type: ', '').trim();
      } else if (line.startsWith('Reason: ')) {
        info.reason = line.replace('Reason: ', '').trim();
      } else if (line.startsWith('Expected Return Date: ')) {
        info.expectReturnDate = line.replace('Expected Return Date: ', '').trim();
      } else if (line.startsWith('Status: ')) {
        info.status = line.replace('Status: ', '').trim();
      }
    });
  } else if (qrText.includes('=== COMPONENT RENTAL REQUEST ===')) {
    info.type = 'COMPONENT_RENTAL';
    lines.forEach(line => {
      if (line.startsWith('Borrower: ')) {
        info.borrower = line.replace('Borrower: ', '').trim();
      } else if (line.startsWith('Borrower ID: ')) {
        info.borrowerId = line.replace('Borrower ID: ', '').trim();
      } else if (line.startsWith('Component Name: ')) {
        info.componentName = line.replace('Component Name: ', '').trim();
      } else if (line.startsWith('Component ID: ')) {
        info.componentId = line.replace('Component ID: ', '').trim();
      } else if (line.startsWith('Quantity: ')) {
        info.quantity = line.replace('Quantity: ', '').trim();
      } else if (line.startsWith('Price per Unit: ')) {
        info.pricePerUnit = line.replace('Price per Unit: ', '').replace(' VND', '').trim();
      } else if (line.startsWith('Total Amount: ')) {
        info.totalAmount = line.replace('Total Amount: ', '').replace(' VND', '').trim();
      } else if (line.startsWith('Reason: ')) {
        info.reason = line.replace('Reason: ', '').trim();
      } else if (line.startsWith('Expected Return Date: ')) {
        info.expectReturnDate = line.replace('Expected Return Date: ', '').trim();
      } else if (line.startsWith('Status: ')) {
        info.status = line.replace('Status: ', '').trim();
      }
    });
  }

  return Object.keys(info).length > 1 ? info : null;
};

const getStatusColor = (status) => {
  if (!status) return 'default';
  const upperStatus = status.toUpperCase();
  switch (upperStatus) {
    case 'PENDING':
      return 'orange';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'BORROWED':
      return 'blue';
    case 'RETURNED':
      return 'default';
    default:
      return 'default';
  }
};

function QRInfoPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [qrText, setQrText] = useState('');
  const [parsedInfo, setParsedInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get QR data from URL parameter
    const dataFromUrl = searchParams.get('data');
    if (dataFromUrl) {
      setQrText(decodeURIComponent(dataFromUrl));
      handleParse(decodeURIComponent(dataFromUrl));
    }
  }, [searchParams]);

  const handleParse = async (text) => {
    if (!text || !text.trim()) {
      setError('Please enter QR code text');
      setParsedInfo(null);
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use backend API to parse QR code text
      const parsedData = await qrCodeAPI.parse(text);
      
      if (parsedData && parsedData.data) {
        // Convert backend format to frontend format for compatibility
        const frontendFormat = {
          type: parsedData.type,
          ...parsedData.data
        };
        setParsedInfo(frontendFormat);
        setQrText(text);
      } else {
        setError('Invalid QR code format. Please check the QR code text.');
        setParsedInfo(null);
      }
    } catch (err) {
      // Try fallback to client-side parsing if backend fails
      try {
        const parsed = parseQRCodeText(text);
        if (parsed) {
          setParsedInfo(parsed);
          setQrText(text);
          setError(''); // Clear error if fallback succeeds
        } else {
          setError(err.message || 'Invalid QR code format. Please check the QR code text.');
          setParsedInfo(null);
        }
      } catch (fallbackErr) {
        setError(err.message || 'Error parsing QR code: ' + fallbackErr.message);
        setParsedInfo(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleScan = () => {
    // This would typically open a QR scanner
    // For now, we'll show a message to paste the QR text
    message.info('Please paste the QR code text in the text area below, or use the URL parameter ?data=<encoded_qr_text>');
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header style={{
        padding: '0 32px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        height: 80
      }}>
        <Space>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ fontSize: '16px' }}
          >
            Back
          </Button>
          <Title level={4} style={{ margin: 0, color: '#2c3e50' }}>
            QR Code Information
          </Title>
        </Space>
      </Header>

      <Content style={{
        margin: '24px',
        padding: '32px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        minHeight: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <Spin spinning={loading}>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Input Section */}
            <Card
              title={
                <Space>
                  <QrcodeOutlined />
                  <span>Scan or Enter QR Code</span>
                </Space>
              }
              style={{ marginBottom: '24px', borderRadius: '16px' }}
              extra={
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  onClick={handleScan}
                >
                  Scan QR Code
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                <TextArea
                  rows={6}
                  placeholder="Paste QR code text here or scan using the button above..."
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
                <Button
                  type="primary"
                  block
                  onClick={() => handleParse(qrText)}
                  disabled={!qrText || !qrText.trim()}
                >
                  Parse QR Code
                </Button>
              </Space>
            </Card>

            {/* Error Message */}
            {error && (
              <Alert
                message="Error"
                description={error}
                type="error"
                showIcon
                closable
                onClose={() => setError('')}
                style={{ marginBottom: '24px' }}
              />
            )}

            {/* Parsed Information */}
            {parsedInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {parsedInfo.type === 'BORROWING_REQUEST' ? (
                  <Card
                    title={
                      <Space>
                        <ToolOutlined style={{ color: '#1890ff' }} />
                        <span>Kit Rental Information</span>
                      </Space>
                    }
                    style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  >
                    <Descriptions
                      bordered
                      column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                      size="default"
                    >
                      <Descriptions.Item label="Request Type" span={2}>
                        <Tag color="blue" icon={<InfoCircleOutlined />}>
                          {parsedInfo.requestType || 'N/A'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status" span={2}>
                        <Tag color={getStatusColor(parsedInfo.status)} icon={<CheckCircleOutlined />}>
                          {parsedInfo.status || 'N/A'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Borrower" span={2}>
                        <Space>
                          <UserOutlined style={{ color: '#1890ff' }} />
                          <Text strong>{parsedInfo.borrower || 'N/A'}</Text>
                          {parsedInfo.borrowerId && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              (ID: {parsedInfo.borrowerId})
                            </Text>
                          )}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Kit Name" span={2}>
                        <Space>
                          <ToolOutlined style={{ color: '#52c41a' }} />
                          <Text strong style={{ fontSize: '16px' }}>
                            {parsedInfo.kitName || 'N/A'}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      {parsedInfo.kitId && (
                        <Descriptions.Item label="Kit ID">
                          <Text code>{parsedInfo.kitId}</Text>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Expected Return Date" span={2}>
                        <Space>
                          <CalendarOutlined style={{ color: '#fa8c16' }} />
                          <Text>{parsedInfo.expectReturnDate || 'N/A'}</Text>
                        </Space>
                      </Descriptions.Item>
                      {parsedInfo.reason && (
                        <Descriptions.Item label="Reason" span={2}>
                          <Text>{parsedInfo.reason}</Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                ) : parsedInfo.type === 'COMPONENT_RENTAL' ? (
                  <Card
                    title={
                      <Space>
                        <BuildOutlined style={{ color: '#722ed1' }} />
                        <span>Component Rental Information</span>
                      </Space>
                    }
                    style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  >
                    <Descriptions
                      bordered
                      column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                      size="default"
                    >
                      <Descriptions.Item label="Request Type" span={2}>
                        <Tag color="purple" icon={<BuildOutlined />}>
                          COMPONENT RENTAL
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Status" span={2}>
                        <Tag color={getStatusColor(parsedInfo.status)} icon={<CheckCircleOutlined />}>
                          {parsedInfo.status || 'N/A'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Borrower" span={2}>
                        <Space>
                          <UserOutlined style={{ color: '#1890ff' }} />
                          <Text strong>{parsedInfo.borrower || 'N/A'}</Text>
                          {parsedInfo.borrowerId && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              (ID: {parsedInfo.borrowerId})
                            </Text>
                          )}
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Component Name" span={2}>
                        <Space>
                          <BuildOutlined style={{ color: '#722ed1' }} />
                          <Text strong style={{ fontSize: '16px' }}>
                            {parsedInfo.componentName || 'N/A'}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      {parsedInfo.componentId && (
                        <Descriptions.Item label="Component ID">
                          <Text code>{parsedInfo.componentId}</Text>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Quantity">
                        <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                          {parsedInfo.quantity || 'N/A'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Price per Unit">
                        <Text strong style={{ color: '#52c41a' }}>
                          {parsedInfo.pricePerUnit ? `${parseInt(parsedInfo.pricePerUnit).toLocaleString()} VND` : 'N/A'}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Amount" span={2}>
                        <Space>
                          <DollarOutlined style={{ color: '#52c41a', fontSize: '18px' }} />
                          <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                            {parsedInfo.totalAmount ? `${parseInt(parsedInfo.totalAmount).toLocaleString()} VND` : 'N/A'}
                          </Text>
                        </Space>
                      </Descriptions.Item>
                      <Descriptions.Item label="Expected Return Date" span={2}>
                        <Space>
                          <CalendarOutlined style={{ color: '#fa8c16' }} />
                          <Text>{parsedInfo.expectReturnDate || 'N/A'}</Text>
                        </Space>
                      </Descriptions.Item>
                      {parsedInfo.reason && (
                        <Descriptions.Item label="Reason" span={2}>
                          <Text>{parsedInfo.reason}</Text>
                        </Descriptions.Item>
                      )}
                    </Descriptions>
                  </Card>
                ) : null}
              </motion.div>
            )}

            {/* Empty State */}
            {!parsedInfo && !error && !loading && (
              <Result
                icon={<QrcodeOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
                title="No QR Code Information"
                subTitle="Please scan or paste the QR code text to view rental information"
              />
            )}
          </motion.div>
        </Spin>
      </Content>
    </Layout>
  );
}

export default QRInfoPage;
