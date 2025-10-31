import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Select,
  Button,
  Steps,
  message,
  Spin,
  Alert,
  Typography,
  Space,
  Divider,
  Modal,
  InputNumber,
  Avatar,
  Tag,
  Result
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftOutlined,
  WalletOutlined,
  BankOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  CreditCardOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { walletAPI } from './api';

// Vietnamese banks supported by VNPay
const vnPayBanks = [
  { id: 'NCB', code: 'NCB', name: 'Ngân hàng Quốc Dân', shortName: 'NCB' },
  { id: 'VIETCOMBANK', code: 'VIETCOMBANK', name: 'Ngân hàng Ngoại Thương Việt Nam', shortName: 'Vietcombank' },
  { id: 'VIETINBANK', code: 'VIETINBANK', name: 'Ngân hàng Công Thương Việt Nam', shortName: 'Vietinbank' },
  { id: 'TECHCOMBANK', code: 'TECHCOMBANK', name: 'Ngân hàng Kỹ Thương Việt Nam', shortName: 'Techcombank' },
  { id: 'ACB', code: 'ACB', name: 'Ngân hàng Á Châu', shortName: 'ACB' },
  { id: 'TPBANK', code: 'TPBANK', name: 'Ngân hàng Tiên Phong', shortName: 'TPBank' },
  { id: 'MBBANK', code: 'MBBANK', name: 'Ngân hàng Quân Đội', shortName: 'MB Bank' },
  { id: 'VPBANK', code: 'VPBANK', name: 'Ngân hàng Việt Nam Thịnh Vượng', shortName: 'VPBank' },
];

const { Title, Text } = Typography;
const { Option } = Select;
const { Step } = Steps;

// Animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  },
  hover: {
    y: -5,
    scale: 1.02,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

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

function TopUpPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  
  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [topUpAmount, setTopUpAmount] = useState(0);
  const [transactionResult, setTransactionResult] = useState(null);

  // Predefined amount options
  const amountOptions = [
    { label: '50,000 VND', value: 50000 },
    { label: '100,000 VND', value: 100000 },
    { label: '200,000 VND', value: 200000 },
    { label: '500,000 VND', value: 500000 },
    { label: '1,000,000 VND', value: 1000000 },
    { label: '2,000,000 VND', value: 2000000 }
  ];

  const handleBackToPortal = () => {
    const userRole = user?.role?.toLowerCase();
    switch (userRole) {
      case 'leader':
        navigate('/leader');
        break;
      case 'lecturer':
        navigate('/lecturer');
        break;
      case 'admin':
        navigate('/admin');
        break;
      case 'member':
        navigate('/member');
        break;
      case 'academic':
        navigate('/academic');
        break;
      default:
        navigate('/');
    }
  };

  const handleBankSelect = (bankId) => {
    const bank = vnPayBanks.find(b => b.id === bankId);
    setSelectedBank(bank);
    setCurrentStep(1);
  };

  const handleSkipBank = () => {
    setSelectedBank(null);
    setCurrentStep(1);
  };

  const handleAmountSelect = (amount) => {
    setTopUpAmount(amount);
    form.setFieldsValue({ amount });
  };

  const handleCustomAmountChange = (value) => {
    setTopUpAmount(value || 0);
  };

  const handleTopUp = async () => {
    if (!topUpAmount || topUpAmount < 10000) {
      message.error('Số tiền nạp tối thiểu là 10,000 VND');
      return;
    }
    if (topUpAmount > 10000000) {
      message.error('Số tiền nạp tối đa là 10,000,000 VND');
      return;
    }

    setLoading(true);
    try {
      const description = `Nạp tiền IoT Wallet - ${topUpAmount.toLocaleString()} VND`;
      
      // Call API to create top-up transaction
      const response = await walletAPI.topUp(topUpAmount, description);
      
      if (response && response.data) {
        // Store transaction info
        setTransactionResult({
          transactionId: response.data.id,
          orderId: response.data.id,
          amount: topUpAmount,
          bank: selectedBank?.shortName || 'N/A'
        });
        
        message.success('Nạp tiền thành công! Số dư ví đã được cập nhật.');
        
        // Redirect to previous page after 1 second
        setTimeout(() => {
          handleComplete();
        }, 1000);
      } else {
        message.error('Không thể nạp tiền. Vui lòng thử lại.');
      }
      
    } catch (error) {
      console.error('Top-up error:', error);
      message.error(error.response?.data?.message || 'Không thể nạp tiền. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    // Clear form and state
    form.resetFields();
    setTopUpAmount(0);
    setSelectedBank(null);
    setTransactionResult(null);
    setCurrentStep(0);
    
    // Return to portal
    handleBackToPortal();
  };

  const renderBankSelection = () => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title={
          <Space>
            <BankOutlined style={{ color: '#1890ff' }} />
            <span>Chọn Ngân Hàng</span>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Row gutter={[16, 16]}>
          {vnPayBanks.map((bank) => (
            <Col xs={24} sm={12} md={8} lg={6} key={bank.id}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  hoverable
                  onClick={() => handleBankSelect(bank.id)}
                  style={{
                    borderRadius: '12px',
                    border: selectedBank?.id === bank.id ? '2px solid #1890ff' : '2px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: selectedBank?.id === bank.id ? '#f6ffed' : 'white'
                  }}
                  bodyStyle={{ padding: '16px', textAlign: 'center' }}
                >
                  <Avatar
                    size={48}
                    style={{ 
                      marginBottom: '12px',
                      background: selectedBank?.id === bank.id ? '#1890ff' : '#f0f0f0',
                      color: selectedBank?.id === bank.id ? 'white' : '#1890ff'
                    }}
                  >
                    {bank.shortName.charAt(0)}
                  </Avatar>
                  <div>
                    <Text strong style={{ fontSize: '14px' }}>
                      {bank.shortName}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {bank.name}
                    </Text>
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Button
            type="default"
            size="large"
            onClick={handleSkipBank}
            style={{
              borderRadius: '12px',
              height: 48,
              padding: '0 32px'
            }}
          >
            Bỏ qua - Thanh toán trực tiếp
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  const renderAmountSelection = () => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title={
          <Space>
            <DollarOutlined style={{ color: '#52c41a' }} />
            <span>Select Amount</span>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={[16, 16]}>
            {amountOptions.map((option) => (
              <Col xs={12} sm={8} md={6} key={option.value}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    hoverable
                    onClick={() => handleAmountSelect(option.value)}
                    style={{
                      borderRadius: '12px',
                      border: topUpAmount === option.value ? '2px solid #1890ff' : '2px solid #f0f0f0',
                      cursor: 'pointer',
                      background: topUpAmount === option.value ? '#f6ffed' : 'white'
                    }}
                    bodyStyle={{ padding: '16px', textAlign: 'center' }}
                  >
                    <Text strong style={{ fontSize: '16px' }}>
                      {option.label}
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
          
          <Divider>Or enter custom amount</Divider>
          
          <Form.Item
            name="amount"
            label="Custom Amount (VND)"
            rules={[
              { required: true, message: 'Please enter amount' },
              { type: 'number', min: 10000, max: 10000000, message: 'Amount must be between 10,000 and 10,000,000 VND' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Enter amount"
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              onChange={handleCustomAmountChange}
              min={10000}
              max={10000000}
            />
          </Form.Item>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Space size="large">
              <Button
                size="large"
                onClick={() => setCurrentStep(0)}
                style={{
                  borderRadius: '12px',
                  height: 48,
                  padding: '0 24px'
                }}
              >
                Quay lại
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={() => setCurrentStep(2)}
                disabled={!topUpAmount}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 48,
                  padding: '0 32px',
                  fontWeight: 'bold'
                }}
              >
                Tiếp tục
              </Button>
            </Space>
          </div>
        </Form>
      </Card>
    </motion.div>
  );

  const renderPaymentInfo = () => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
            <span>Xác Nhận Nạp Tiền</span>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <div style={{ textAlign: 'center', padding: '24px' }}>
          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f', marginBottom: '24px' }}>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Text type="secondary">Số tiền:</Text>
              </Col>
              <Col span={16}>
                <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
                  {topUpAmount.toLocaleString()} VND
                </Text>
              </Col>
              {selectedBank && (
                <>
                  <Col span={8}>
                    <Text type="secondary">Ngân hàng:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{selectedBank.shortName}</Text>
                  </Col>
                </>
              )}
              <Col span={8}>
                <Text type="secondary">Phương thức:</Text>
              </Col>
              <Col span={16}>
                <Text strong>Trực tiếp</Text>
              </Col>
            </Row>
          </Card>

          <Alert
            message="Thông Tin"
            description="Nhấn xác nhận để hoàn tất giao dịch nạp tiền"
            type="info"
            style={{ marginBottom: '24px' }}
            showIcon
          />

          <Space size="large">
            <Button
              size="large"
              onClick={() => setCurrentStep(1)}
              style={{
                borderRadius: '12px',
                height: 48,
                padding: '0 24px'
              }}
            >
              Quay lại
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={handleTopUp}
              loading={loading}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none',
                height: 48,
                padding: '0 32px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Đang xử lý...' : 'Xác Nhận Nạp Tiền'}
            </Button>
          </Space>
        </div>
      </Card>
    </motion.div>
  );


  const renderSuccess = () => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Result
        status="success"
        title="Top-up Successful!"
        subTitle={`Your wallet has been topped up with ${topUpAmount.toLocaleString()} VND`}
        extra={[
          <Button
            type="primary"
            key="back"
            onClick={handleComplete}
            style={{
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              height: 48,
              padding: '0 32px',
              fontWeight: 'bold'
            }}
          >
            Back to Portal
          </Button>
        ]}
      >
        <div style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Text type="secondary">Transaction ID:</Text>
              </Col>
              <Col span={16}>
                <Text strong>{transactionResult?.transactionId}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Amount:</Text>
              </Col>
              <Col span={16}>
                <Text strong>{transactionResult?.amount?.toLocaleString()} VND</Text>
              </Col>
                  <Col span={8}>
                    <Text type="secondary">Bank:</Text>
                  </Col>
                  <Col span={16}>
                    <Text strong>{transactionResult?.bank || 'N/A'}</Text>
                  </Col>
              <Col span={8}>
                <Text type="secondary">Status:</Text>
              </Col>
              <Col span={16}>
                <Tag color="green">Completed</Tag>
              </Col>
            </Row>
          </Card>
        </div>
      </Result>
    </motion.div>
  );

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBankSelection();
      case 1:
        return renderAmountSelection();
      case 2:
        return renderPaymentInfo();
      default:
        return renderBankSelection();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Chọn Ngân Hàng';
      case 1:
        return 'Nhập Số Tiền';
      case 2:
        return 'Thanh Toán';
      default:
        return 'Nạp Tiền Ví';
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: '24px' }}
        >
          <Card style={{ 
            borderRadius: '16px', 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Row align="middle" justify="space-between">
              <Col>
                <Space size="large">
                  <Button
                    type="text"
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBackToPortal}
                    style={{ fontSize: '18px' }}
                  >
                    Back to Portal
                  </Button>
                  <div>
                    <Title level={2} style={{ margin: 0, color: '#2c3e50' }}>
                      <WalletOutlined style={{ marginRight: '8px', color: '#667eea' }} />
                      Nạp Tiền Ví
                    </Title>
                    <Text type="secondary">
                      Nạp tiền an toàn và tiện lợi qua VNPay
                    </Text>
                  </div>
                </Space>
              </Col>
              <Col>
                <Space>
                  <Avatar 
                    icon={<CreditCardOutlined />} 
                    size={48}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: '3px solid rgba(255,255,255,0.3)'
                    }}
                  />
                </Space>
              </Col>
            </Row>
          </Card>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ marginBottom: '32px' }}
        >
          <Card style={{ 
            borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Steps
              current={currentStep}
              size="small"
              style={{ padding: '16px 0' }}
            >
              <Step title="Ngân Hàng" icon={<BankOutlined />} />
              <Step title="Số Tiền" icon={<DollarOutlined />} />
              <Step title="Thanh Toán" icon={<SafetyCertificateOutlined />} />
            </Steps>
          </Card>
        </motion.div>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <Spin 
              spinning={loading}
              indicator={
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <LoadingOutlined style={{ fontSize: 24 }} />
                </motion.div>
              }
            >
              {getStepContent()}
            </Spin>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default TopUpPage;
