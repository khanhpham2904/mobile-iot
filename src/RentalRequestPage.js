import React, { useState, useEffect } from 'react';
import {
  Layout,
  Card,
  Button,
  Input,
  Form,
  message,
  Tag,
  Row,
  Col,
  Typography,
  Space,
  Avatar,
  Badge,
  Divider,
  List,
  Steps,
  Alert,
  Descriptions,
  Statistic,
  Progress,
  Switch,
  DatePicker,
  Select,
  Modal,
  Drawer,
  Tabs,
  Result,
  Empty,
  Skeleton,
  Spin,
  notification
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  UploadOutlined,
  SearchOutlined,
  FilterOutlined,
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  BellOutlined,
  MailOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  SafetyCertificateOutlined,
  BugOutlined,
  BuildOutlined,
  CarOutlined,
  HomeOutlined,
  BookOutlined,
  ExperimentOutlined,
  RobotOutlined,
  WifiOutlined,
  ThunderboltOutlined,
  BulbOutlined,
  HeartOutlined,
  StarOutlined,
  LikeOutlined,
  DislikeOutlined,
  QuestionCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckOutlined,
  StopOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepForwardOutlined,
  StepBackwardOutlined,
  FastForwardOutlined,
  FastBackwardOutlined,
  ShuffleOutlined,
  RetweetOutlined,
  SwapOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LoadingOutlined,
  RollbackOutlined,
  WalletOutlined,
  GiftOutlined,
  CrownOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { borrowingRequestAPI, walletAPI, kitAPI, notificationAPI } from './api';
// Mock function - TODO: Replace with real API call
const mockGenerateQRCode = (rentalData) => ({
  rentalId: `RENT-${Date.now()}`,
  qrData: rentalData,
  qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(rentalData))}`,
  qrCodeText: JSON.stringify(rentalData, null, 2)
});

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.4
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
};

function RentalRequestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedKitId = location.state?.kitId;
  const user = location.state?.user;

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedKit, setSelectedKit] = useState(null);
  const [rentalData, setRentalData] = useState({
    reason: '',
    expectReturnDate: '',
    requestType: 'BORROW_KIT',
    totalCost: 0
  });
  const [wallet, setWallet] = useState({ balance: 0, transactions: [] });
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [qrCodeData, setQrCodeData] = useState(null);
  const [showQRCode, setShowQRCode] = useState(false);

  useEffect(() => {
    if (!selectedKitId || !user) {
      navigate('/');
      return;
    }
    fetchKitDetails();
    fetchWallet();
  }, [selectedKitId, user, navigate]);

  const fetchKitDetails = async () => {
    try {
      setLoading(true);
      const response = await kitAPI.getKitById(selectedKitId);
      console.log('Kit API response:', response);
      
      // Handle ApiResponse wrapper
      let kitData;
      if (response && response.data) {
        kitData = response.data;
      } else if (response && response.id) {
        kitData = response;
      } else {
        throw new Error('Invalid response format');
      }
      
      console.log('Kit data:', kitData);
      setSelectedKit(kitData);
    } catch (error) {
      console.error('Error fetching kit:', error);
      message.error('Failed to load kit details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const data = await walletAPI.getMyWallet();
      console.log('Wallet data:', data);
      // Handle different response formats
      if (data && data.data) {
        // Handle ApiResponse wrapper
        setWallet({ balance: data.data.balance || 0, transactions: [] });
      } else if (data && data.balance !== undefined) {
        setWallet({ balance: data.balance, transactions: [] });
      } else {
        setWallet({ balance: 0, transactions: [] });
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      setWallet({ balance: 0, transactions: [] });
    }
  };

  const calculateTotalCost = () => {
    // Bỏ tính daily rate: không tự động tính totalCost theo ngày nữa
    // Giữ nguyên totalCost hiện có (có thể điền/tính từ nơi khác), hoặc để 0
    setRentalData(prev => ({ ...prev, totalCost: prev.totalCost || 0 }));
  };

  const formatDateTimeForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate rental details
      if (!rentalData.reason || !rentalData.expectReturnDate || !rentalData.requestType) {
        message.error('Please fill in all required fields');
        return;
      }
      
      // Validate dates
      const today = new Date();
      const end = new Date(rentalData.expectReturnDate);
      if (end <= today) {
        message.error('Expected return date must be in the future');
        return;
      }
      
      calculateTotalCost();
    }
    setCurrentStep(currentStep + 1);
    setStatusMessage('');
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setStatusMessage('');
  };

  const handleSubmitRental = async () => {
    setLoading(true);
    setStatusMessage('');

    try {
      // Check if wallet has enough balance for deposit (kit amount / 2)
      const requiredAmount = selectedKit ? selectedKit.amount / 2 : 0;
      if (wallet.balance < requiredAmount) {
        message.error('Insufficient wallet balance. Please top up your wallet.');
        setLoading(false);
        return;
      }

      // Generate QR code data
      const qrData = mockGenerateQRCode({
        kitId: selectedKit.id,
        kitName: selectedKit.kitName,
        userId: user.id,
        userEmail: user.email,
        startDate: rentalData.startDate,
        endDate: rentalData.endDate,
        totalCost: rentalData.totalCost
      });

      setQrCodeData(qrData);
      setShowQRCode(true);
      setCurrentStep(2); // Move to QR code step

      // Submit borrowing request
      await borrowingRequestAPI.create({
        kitId: selectedKit.id,
        accountID: user.id,
        reason: rentalData.reason,
        expectReturnDate: rentalData.expectReturnDate,
        requestType: rentalData.requestType
      });

      try {
        await notificationAPI.createNotifications([
          {
            subType: 'RENTAL_REQUEST',
            title: 'Đã gửi yêu cầu thuê kit',
            message: `Bạn đã gửi yêu cầu thuê kit ${selectedKit.kitName}.`
          },
          {
            subType: 'BORROW_REQUEST_CREATED',
            title: 'Yêu cầu mượn kit mới',
            message: `${user?.fullName || user?.email || 'Thành viên'} đã gửi yêu cầu thuê kit ${selectedKit.kitName}.`
          }
        ]);
      } catch (notifyError) {
        console.error('Error sending notifications:', notifyError);
      }

      // Deduct money from wallet
      await walletAPI.deduct(rentalData.totalCost, `Rental request for ${selectedKit.kitName}`);
      
      message.success('Rental request submitted successfully! QR code generated.');
    } catch (error) {
      console.error('Submit rental error:', error);
      message.error(error.message || 'Failed to submit rental request. Please try again.');
    }
    
    setLoading(false);
  };

  const steps = [
    {
      title: 'Rental Details',
      icon: <ShoppingOutlined />,
    },
    {
      title: 'Payment & Confirmation',
      icon: <DollarOutlined />,
    },
    {
      title: 'QR Code',
      icon: <CheckCircleOutlined />,
    }
  ];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card 
              title="Kit Information" 
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px' }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Descriptions column={1}>
                    <Descriptions.Item label="Kit Name">{selectedKit?.kitName}</Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color={selectedKit?.type === 'LECTURER_KIT' ? 'red' : 'blue'}>
                        {selectedKit?.type}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Quantity">{selectedKit?.quantityTotal || 0}</Descriptions.Item>
                    <Descriptions.Item label="Available">{selectedKit?.quantityAvailable || 0}</Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={12}>
                  <Descriptions column={1}>
                    <Descriptions.Item label="Status">
                      <Tag color={selectedKit?.status === 'AVAILABLE' ? 'success' : selectedKit?.status === 'IN_USE' ? 'warning' : 'error'}>
                        {selectedKit?.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Components">
                      {selectedKit?.components && selectedKit.components.length > 0 ? (
                        <div>
                          {selectedKit.components.map((comp, idx) => (
                            <Tag key={idx} color="blue" style={{ marginBottom: '4px' }}>
                              {comp.componentName} ({comp.quantityAvailable}/{comp.quantityTotal})
                            </Tag>
                          ))}
                        </div>
                      ) : (
                        <Text type="secondary">No components</Text>
                      )}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            <Card 
              title="Rental Details" 
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <Form layout="vertical">
                <Row gutter={[24, 24]}>
                  <Col xs={24}>
                    <Form.Item label="Reason for Rental" required>
                      <TextArea
                        rows={4}
                        placeholder="Please explain why you need to rent this kit..."
                        value={rentalData.reason}
                        onChange={(e) => setRentalData({ ...rentalData, reason: e.target.value })}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Request Type" required>
                      <Select
                        value={rentalData.requestType}
                        onChange={(value) => setRentalData({ ...rentalData, requestType: value })}
                      >
                        <Option value="BORROW_KIT">Borrow Kit</Option>
                        <Option value="BORROW_COMPONENT">Borrow Component</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label="Expected Return Date" required>
                      <DatePicker
                        showTime
                        format="YYYY-MM-DD HH:mm:ss"
                        style={{ width: '100%' }}
                        placeholder="Select expected return date"
                        onChange={(date, dateString) => {
                          // Convert to ISO format with time
                          const isoDate = date ? date.format('YYYY-MM-DDTHH:mm:ss') : null;
                          setRentalData({ ...rentalData, expectReturnDate: isoDate });
      setTimeout(calculateTotalCost, 100);
                        }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          </motion.div>
        );
      case 1:
        return (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card 
              title="Payment & Confirmation" 
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px' }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Card title="Rental Summary" size="small">
                    <Descriptions column={1}>
                      <Descriptions.Item label="Kit">{selectedKit?.kitName}</Descriptions.Item>
                      <Descriptions.Item label="Request Type">
                        <Tag color={rentalData.requestType === 'BORROW_KIT' ? 'blue' : 'purple'}>
                          {rentalData.requestType}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Expected Return Date">{formatDateTimeForDisplay(rentalData.expectReturnDate)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="Cost Breakdown" size="small">
                    <Descriptions column={1}>
                      <Descriptions.Item label="Total Cost">{(rentalData.totalCost || 0).toLocaleString()} VND</Descriptions.Item>
                      <Descriptions.Item label="Current Balance">{(wallet.balance || 0).toLocaleString()} VND</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>
            </Card>

            <Card 
              title="Wallet Status" 
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px' }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Current Balance"
                    value={wallet.balance}
                    prefix={<DollarOutlined />}
                    suffix="VND"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Required Amount (Deposit)"
                    value={selectedKit?.amount ? selectedKit.amount / 2 : 0}
                    prefix={<DollarOutlined />}
                    suffix="VND"
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic
                    title="Remaining Balance"
                    value={selectedKit ? wallet.balance - (selectedKit.amount / 2) : wallet.balance}
                    prefix={<DollarOutlined />}
                    suffix="VND"
                    valueStyle={{ color: selectedKit && wallet.balance >= (selectedKit.amount / 2) ? '#52c41a' : '#f5222d' }}
                  />
                </Col>
              </Row>
              
              <Divider />
              
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text>Balance Status:</Text>
                  <Tag color={selectedKit && wallet.balance >= (selectedKit.amount / 2) ? 'success' : 'error'}>
                    {selectedKit && wallet.balance >= (selectedKit.amount / 2) ? 'Sufficient' : 'Insufficient'}
                  </Tag>
                </div>
                
                {selectedKit && wallet.balance < (selectedKit.amount / 2) && (
                  <Alert
                    message="Insufficient Balance"
                    description={`You need ${(((selectedKit.amount / 2) || 0) - (wallet.balance || 0)).toLocaleString()} VND more to complete this rental.`}
                    type="warning"
                    showIcon
                  />
                )}
              </Space>
            </Card>

            <Card 
              title="Terms & Conditions" 
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
                By confirming this rental request, you agree to:
              </Text>
              <List
                size="small"
                dataSource={[
                  `Pay the total amount of ${(rentalData.totalCost || 0).toLocaleString()} VND`,
                  `Return the kit by ${rentalData.endDate}`,
                  'Use the kit only for the stated purpose',
                  'Report any damage or issues immediately'
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <Text>• {item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card 
              title="Rental Request QR Code" 
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '24px' }}
            >
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <Avatar
                  size={80}
                  icon={<CheckCircleOutlined />}
                  style={{ 
                    background: '#52c41a',
                    marginBottom: '24px'
                  }}
                />
                <Title level={3} style={{ color: '#52c41a', marginBottom: '16px' }}>
                  Request Submitted Successfully!
                </Title>
                <Text type="secondary" style={{ display: 'block', marginBottom: '32px' }}>
                  Your rental request has been submitted and is pending admin approval.
                </Text>
                
                {qrCodeData && (
                  <div>
                    <Card size="small" style={{ 
                      background: '#f6ffed', 
                      border: '1px solid #b7eb8f',
                      marginBottom: '24px',
                      maxWidth: '400px',
                      margin: '0 auto 24px'
                    }}>
                      <Row gutter={[16, 16]} align="middle">
                        <Col span={24} style={{ textAlign: 'center' }}>
                          <img 
                            src={qrCodeData.qrCodeUrl} 
                            alt="Rental QR Code"
                            style={{ 
                              maxWidth: '200px', 
                              height: 'auto',
                              borderRadius: '8px',
                              border: '2px solid #d9d9d9'
                            }}
                          />
                        </Col>
                        <Col span={24}>
                          <Descriptions column={1} size="small">
                            <Descriptions.Item label="Rental ID">
                              <Text code>{qrCodeData.rentalId}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Kit">
                              <Text strong>{selectedKit?.kitName}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Request Type">
                              <Tag color={rentalData.requestType === 'BORROW_KIT' ? 'blue' : 'purple'}>
                                {rentalData.requestType}
                              </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Expected Return Date">
                              <Text>{formatDateTimeForDisplay(rentalData.expectReturnDate)}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Total Cost">
                              <Text strong style={{ color: '#52c41a' }}>
                                {(rentalData.totalCost || 0).toLocaleString()} VND
                              </Text>
                            </Descriptions.Item>
                          </Descriptions>
                        </Col>
                      </Row>
                    </Card>
                    
                    <Alert
                      message="Important"
                      description="Please save this QR code. You may need to show it when collecting or returning the kit."
                      type="info"
                      showIcon
                      style={{ marginBottom: '24px' }}
                    />
                    
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                      <Button
                        type="primary"
                        size="large"
                        onClick={() => {
                          // Create a temporary link to download the QR code
                          const link = document.createElement('a');
                          link.href = qrCodeData.qrCodeUrl;
                          link.download = `rental-qr-${qrCodeData.rentalId}.png`;
                          link.click();
                        }}
                        style={{
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          height: 48,
                          padding: '0 32px',
                          fontWeight: 'bold'
                        }}
                      >
                        Download QR Code
                      </Button>
                      
                      <Button
                        size="large"
                        onClick={() => navigate('/')}
                        style={{
                          borderRadius: '12px',
                          height: 48,
                          padding: '0 32px'
                        }}
                      >
                        Back to Home
                      </Button>
                    </Space>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        );
      default:
        return <Empty description="Unknown step" />;
    }
  };

  if (!selectedKitId || !user) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Empty description="No kit selected. Redirecting..." />
            </Card>
          </motion.div>
        </Content>
      </Layout>
    );
  }

  if (!selectedKit && loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
              <Spin size="large" tip="Loading kit details..." />
            </Card>
          </motion.div>
        </Content>
      </Layout>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Header style={{ 
          padding: '0 32px', 
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          height: 80
        }}>
          <Space size="large">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate(-1)}
                style={{ 
                  fontSize: '18px', 
                  width: 48, 
                  height: 48,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(102, 126, 234, 0.1)',
                  color: '#667eea'
                }}
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Title level={2} style={{ margin: 0, color: '#2c3e50', fontWeight: 'bold' }}>
                Kit Rental Request
              </Title>
            </motion.div>
          </Space>
          
          <Space size="large">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Avatar 
                icon={<UserOutlined />} 
                size={48}
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '3px solid rgba(255,255,255,0.3)'
                }}
              />
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="primary"
                icon={<LogoutOutlined />} 
                onClick={() => navigate('/')}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 40,
                  padding: '0 20px',
                  fontWeight: 'bold'
                }}
              >
                Back to Home
              </Button>
            </motion.div>
          </Space>
        </Header>
      </motion.div>
      
      {/* Content Area */}
      <Content style={{ 
        margin: '24px', 
        padding: '32px', 
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        minHeight: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <Spin 
          spinning={loading}
          tip="Processing request..."
          size="large"
          indicator={
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <LoadingOutlined style={{ fontSize: 24 }} />
            </motion.div>
          }
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              {/* Steps */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
              >
                <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '32px' }}>
                  <Steps current={currentStep} items={steps} />
                </Card>
              </motion.div>

              {/* Step Content */}
              {getStepContent(currentStep)}

              {/* Navigation Buttons */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between' }}
              >
                <Button
                  disabled={currentStep === 0}
                  onClick={handleBack}
                  icon={<ArrowLeftOutlined />}
                  size="large"
                  style={{ borderRadius: '12px' }}
                >
                  Back
                </Button>
                
                <Space>
                  {currentStep === steps.length - 1 ? (
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => navigate('/')}
                      style={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Back to Home
                    </Button>
                  ) : currentStep === steps.length - 2 ? (
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleSubmitRental}
                      disabled={loading || (selectedKit && wallet.balance < (selectedKit.amount / 2))}
                      icon={<CheckCircleOutlined />}
                      style={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      {loading ? 'Submitting...' : 'Submit Rental Request'}
                    </Button>
                  ) : (
                    <Button 
                      type="primary" 
                      onClick={handleNext}
                      size="large"
                      icon={<StepForwardOutlined />}
                      style={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Space>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </Spin>
      </Content>
    </Layout>
  );
}

export default RentalRequestPage; 