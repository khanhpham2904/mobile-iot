import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { penaltiesAPI, penaltyDetailAPI, walletAPI, borrowingRequestAPI, penaltyPoliciesAPI } from './api';
import {
  Card,
  Row,
  Col,
  Button,
  message,
  Spin,
  Alert,
  Typography,
  Space,
  Divider,
  Result,
  Descriptions,
  Tag,
  Avatar,
  Badge,
  Modal,
  List,
  Empty
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeftOutlined,
  WalletOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  CreditCardOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ShoppingOutlined
} from '@ant-design/icons';
// Removed mock data - using real API calls

const { Title, Text } = Typography;

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

function PenaltyPaymentPage({ user, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [penalties, setPenalties] = useState([]);
  const [selectedPenalty, setSelectedPenalty] = useState(null);
  const [penaltyDetails, setPenaltyDetails] = useState([]);
  const [borrowRequest, setBorrowRequest] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [paymentResult, setPaymentResult] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0: select penalty, 1: confirm, 2: result

  // Get penalty ID from URL params or location state
  const penaltyId = new URLSearchParams(location.search).get('penaltyId') || location.state?.penaltyId;

  useEffect(() => {
    loadPenalties();
    loadWalletBalance();
  }, [user]);

  const loadWalletBalance = async () => {
    try {
      const walletResponse = await walletAPI.getMyWallet();
      const walletData = walletResponse?.data || walletResponse || {};
      setWalletBalance(walletData.balance || 0);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
      setWalletBalance(0);
    }
  };

  const loadPenalties = async () => {
    try {
      setLoading(true);
      const response = await penaltiesAPI.getPenByAccount();
      console.log('Penalties by account response:', response);
      
      // Handle response format
      let penaltiesData = [];
      if (Array.isArray(response)) {
        penaltiesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        penaltiesData = response.data;
      }
      
      // Map to expected format, keep original data for update
      const mappedPenalties = penaltiesData.map(penalty => ({
        id: penalty.id,
        penaltyId: penalty.id,
        kitName: penalty.kitName || 'Unknown Kit',
        rentalId: penalty.borrowRequestId || 'N/A',
        amount: penalty.totalAmount || 0,
        penaltyType: penalty.type || 'other',
        dueDate: penalty.takeEffectDate || new Date().toISOString(),
        reason: penalty.note || 'Penalty fee',
        status: penalty.resolved ? 'resolved' : 'pending',
        // Keep original data for update
        originalData: penalty
      }));
      
      // Filter only unresolved penalties
      const pendingPenalties = mappedPenalties.filter(p => p.status === 'pending');
      setPenalties(pendingPenalties);
      
      // If penaltyId is provided, auto-select it
      if (penaltyId) {
        const penalty = pendingPenalties.find(p => p.id === penaltyId || p.penaltyId === penaltyId);
        if (penalty) {
          setSelectedPenalty(penalty);
          loadPenaltyDetails(penalty.id);
          // Load borrow request if available
          if (penalty.rentalId && penalty.rentalId !== 'N/A') {
            loadBorrowRequest(penalty.rentalId);
          } else {
            const originalData = penalty.originalData;
            if (originalData && originalData.borrowRequestId) {
              loadBorrowRequest(originalData.borrowRequestId);
            }
          }
          setCurrentStep(1);
        }
      }
    } catch (error) {
      console.error('Error loading penalties:', error);
      setPenalties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPenaltyDetails = async (penaltyId) => {
    if (!penaltyId) {
      console.warn('No penaltyId provided for loading penalty details');
      setPenaltyDetails([]);
      return;
    }

    try {
      console.log('=== Loading penalty details for penaltyId:', penaltyId);
      console.log('PenaltyId type:', typeof penaltyId);
      
      const response = await penaltyDetailAPI.findByPenaltyId(penaltyId);
      console.log('=== Raw penalty details response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      console.log('Is array:', Array.isArray(response));
      
      let detailsData = [];
      
      // Check if response has ApiResponse wrapper structure
      if (response && typeof response === 'object') {
        // Check for ApiResponse format: { status, message, data }
        if (response.data !== undefined) {
          if (Array.isArray(response.data)) {
            detailsData = response.data;
            console.log('Found data array in ApiResponse:', detailsData.length, 'items');
          } else if (response.data && typeof response.data === 'object' && response.data.id) {
            // Single object wrapped in data
            detailsData = [response.data];
            console.log('Found single object in ApiResponse.data');
          } else if (response.data === null || response.data === undefined) {
            detailsData = [];
            console.log('ApiResponse.data is null or undefined');
          }
        }
        // Check if response itself is array
        else if (Array.isArray(response)) {
          detailsData = response;
          console.log('Response is direct array:', detailsData.length, 'items');
        }
        // Check if response is a single PenaltyDetail object
        else if (response.id) {
          detailsData = [response];
          console.log('Response is single PenaltyDetail object');
        }
        // Check nested structure
        else if (response.response && response.response.data) {
          if (Array.isArray(response.response.data)) {
            detailsData = response.response.data;
          } else {
            detailsData = [response.response.data];
          }
          console.log('Found nested response structure');
        }
      }
      
      console.log('=== Parsed penalty details data:', detailsData);
      console.log('=== Number of penalty details:', detailsData.length);
      
      if (detailsData.length > 0) {
        console.log('First penalty detail sample:', detailsData[0]);
      }
      
      // Fetch penalty policy info for each detail if policiesId exists
      if (detailsData.length > 0) {
        const detailsWithPolicies = await Promise.all(
          detailsData.map(async (detail) => {
            if (detail.policiesId) {
              try {
                const policyResponse = await penaltyPoliciesAPI.getById(detail.policiesId);
                let policyData = null;
                if (policyResponse) {
                  if (policyResponse.data) {
                    policyData = policyResponse.data;
                  } else if (policyResponse.id) {
                    policyData = policyResponse;
                  }
                }
                return { ...detail, policy: policyData };
              } catch (error) {
                console.error(`Error loading policy for detail ${detail.id}:`, error);
                return { ...detail, policy: null };
              }
            }
            return { ...detail, policy: null };
          })
        );
        setPenaltyDetails(detailsWithPolicies);
      } else {
        setPenaltyDetails(detailsData);
      }
    } catch (error) {
      console.error('=== Error loading penalty details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      message.error(`Failed to load penalty details: ${error.message}`);
      setPenaltyDetails([]);
    }
  };

  const loadBorrowRequest = async (borrowRequestId) => {
    if (!borrowRequestId || borrowRequestId === 'N/A') {
      setBorrowRequest(null);
      return;
    }
    
    try {
      const response = await borrowingRequestAPI.getById(borrowRequestId);
      console.log('Borrow request response:', response);
      
      let requestData = null;
      if (response) {
        if (response.data) {
          requestData = response.data;
        } else if (response.id) {
          requestData = response;
        }
      }
      
      setBorrowRequest(requestData);
    } catch (error) {
      console.error('Error loading borrow request:', error);
      setBorrowRequest(null);
    }
  };

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

  const handleSelectPenalty = (penalty) => {
    setSelectedPenalty(penalty);
    loadPenaltyDetails(penalty.id);
    // Load borrow request if available
    if (penalty.rentalId && penalty.rentalId !== 'N/A') {
      loadBorrowRequest(penalty.rentalId);
    } else {
      // Try to get from original data
      const originalData = penalty.originalData;
      if (originalData && originalData.borrowRequestId) {
        loadBorrowRequest(originalData.borrowRequestId);
      } else {
        setBorrowRequest(null);
      }
    }
    setCurrentStep(1);
  };

  const handleConfirmPayment = () => {
    setShowConfirmation(true);
  };

  const handleProcessPayment = async () => {
    setLoading(true);
    setShowConfirmation(false);
    try {
      // Kiểm tra số dư ví trước khi tiếp tục
      if (!isBalanceSufficient()) {
        message.error('Số dư ví không đủ để thanh toán penalty! Vui lòng nạp thêm tiền.');
        handleBackToPortal();
        return;
      }

      // Get current penalty from penalties list to have full data
      const currentPenalty = penalties.find(p => p.id === selectedPenalty.id || p.penaltyId === selectedPenalty.id);
      if (!currentPenalty) {
        throw new Error('Penalty not found');
      }
      // Use original data if available, otherwise use mapped data
      const penaltyData = currentPenalty.originalData || currentPenalty;

      // Gọi đúng endpoint confirm-payment BE
      await penaltiesAPI.confirmPenaltyPayment(selectedPenalty.id);
      await loadWalletBalance();
      await loadPenalties();
      // Set payment result
      const newWalletBalance = walletBalance - selectedPenalty.amount;
      setPaymentResult({
        success: true,
        paymentId: `PAY-${Date.now()}`,
        penaltyId: selectedPenalty.id,
        amount: selectedPenalty.amount,
        timestamp: new Date().toISOString(),
        status: 'completed',
        remainingBalance: Math.max(0, newWalletBalance)
      });
      message.success('Thanh toán penalty thành công!');
      setCurrentStep(2);
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error(error.message || 'Payment failed. Please try again.');
      setCurrentStep(0); // Go back to penalty selection
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    handleBackToPortal();
  };

  const getPenaltyTypeColor = (type) => {
    switch (type) {
      case 'late_return':
        return 'orange';
      case 'damage':
        return 'red';
      case 'overdue':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getPenaltyTypeText = (type) => {
    switch (type) {
      case 'late_return':
        return 'Late Return';
      case 'damage':
        return 'Damage';
      case 'overdue':
        return 'Overdue';
      default:
        return type;
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'default';
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'approved':
      case 'completed':
      case 'active':
        return 'success';
      case 'pending':
      case 'pending_approval':
        return 'warning';
      case 'rejected':
      case 'cancelled':
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const isBalanceSufficient = () => {
    return walletBalance >= selectedPenalty?.amount;
  };

  const renderPenaltySelection = () => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#fa8c16' }} />
            <span>Select Penalty to Pay</span>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        {penalties.length > 0 ? (
          <Row gutter={[16, 16]}>
            {penalties.map((penalty) => (
              <Col xs={24} sm={12} lg={8} key={penalty.id}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Card
                    hoverable
                    onClick={() => handleSelectPenalty(penalty)}
                    style={{
                      borderRadius: '12px',
                      border: '2px solid #f0f0f0',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    bodyStyle={{ padding: '16px' }}
                  >
                    <Row gutter={[12, 12]} align="middle">
                      <Col>
                        <Avatar
                          size={48}
                          icon={<ExclamationCircleOutlined />}
                          style={{ 
                            background: penalty.amount > walletBalance ? '#ff4d4f' : '#fa8c16' 
                          }}
                        />
                      </Col>
                      <Col flex="auto">
                        <div>
                          <Text strong style={{ fontSize: '16px' }}>
                            {penalty.kitName}
                          </Text>
                          <br />
                          <Tag color={getPenaltyTypeColor(penalty.penaltyType)}>
                            {getPenaltyTypeText(penalty.penaltyType)}
                          </Tag>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Due: {new Date(penalty.dueDate).toLocaleDateString()}
                          </Text>
                        </div>
                      </Col>
                      <Col>
                        <div style={{ textAlign: 'right' }}>
                          <Text strong style={{ 
                            fontSize: '18px', 
                            color: penalty.amount > walletBalance ? '#ff4d4f' : '#52c41a' 
                          }}>
                            {penalty.amount.toLocaleString()} VND
                          </Text>
                          <br />
                          {penalty.amount > walletBalance && (
                            <Tag color="red" size="small">Insufficient Balance</Tag>
                          )}
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <Avatar
              size={64}
              icon={<CheckCircleOutlined />}
              style={{ 
                background: '#52c41a',
                marginBottom: '16px'
              }}
            />
            <Title level={4} style={{ color: '#52c41a' }}>
              No Pending Penalties
            </Title>
            <Text type="secondary">
              You don't have any pending penalty fees to pay.
            </Text>
            <div style={{ marginTop: '24px' }}>
              <Button
                type="primary"
                onClick={handleBackToPortal}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  height: 40,
                  padding: '0 24px',
                  fontWeight: 'bold'
                }}
              >
                Back to Portal
              </Button>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );

  const renderConfirmation = () => (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title={
          <Space>
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
            <span>Payment Confirmation</span>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <div style={{ padding: '24px' }}>
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="Penalty Type" span={2}>
                    <Tag color={getPenaltyTypeColor(selectedPenalty.penaltyType)}>
                      {getPenaltyTypeText(selectedPenalty.penaltyType)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Rental ID">
                    <Text code>{selectedPenalty.rentalId}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Amount">
                    <Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>
                      {selectedPenalty.amount.toLocaleString()} VND
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Due Date">
                    <Text>{new Date(selectedPenalty.dueDate).toLocaleDateString()}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Reason" span={2}>
                    <Text>{selectedPenalty.reason}</Text>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            {/* Penalty Details - Always show this section */}
            <Col span={24}>
              <Card 
                title={
                  <Space>
                    <InfoCircleOutlined /> 
                    <span>Penalty Details</span>
                    {penaltyDetails && penaltyDetails.length > 0 && (
                      <Tag color="blue">{penaltyDetails.length} item(s)</Tag>
                    )}
                  </Space>
                }
                size="small"
                style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}
              >
                {penaltyDetails && penaltyDetails.length > 0 ? (
                  <Descriptions column={1} bordered size="small">
                    {penaltyDetails.map((detail, index) => (
                      <React.Fragment key={detail.id || index}>
                        <Descriptions.Item label={`Detail ${index + 1}`}>
                          <div style={{ marginBottom: 8 }}>
                            <Space direction="vertical" size={4} style={{ width: '100%' }}>
                              <div>
                                <Text strong style={{ fontSize: 14 }}>
                                  {detail.description || 'Penalty Detail'}
                                </Text>
                              </div>
                              <div>
                                <Text>Amount: </Text>
                                <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                                  {detail.amount ? detail.amount.toLocaleString() : 0} VND
                                </Text>
                              </div>
                              {detail.createdAt && (
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Created: {new Date(detail.createdAt).toLocaleString('vi-VN')}
                                  </Text>
                                </div>
                              )}
                              {detail.policiesId && (
                                <div>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Policy ID: <Text code>{detail.policiesId}</Text>
                                  </Text>
                                </div>
                              )}
                              {detail.policy && (
                                <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                                  <Text strong style={{ fontSize: 12, color: '#1890ff' }}>Policy Information:</Text>
                                  <div style={{ marginTop: 4 }}>
                                    <Text style={{ fontSize: 12 }}>
                                      <Text strong>Policy Name: </Text>
                                      {detail.policy.policyName || 'N/A'}
                                    </Text>
                                  </div>
                                  {detail.policy.type && (
                                    <div>
                                      <Text style={{ fontSize: 12 }}>
                                        <Text strong>Type: </Text>
                                        <Tag color="blue" size="small">{detail.policy.type}</Tag>
                                      </Text>
                                    </div>
                                  )}
                                  {detail.policy.amount && (
                                    <div>
                                      <Text style={{ fontSize: 12 }}>
                                        <Text strong>Policy Amount: </Text>
                                        {detail.policy.amount.toLocaleString()} VND
                                      </Text>
                                    </div>
                                  )}
                                  {detail.policy.issuedDate && (
                                    <div>
                                      <Text type="secondary" style={{ fontSize: 12 }}>
                                        Issued: {new Date(detail.policy.issuedDate).toLocaleDateString('vi-VN')}
                                      </Text>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Space>
                          </div>
                        </Descriptions.Item>
                        {index < penaltyDetails.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </Descriptions>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Empty 
                      description="No penalty details found"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                    <Text type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
                      This penalty does not have any details yet.
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Penalty ID: {selectedPenalty?.id || 'N/A'}
                      </Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Borrow Request Information */}
            {borrowRequest && (
              <Col span={24}>
                <Card 
                  title={<Space><ShoppingOutlined /> Borrow Request Information</Space>}
                  size="small"
                  style={{ background: '#e6f7ff', border: '1px solid #91d5ff' }}
                >
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="Request ID">
                      <Text code>{borrowRequest.id || 'N/A'}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(borrowRequest.status)}>
                        {borrowRequest.status || 'N/A'}
                      </Tag>
                    </Descriptions.Item>
                    {borrowRequest.kit && (
                      <>
                        <Descriptions.Item label="Kit Name">
                          <Text strong>{borrowRequest.kit.kitName || borrowRequest.kitName || 'N/A'}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Kit Type">
                          <Text>{borrowRequest.kit.type || borrowRequest.kitType || 'N/A'}</Text>
                        </Descriptions.Item>
                      </>
                    )}
                    {borrowRequest.requestType && (
                      <Descriptions.Item label="Request Type">
                        <Tag>{borrowRequest.requestType}</Tag>
                      </Descriptions.Item>
                    )}
                    {borrowRequest.reason && (
                      <Descriptions.Item label="Reason" span={2}>
                        <Text>{borrowRequest.reason}</Text>
                      </Descriptions.Item>
                    )}
                    {borrowRequest.requestDate && (
                      <Descriptions.Item label="Request Date">
                        <Text>{new Date(borrowRequest.requestDate).toLocaleString('vi-VN')}</Text>
                      </Descriptions.Item>
                    )}
                    {borrowRequest.createdAt && (
                      <Descriptions.Item label="Created Date">
                        <Text>{new Date(borrowRequest.createdAt).toLocaleString('vi-VN')}</Text>
                      </Descriptions.Item>
                    )}
                    {borrowRequest.expectReturnDate && (
                      <Descriptions.Item label="Expected Return Date">
                        <Text>{new Date(borrowRequest.expectReturnDate).toLocaleString('vi-VN')}</Text>
                      </Descriptions.Item>
                    )}
                    {borrowRequest.approvedDate && (
                      <Descriptions.Item label="Approved Date">
                        <Text>{new Date(borrowRequest.approvedDate).toLocaleString('vi-VN')}</Text>
                      </Descriptions.Item>
                    )}
                    {borrowRequest.depositAmount !== undefined && (
                      <Descriptions.Item label="Deposit Amount">
                        <Text strong>{borrowRequest.depositAmount?.toLocaleString() || 0} VND</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
            )}

            <Col span={24}>
              <Card size="small" style={{ 
                background: isBalanceSufficient() ? '#f0f9ff' : '#fff2f0', 
                border: `1px solid ${isBalanceSufficient() ? '#91d5ff' : '#ffccc7'}` 
              }}>
                <Row gutter={[16, 16]} align="middle">
                  <Col>
                    <Avatar
                      size={48}
                      icon={<WalletOutlined />}
                      style={{ 
                        background: isBalanceSufficient() ? '#1890ff' : '#ff4d4f' 
                      }}
                    />
                  </Col>
                  <Col flex="auto">
                    <div>
                      <Text strong style={{ fontSize: '16px' }}>
                        Current Wallet Balance
                      </Text>
                      <br />
                      <Text strong style={{ 
                        fontSize: '18px', 
                        color: isBalanceSufficient() ? '#1890ff' : '#ff4d4f' 
                      }}>
                        {walletBalance.toLocaleString()} VND
                      </Text>
                    </div>
                  </Col>
                  <Col>
                    {isBalanceSufficient() ? (
                      <Tag color="green" style={{ fontSize: '14px' }}>
                        Sufficient Balance
                      </Tag>
                    ) : (
                      <Tag color="red" style={{ fontSize: '14px' }}>
                        Insufficient Balance
                      </Tag>
                    )}
                  </Col>
                </Row>
              </Card>
            </Col>

            {!isBalanceSufficient() && (
              <Col span={24}>
                <Alert
                  message="Insufficient Balance"
                  description={`You need ${(selectedPenalty.amount - walletBalance).toLocaleString()} VND more to pay this penalty. Please top up your wallet first.`}
                  type="error"
                  showIcon
                  icon={<WarningOutlined />}
                  action={
                    <Button
                      size="small"
                      onClick={() => navigate('/top-up')}
                      style={{
                        background: '#ff4d4f',
                        border: 'none',
                        color: 'white'
                      }}
                    >
                      Top Up Wallet
                    </Button>
                  }
                />
              </Col>
            )}
          </Row>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
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
                Back
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={handleConfirmPayment}
                disabled={!isBalanceSufficient()}
                style={{
                  borderRadius: '12px',
                  background: isBalanceSufficient() ? 
                    'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)' : 
                    '#d9d9d9',
                  border: 'none',
                  height: 48,
                  padding: '0 32px',
                  fontWeight: 'bold'
                }}
              >
                Confirm Payment
              </Button>
            </Space>
          </div>
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
        title="Payment Successful!"
        subTitle={`Penalty fee of ${selectedPenalty?.amount?.toLocaleString()} VND has been paid successfully`}
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
                <Text type="secondary">Payment ID:</Text>
              </Col>
              <Col span={16}>
                <Text strong>{paymentResult?.paymentId}</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Amount Paid:</Text>
              </Col>
              <Col span={16}>
                <Text strong>{paymentResult?.amount?.toLocaleString()} VND</Text>
              </Col>
              <Col span={8}>
                <Text type="secondary">Remaining Balance:</Text>
              </Col>
              <Col span={16}>
                <Text strong>{paymentResult?.remainingBalance?.toLocaleString()} VND</Text>
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
        return renderPenaltySelection();
      case 1:
        return renderConfirmation();
      case 2:
        return renderSuccess();
      default:
        return renderPenaltySelection();
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Select Penalty';
      case 1:
        return 'Confirm Payment';
      case 2:
        return 'Payment Success';
      default:
        return 'Penalty Payment';
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
                      <ExclamationCircleOutlined style={{ marginRight: '8px', color: '#fa8c16' }} />
                      Penalty Payment
                    </Title>
                    <Text type="secondary">
                      Pay your pending penalty fees
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

        {/* Confirmation Modal */}
        <Modal
          title="Confirm Payment"
          open={showConfirmation}
          onCancel={() => setShowConfirmation(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowConfirmation(false)}>
              Cancel
            </Button>,
            <Button
              key="confirm"
              type="primary"
              onClick={handleProcessPayment}
              loading={loading}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              Confirm Payment
            </Button>
          ]}
        >
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Avatar
              size={64}
              icon={<ExclamationCircleOutlined />}
              style={{ 
                background: '#fa8c16',
                marginBottom: '16px'
              }}
            />
            <Title level={4}>Are you sure?</Title>
            <Text>
              You are about to pay <Text strong>{selectedPenalty?.amount?.toLocaleString()} VND</Text> for the penalty fee.
            </Text>
            <br />
            <Text type="secondary">
              This action cannot be undone.
            </Text>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default PenaltyPaymentPage;
