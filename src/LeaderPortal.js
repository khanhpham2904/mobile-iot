import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { kitAPI, borrowingGroupAPI, studentGroupAPI, walletAPI, borrowingRequestAPI, walletTransactionAPI, penaltiesAPI, penaltyDetailAPI, notificationAPI, authAPI } from './api';
import dayjs from 'dayjs';
import {
  Layout,
  Menu,
  Card,
  Table,
  Button,
  Input,
  Select,
  Modal,
  Form,
  message,
  Tag,
  Row,
  Col,
  Statistic,
  Typography,
  Space, 
  Avatar, 
  Badge, 
  Divider, 
  List, 
  Switch, 
  DatePicker, 
  Drawer, 
  Descriptions, 
  Empty, 
  Spin, 
  Popover,
  notification
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  ShoppingOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  UploadOutlined,
  BellOutlined,
  DollarOutlined,
  BuildOutlined,
  InfoCircleOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LoadingOutlined,
  RollbackOutlined,
  WalletOutlined,
  CrownOutlined
} from '@ant-design/icons';

// Default wallet structure for when API returns empty/null
const defaultWallet = { balance: 0, transactions: [] };

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Helper functions accessible to all components
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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

const formatDateTimeDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = dayjs(dateString);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'available':
    case 'approved':
    case 'active':
      return 'success';
    case 'pending_approval':
    case 'pending':
    case 'in progress':
      return 'warning';
    case 'rejected':
    case 'damaged':
    case 'missing':
    case 'suspended':
      return 'error';
    case 'in-use':
    case 'borrowed':
      return 'processing';
    default:
      return 'default';
  }
};

function LeaderPortal({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [kits, setKits] = useState([]);
  const [group, setGroup] = useState(null);
  const [wallet, setWallet] = useState(defaultWallet);
  const [borrowingRequests, setBorrowingRequests] = useState([]);
  const [penalties, setPenalties] = useState([]);
  const [penaltyDetails, setPenaltyDetails] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Modal states
  
  // State for kit detail modal
  const [kitDetailModalVisible, setKitDetailModalVisible] = useState(false);
  const [selectedKitDetail, setSelectedKitDetail] = useState(null);
  const [kitDetailModalType, setKitDetailModalType] = useState('kit-rental'); // 'kit-rental' or 'component-rental'
  const [componentQuantities, setComponentQuantities] = useState({}); // Store quantities for each component
  
  // State for rent component modal
  const [rentComponentModalVisible, setRentComponentModalVisible] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [componentQuantity, setComponentQuantity] = useState(1);
  const [componentExpectReturnDate, setComponentExpectReturnDate] = useState(null);
  const [componentReason, setComponentReason] = useState('');
  

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


  useEffect(() => {
    console.log('===== LeaderPortal useEffect triggered =====');
    console.log('User object:', user);
    console.log('User id:', user?.id);
    console.log('User email:', user?.email);
    
    if (user && user.id) {
      console.log('User exists, calling loadData...');
    loadData();
    } else {
      console.warn('User is null or user.id is missing');
      setLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    console.log('===== loadData function called =====');
    console.log('User in loadData:', user);
    console.log('User id in loadData:', user?.id);
    
    if (!user || !user.id) {
      console.warn('User or user.id is missing, cannot load data');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      console.log('===== Starting to load data =====');
      console.log('User info:', user);
      
      // Load student kits
      try {
        const kitsResponse = await kitAPI.getStudentKits();
        console.log('Student kits response:', kitsResponse);
        
        // Map KitResponse array from backend
        const kitsData = kitsResponse?.data || kitsResponse || [];
        const mappedKits = kitsData.map(kit => ({
          id: kit.id,
          name: kit.kitName,
          type: kit.type,
          status: kit.status,
          description: kit.description,
          imageUrl: kit.imageUrl,
          quantityTotal: kit.quantityTotal,
          quantityAvailable: kit.quantityAvailable,
          amount: kit.amount || 0,
          components: kit.components || []
        }));
        
        console.log('Mapped kits:', mappedKits);
        setKits(mappedKits);
      } catch (error) {
        console.error('Error loading kits:', error);
        setKits([]);
      }
      
      // Load wallet
      try {
        const walletResponse = await walletAPI.getMyWallet();
        console.log('Wallet response:', walletResponse);
        // Map wallet response to match expected structure
        const walletData = walletResponse?.data || walletResponse || {};
        setWallet({
          balance: walletData.balance || 0,
          transactions: walletData.transactions || []
        });
      } catch (error) {
        console.error('Error loading wallet:', error);
        setWallet(defaultWallet);
      }
      
      // Load penalties
      try {
        const penaltiesResponse = await penaltiesAPI.getPenByAccount();
        console.log('Penalties response:', penaltiesResponse);
        
        let penaltiesData = [];
        if (Array.isArray(penaltiesResponse)) {
          penaltiesData = penaltiesResponse;
        } else if (penaltiesResponse && penaltiesResponse.data && Array.isArray(penaltiesResponse.data)) {
          penaltiesData = penaltiesResponse.data;
        }
        
        setPenalties(penaltiesData);
        
        // Load penalty details for each penalty
        if (penaltiesData.length > 0) {
          const detailsPromises = penaltiesData.map(async (penalty) => {
            try {
              const detailsResponse = await penaltyDetailAPI.findByPenaltyId(penalty.id);
              let detailsData = [];
              if (Array.isArray(detailsResponse)) {
                detailsData = detailsResponse;
              } else if (detailsResponse && detailsResponse.data && Array.isArray(detailsResponse.data)) {
                detailsData = detailsResponse.data;
              }
              return { penaltyId: penalty.id, details: detailsData };
            } catch (error) {
              console.error(`Error loading penalty details for penalty ${penalty.id}:`, error);
              return { penaltyId: penalty.id, details: [] };
            }
          });
          
          const allDetails = await Promise.all(detailsPromises);
          const detailsMap = {};
          allDetails.forEach(({ penaltyId, details }) => {
            detailsMap[penaltyId] = details;
          });
          setPenaltyDetails(detailsMap);
        }
      } catch (error) {
        console.error('Error loading penalties:', error);
        setPenalties([]);
      }
      
      // Load group info from borrowing group API
      try {
        let groupId = user?.borrowingGroupInfo?.groupId;
        
        console.log('Initial groupId from user.borrowingGroupInfo:', groupId);
        console.log('User object:', user);
        
        // If no groupId from user info, try to get it from borrowing groups
        if (!groupId && user.id) {
          console.log('No groupId in user info, trying to get from borrowing groups...');
          console.log('Calling borrowingGroupAPI.getByAccountId with user.id:', user.id);
          const borrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
          console.log('User borrowing groups response:', borrowingGroups);
          
          if (borrowingGroups && borrowingGroups.length > 0) {
            groupId = borrowingGroups[0].studentGroupId;
            console.log('Found groupId from borrowing groups:', groupId);
          } else {
            console.warn('No borrowing groups found for user');
          }
        }
        
        if (groupId) {
          console.log('Loading group info for groupId:', groupId);
          const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(groupId);
          console.log('Borrowing groups response:', borrowingGroups);
          
          // Get student group details
          const studentGroup = await studentGroupAPI.getById(groupId);
          console.log('Student group response:', studentGroup);
          
          if (studentGroup) {
            // Map borrowing groups to members
            const members = borrowingGroups.map(bg => ({
              name: bg.accountName || bg.accountEmail,
              email: bg.accountEmail,
              role: bg.roles
            }));
            
            const groupData = {
              id: studentGroup.id,
              name: studentGroup.groupName,
              leader: user.email,
              members: members.filter(m => m.role === 'MEMBER'),
              lecturer: studentGroup.lecturerEmail,
              lecturerName: studentGroup.lecturerName,
              classId: studentGroup.classId,
              status: studentGroup.status ? 'active' : 'inactive'
            };
            
            console.log('Processed group data:', groupData);
            setGroup(groupData);
          }
        } else {
          console.warn('No group found for user');
          setGroup(null);
        }
      } catch (error) {
        console.error('Error loading group info:', error);
        setGroup(null);
      }
      
      // Mock refund requests for now (can be replaced with API later)
      
      console.log('Leader data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      const response = await notificationAPI.getMyNotifications();
      const data = response?.data ?? response;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.id) {
      loadNotifications();
    }
  }, [user]);

  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

  const notificationTypeStyles = {
    ALERT: { color: 'volcano', label: 'Cảnh báo' },
    DEPOSIT: { color: 'green', label: 'Giao dịch ví' },
    SYSTEM: { color: 'blue', label: 'Hệ thống' },
    USER: { color: 'purple', label: 'Người dùng' }
  };

  const handleNotificationOpenChange = (open) => {
    setNotificationPopoverOpen(open);
    if (open) {
      loadNotifications();
    }
  };

  const renderNotificationContent = () => (
    <div style={{ width: 320 }}>
      <Spin spinning={notificationLoading}>
        {notifications.length > 0 ? (
          <List
            rowKey={(item) => item.id || item.title}
            dataSource={notifications}
            renderItem={(item) => {
              const typeInfo = notificationTypeStyles[item.type] || { color: 'blue', label: item.type };
              const notificationDate = item.createdAt ? formatDateTimeDisplay(item.createdAt) : 'N/A';
              return (
                <List.Item style={{ alignItems: 'flex-start' }}>
                  <List.Item.Meta
                    title={
                      <Space size={8} align="start">
                        <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                        <Text strong>{item.title || item.subType}</Text>
                      </Space>
                    }
                    description={
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Text type="secondary">{item.message}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {notificationDate}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty description="Không có thông báo" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Spin>
    </div>
  );

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'group',
      icon: <TeamOutlined />,
      label: 'Group Management',
    },
    {
      key: 'kits',
      icon: <ToolOutlined />,
      label: 'Kit Rental',
    },
    {
      key: 'kit-component-rental',
      icon: <BuildOutlined />,
      label: 'Kit Component Rental',
    },
    {
      key: 'borrow-tracking',
      icon: <EyeOutlined />,
      label: 'Borrow Tracking',
    },
    {
      key: 'wallet',
      icon: <WalletOutlined />,
      label: 'Wallet',
    },
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
  ];

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };

  const handleViewKitDetail = (kit, modalType = 'kit-rental') => {
    setSelectedKitDetail(kit);
    setKitDetailModalType(modalType);
    setKitDetailModalVisible(true);
  };
  
  const handleComponentQuantityChange = (componentId, quantity) => {
    setComponentQuantities(prev => ({
      ...prev,
      [componentId]: quantity
    }));
  };

  const handleCloseKitDetailModal = () => {
    setKitDetailModalVisible(false);
    setSelectedKitDetail(null);
    setComponentQuantities({});
  };

  const handleRentComponent = (component) => {
    // If component has rentQuantity, use it; otherwise default to 1
    const qty = component.rentQuantity || componentQuantity || 1;
    setSelectedComponent(component);
    setComponentQuantity(qty);
    setRentComponentModalVisible(true);
  };

  const handleCloseRentComponentModal = () => {
    setRentComponentModalVisible(false);
    setSelectedComponent(null);
    setComponentQuantity(1);
    setComponentExpectReturnDate(null);
    setComponentReason('');
  };

  const handleConfirmRentComponent = async () => {
    if (!selectedComponent || componentQuantity <= 0) {
      message.error('Please enter a valid quantity');
      return;
    }

    if (componentQuantity > selectedComponent.quantityAvailable) {
      message.error('Quantity exceeds available amount');
      return;
    }

    if (!componentExpectReturnDate) {
      message.error('Please select expected return date');
      return;
    }

    if (!componentReason || componentReason.trim() === '') {
      message.error('Please provide a reason for renting this component');
      return;
    }

    // Check if wallet has enough balance for deposit
    const depositAmount = (selectedComponent.pricePerCom || 0) * componentQuantity;
    if (wallet.balance < depositAmount) {
      message.error(`Insufficient wallet balance. You need ${depositAmount.toLocaleString()} VND but only have ${wallet.balance.toLocaleString()} VND. Please top up your wallet.`);
      return;
    }

    try {
      const requestData = {
        kitComponentsId: selectedComponent.id,
        componentName: selectedComponent.componentName,
        quantity: componentQuantity,
        reason: componentReason,
        depositAmount: depositAmount,
        expectReturnDate: componentExpectReturnDate
      };
      
      console.log('Component request data:', requestData);
      
      const response = await borrowingRequestAPI.createComponentRequest(requestData);
      
      if (response) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REQUEST',
              title: 'Đã gửi yêu cầu thuê linh kiện',
              message: `Bạn đã gửi yêu cầu thuê ${selectedComponent.componentName} x${componentQuantity}.`
            },
            {
              subType: 'BORROW_REQUEST_CREATED',
              title: 'Yêu cầu mượn linh kiện mới',
              message: `${user?.fullName || user?.email || 'Thành viên'} đã gửi yêu cầu thuê ${selectedComponent.componentName} x${componentQuantity}.`
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending notifications:', notifyError);
        }
        message.success('Component rental request created successfully! Waiting for admin approval.');
        handleCloseRentComponentModal();
      }
    } catch (error) {
      console.error('Error creating component request:', error);
      const errorMessage = error.message || 'Unknown error';
      
      // Check if it's an insufficient balance error
      if (errorMessage.includes('Insufficient wallet balance') || errorMessage.includes('balance')) {
        message.error({
          content: errorMessage,
          duration: 5,
        });
        notification.error({
          message: 'Insufficient Balance',
          description: errorMessage,
          placement: 'topRight',
          duration: 5,
        });
        
        // Create notification in database for insufficient balance
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_FAILED_INSUFFICIENT_BALANCE',
              title: 'Số dư không đủ',
              message: `Không thể thuê ${selectedComponent.componentName} do số dư ví không đủ. ${errorMessage}`
            }
          ]);
        } catch (notifyError) {
          console.error('Error creating insufficient balance notification:', notifyError);
        }
      } else {
        message.error('Failed to create component request: ' + errorMessage);
      }
    }
  };


  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          position: 'fixed',
          height: '100vh',
          zIndex: 1000,
          left: 0,
          top: 0,
          borderRight: '1px solid rgba(255,255,255,0.2)'
        }}
      >
        {/* Logo Section */}
        <motion.div 
          style={{ 
            height: 80, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            margin: '16px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Title level={4} style={{ margin: 0, color: '#fff', fontWeight: 'bold' }}>
            {collapsed ? 'LDR' : 'Leader Portal'}
          </Title>
        </motion.div>
        
        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            background: 'transparent',
            padding: '0 16px'
          }}
          className="custom-menu"
        />
      </Sider>
      
      {/* Main Content Area */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 200, 
        transition: 'margin-left 0.3s ease-in-out',
        background: 'transparent'
      }}>
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
            {/* Left Section */}
            <Space size="large">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="text"
                  icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setCollapsed(!collapsed)}
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
                key={selectedKey}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Title level={2} style={{ margin: 0, color: '#2c3e50', fontWeight: 'bold' }}>
                  {menuItems.find(item => item.key === selectedKey)?.label}
                </Title>
              </motion.div>
            </Space>
            
            {/* Right Section */}
            <Space size="large">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Popover
                  trigger="click"
                  placement="bottomRight"
                  open={notificationPopoverOpen}
                  onOpenChange={handleNotificationOpenChange}
                  content={renderNotificationContent()}
                >
                  <Badge count={unreadNotificationsCount} size="small" overflowCount={99}>
                    <div style={{
                      padding: '12px',
                      borderRadius: '12px',
                      background: 'rgba(102, 126, 234, 0.1)',
                      color: '#667eea',
                      fontSize: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}>
                      <BellOutlined />
                    </div>
                  </Badge>
                </Popover>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Avatar 
                  icon={<CrownOutlined />} 
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
                  onClick={onLogout}
                  style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    height: 40,
                    padding: '0 20px',
                    fontWeight: 'bold'
                  }}
                >
                  Logout
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
            tip="Loading data..."
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
                key={selectedKey}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                {selectedKey === 'dashboard' && <DashboardContent group={group} wallet={wallet} kits={kits} penalties={penalties} penaltyDetails={penaltyDetails} />}
                {selectedKey === 'group' && <GroupManagement group={group} />}
                {selectedKey === 'kits' && <KitRental kits={kits} user={user} onViewKitDetail={(kit) => handleViewKitDetail(kit, 'kit-rental')} />}
                {selectedKey === 'kit-component-rental' && <KitComponentRental kits={kits} user={user} onViewKitDetail={(kit) => handleViewKitDetail(kit, 'component-rental')} onRentComponent={handleRentComponent} />}
                {selectedKey === 'borrow-tracking' && <BorrowTracking borrowingRequests={borrowingRequests} setBorrowingRequests={setBorrowingRequests} user={user} />}
                {selectedKey === 'wallet' && <WalletManagement wallet={wallet} setWallet={setWallet} />}
                {selectedKey === 'profile' && <ProfileManagement profile={profile} setProfile={setProfile} loading={profileLoading} setLoading={setProfileLoading} user={user} />}
                {selectedKey === 'settings' && <Settings />}
              </motion.div>
            </AnimatePresence>
          </Spin>
        </Content>
      </Layout>

      {/* Rent Component Modal */}
      <Modal
        title="Rent Component"
        open={rentComponentModalVisible}
        onCancel={handleCloseRentComponentModal}
        footer={[
          <Button key="cancel" onClick={handleCloseRentComponentModal}>
            Cancel
          </Button>,
          <Button key="confirm" type="primary" onClick={handleConfirmRentComponent}>
            Confirm Rent
          </Button>
        ]}
      >
        {selectedComponent && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Component Name">
              <Text strong>{selectedComponent.componentName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="purple">{selectedComponent.componentType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Available">
              {selectedComponent.quantityAvailable || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Price per Unit">
              <Text strong style={{ color: '#1890ff' }}>
                {selectedComponent.pricePerCom?.toLocaleString() || '0'} VND
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">
              <Input
                type="number"
                min={1}
                max={selectedComponent.quantityAvailable}
                value={componentQuantity}
                onChange={(e) => setComponentQuantity(parseInt(e.target.value) || 1)}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Total Price">
              <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                {((selectedComponent.pricePerCom || 0) * componentQuantity).toLocaleString()} VND
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Expected Return Date">
              <DatePicker
                style={{ width: '100%' }}
                value={componentExpectReturnDate}
                onChange={(date) => setComponentExpectReturnDate(date)}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                showTime
              />
            </Descriptions.Item>
            <Descriptions.Item label="Reason">
              <TextArea
                rows={4}
                placeholder="Please provide reason for renting this component..."
                value={componentReason}
                onChange={(e) => setComponentReason(e.target.value)}
              />
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Kit Detail Modal */}
      <Modal
        title="Kit Details"
        open={kitDetailModalVisible}
        onCancel={handleCloseKitDetailModal}
        footer={[
          <Button key="close" onClick={handleCloseKitDetailModal}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedKitDetail && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="Kit Name" span={2}>
                <Text strong style={{ fontSize: '18px' }}>{selectedKitDetail.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{selectedKitDetail.type || 'N/A'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedKitDetail.status)}>
                  {selectedKitDetail.status || 'N/A'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Available">
                {selectedKitDetail.quantityAvailable || 0} / {selectedKitDetail.quantityTotal || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Amount">
                <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                  {selectedKitDetail.amount?.toLocaleString() || '0'} VND
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedKitDetail.description || 'No description'}
              </Descriptions.Item>
            </Descriptions>
            
            <Divider orientation="left">Kit Components</Divider>
            
            {selectedKitDetail.components && selectedKitDetail.components.length > 0 ? (
              <Table
                dataSource={selectedKitDetail.components}
                columns={[
                  {
                    title: 'Component Name',
                    dataIndex: 'componentName',
                    key: 'componentName',
                  },
                  {
                    title: 'Amount',
                    dataIndex: 'pricePerCom',
                    key: 'pricePerCom',
                    render: (pricePerCom) => (
                      <Text strong style={{ color: '#1890ff' }}>
                        {pricePerCom ? pricePerCom.toLocaleString() : '0'} VND
                      </Text>
                    )
                  },
                  {
                    title: 'Type',
                    dataIndex: 'componentType',
                    key: 'componentType',
                    render: (type) => <Tag color="purple">{type || 'N/A'}</Tag>
                  },
                  // Only show Available column for component-rental modal type
                  ...(kitDetailModalType === 'component-rental' ? [
                    {
                      title: 'Available',
                      dataIndex: 'quantityAvailable',
                      key: 'quantityAvailable',
                    }
                  ] : []),
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description',
                    ellipsis: true,
                  },
                  // Only show Quantity input and Actions column for component-rental modal type
                  ...(kitDetailModalType === 'component-rental' ? [
                    {
                      title: 'Rent Quantity',
                      key: 'rentQuantity',
                      render: (_, record) => (
                        <Input
                          type="number"
                          min={1}
                          max={record.quantityAvailable || 0}
                          value={componentQuantities[record.id] || 1}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            // Validate: ensure quantity doesn't exceed available
                            const validQty = Math.min(qty, record.quantityAvailable || 0);
                            handleComponentQuantityChange(record.id, validQty > 0 ? validQty : 1);
                          }}
                          onBlur={(e) => {
                            const qty = parseInt(e.target.value) || 1;
                            const available = record.quantityAvailable || 0;
                            if (qty > available) {
                              message.warning(`Quantity cannot exceed available amount (${available})`);
                              handleComponentQuantityChange(record.id, available);
                            }
                          }}
                          style={{ width: 80 }}
                        />
                      ),
                    },
                    {
                      title: 'Actions',
                      key: 'actions',
                      render: (_, record) => {
                        const qty = componentQuantities[record.id] || 1;
                        const available = record.quantityAvailable || 0;
                        const exceedsAvailable = qty > available;
                        const isSoldOut = available === 0;
                        return (
                          <Button 
                            size="small" 
                            type="primary"
                            onClick={() => {
                              if (qty > available) {
                                message.error(`Cannot rent ${qty} items. Only ${available} available.`);
                                return;
                              }
                              const componentWithQty = { ...record, rentQuantity: qty };
                              handleRentComponent(componentWithQty);
                            }}
                            disabled={!available || available === 0 || exceedsAvailable}
                          >
                            {isSoldOut ? 'Sold out' : 'Rent'}
                          </Button>
                        );
                      },
                    }
                  ] : []),
                ]}
                rowKey={(record, index) => record.id || index}
                pagination={false}
                size="small"
              />
            ) : (
              <Empty description="No components available" />
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}

// Dashboard Component
const DashboardContent = ({ group, wallet, kits, penalties, penaltyDetails }) => (
  <div>
    <Row gutter={[24, 24]}>
      {/* Group Stats */}
      <Col xs={24} sm={12} lg={6}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Group Members"
              value={group ? group.members.length + 1 : 0}
              prefix={<TeamOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Wallet Balance"
              value={wallet.balance || 0}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              suffix="VND"
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Available Kits"
              value={kits.filter(kit => kit.status === 'AVAILABLE').length}
              prefix={<ToolOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Active Rentals"
              value={2}
              prefix={<ShoppingOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
    </Row>

    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
      <Col xs={24} lg={12}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card 
            title="Group Information" 
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          >
            {group ? (
              <div>
                <Title level={4}>{group.name}</Title>
                <Text strong>Leader:</Text> {group.leader}<br />
                <Text strong>Members:</Text> {
                  group.members && group.members.length > 0
                    ? group.members.map((member) => {
                        // Handle both string and object formats
                        if (typeof member === 'string') {
                          return member;
                        } else {
                          return member.name || member.email || 'Unknown';
                        }
                      }).join(', ')
                    : 'No members'
                }<br />
                {group.lecturer && (
                  <>
                    <Text strong>Lecturer:</Text> {group.lecturer}
                  </>
                )}
              </div>
            ) : (
              <Empty description="No group information available" />
            )}
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} lg={12}>
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          whileHover="hover"
        >
          <Card 
            title="Recent Transactions" 
            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          >
            <List
              size="small"
              dataSource={(wallet.transactions || []).slice(0, 5)}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<DollarOutlined style={{ color: '#52c41a' }} />}
                    title={<span style={{
                      display: 'inline-block',
                      borderRadius: 8,
                      padding: '2px 14px',
                      fontSize: 13,
                      fontWeight: 600,
                      letterSpacing: 1,
                      background: item.type === 'TOP_UP' ? '#f6ffed' :
                                 item.type === 'RENTAL_FEE' ? '#e6f4ff' :
                                 item.type === 'PENALTY_PAYMENT' ? '#fff2f0' :
                                 item.type === 'REFUND' ? '#f6f0ff' : '#f2f2f2',
                      color: item.type === 'TOP_UP' ? '#389e0d' :
                             item.type === 'RENTAL_FEE' ? '#2f54eb' :
                             item.type === 'PENALTY_PAYMENT' ? '#cf1322' :
                             item.type === 'REFUND' ? '#722ed1' : '#333',
                      border: '1.5px solid ' + (
                        item.type === 'TOP_UP' ? '#b7eb8f' :
                        item.type === 'RENTAL_FEE' ? '#adc6ff' :
                        item.type === 'PENALTY_PAYMENT' ? '#ffccc7' :
                        item.type === 'REFUND' ? '#d3adf7' : '#fafafa'),
                    }}>
                      {item.type === 'TOP_UP' ? 'Nạp tiền' :
                       item.type === 'RENTAL_FEE' ? 'Thuê kit' :
                       item.type === 'PENALTY_PAYMENT' ? 'Thanh toán phạt' :
                       item.type === 'REFUND' ? 'Hoàn tiền' : item.type}
                    </span>}
                    description={item.date}
                  />
                  <div>{item.amount.toLocaleString()} VND</div>
                </List.Item>
              )}
            />
          </Card>
        </motion.div>
      </Col>
    </Row>

    {/* Penalties Section */}
    {penalties && penalties.length > 0 && (
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
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
                  <span>Penalties</span>
                </Space>
              }
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <List
                dataSource={penalties.filter(p => !p.resolved)}
                renderItem={(penalty) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<ExclamationCircleOutlined />}
                          style={{ backgroundColor: penalty.resolved ? '#52c41a' : '#fa8c16' }}
                        />
                      }
                      title={
                        <Space>
                          <Text strong>
                            {penalty.note || 'Penalty Fee'}
                          </Text>
                          {!penalty.resolved && (
                            <Tag color="error">Unresolved</Tag>
                          )}
                          {penalty.resolved && (
                            <Tag color="success">Resolved</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text>
                            Amount: <Text strong style={{ color: '#ff4d4f' }}>
                              {penalty.totalAmount ? penalty.totalAmount.toLocaleString() : 0} VND
                            </Text>
                          </Text>
                          {penalty.takeEffectDate && (
                            <Text type="secondary">
                              Date: {new Date(penalty.takeEffectDate).toLocaleString('vi-VN')}
                            </Text>
                          )}
                          {penaltyDetails[penalty.id] && penaltyDetails[penalty.id].length > 0 && (
                            <div style={{ marginTop: 8 }}>
                              <Text strong style={{ fontSize: 12 }}>Penalty Details:</Text>
                              {penaltyDetails[penalty.id].map((detail, idx) => (
                                <div key={idx} style={{ marginLeft: 16, marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    • {detail.description || 'N/A'}: {detail.amount ? detail.amount.toLocaleString() : 0} VND
                                  </Text>
                                </div>
                              ))}
                            </div>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>
    )}
  </div>
);

// Group Management Component
const GroupManagement = ({ group }) => {
  console.log('GroupManagement - group data:', group);
  
  return (
  <div>
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title="Group Management" 
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        {group ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card title="Group Details" size="small">
                <Descriptions column={1}>
                  <Descriptions.Item label="Group Name">{group.name}</Descriptions.Item>
                  <Descriptions.Item label="Leader">{group.leader}</Descriptions.Item>
                  <Descriptions.Item label="Total Members">{group.members.length + 1}</Descriptions.Item>
                  {group.lecturer && (
                    <Descriptions.Item label="Lecturer">{group.lecturer}</Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="Group Members" size="small">
                <List
                  size="small"
                  dataSource={group.members}
                  renderItem={(member, index) => {
                    // Handle both string (email) and object formats
                    const memberName = typeof member === 'string' ? member : (member.name || member.email);
                    const memberEmail = typeof member === 'string' ? member : member.email;
                    const memberRole = typeof member === 'string' ? 'MEMBER' : member.role;
                    
                    return (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar icon={<UserOutlined />} />}
                          title={memberName}
                          description={memberEmail}
                      />
                        <Tag color={memberRole === 'LEADER' ? 'gold' : 'blue'}>
                          {memberRole}
                        </Tag>
                    </List.Item>
                    );
                  }}
                />
              </Card>
            </Col>
          </Row>
        ) : (
          <Empty description="No group information available" />
        )}
      </Card>
    </motion.div>
  </div>
);
};

// Kit Rental Component
const KitRental = ({ kits, user, onViewKitDetail }) => {
  const navigate = useNavigate();

  const handleRent = (kit) => {
    console.log('Navigating to rental request with kit:', kit);
    navigate('/rental-request', { 
      state: { 
        kitId: kit.id, 
        user: user 
      } 
    });
  };

  return (
    <div>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card 
          title="Available Kits" 
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <Table
            dataSource={kits.filter(kit => kit.quantityAvailable > 0)}
            columns={[
              {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                render: (type) => (
                  <Tag color="blue">{type || 'N/A'}</Tag>
                ),
              },
            {
              title: 'Available',
              dataIndex: 'quantityAvailable',
              key: 'quantityAvailable',
              render: (available, record) => `${available}/${record.quantityTotal || 0}`,
            },
            {
              title: 'Amount',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount) => (amount !== undefined && amount !== null)
                ? `${Number(amount).toLocaleString()} VND`
                : '0 VND',
              align: 'right',
            },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
              render: (status) => {
                const colors = {
                  'AVAILABLE': 'success',
                  'BORROWED': 'warning',
                  'DAMAGED': 'error',
                  'MAINTENANCE': 'processing'
                };
                return <Tag color={colors[status] || 'default'}>{status}</Tag>;
              },
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
              width: 200,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                    <Button 
                    type="primary" 
                    size="small"
                    onClick={() => handleRent(record)}
                    disabled={record.quantityAvailable === 0}
                  >
                      Rent
                    </Button>
                    <Button 
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onViewKitDetail(record)}
                    >
                      Details
                    </Button>
                  </Space>
                ),
              },
            ]}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} kits`,
            }}
          />
        </Card>
      </motion.div>
    </div>
  );
};

// Kit Component Rental Component
const KitComponentRental = ({ kits, user, onViewKitDetail, onRentComponent }) => (
  <div>
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title="Available Kits for Component Rental" 
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Table
          dataSource={kits.filter(kit => kit.quantityAvailable > 0)}
          columns={[
            {
              title: 'Name',
              dataIndex: 'name',
              key: 'name',
            },
            {
              title: 'Type',
              dataIndex: 'type',
              key: 'type',
              render: (type) => (
                <Tag color="blue">{type || 'N/A'}</Tag>
              ),
            },
            {
              title: 'Available',
              dataIndex: 'quantityAvailable',
              key: 'quantityAvailable',
              render: (available, record) => `${available}/${record.quantityTotal || 0}`,
            },
            {
              title: 'Amount',
              dataIndex: 'amount',
              key: 'amount',
              render: (amount) => (amount !== undefined && amount !== null)
                ? `${Number(amount).toLocaleString()} VND`
                : '0 VND',
              align: 'right',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                const colors = {
                  'AVAILABLE': 'success',
                  'BORROWED': 'warning',
                  'DAMAGED': 'error',
                  'MAINTENANCE': 'processing'
                };
                return <Tag color={colors[status] || 'default'}>{status}</Tag>;
              },
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              ellipsis: true,
              width: 200,
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Button 
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => onViewKitDetail(record)}
                >
                  Details
                </Button>
              ),
            },
          ]}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} kits`,
          }}
        />
      </Card>
    </motion.div>
  </div>
);



// Refund Requests Component
const RefundRequests = ({ refundRequests, setRefundRequests, user }) => {
  const [newRefundModal, setNewRefundModal] = useState(false);
  const [refundForm] = Form.useForm();

  const handleNewRefund = () => {
    setNewRefundModal(true);
  };

  const handleRefundSubmit = (values) => {
    const newRefund = {
      id: Date.now(),
      kitName: values.kitName,
      requester: user?.email,
      requestDate: new Date().toISOString().split('T')[0],
      refundDate: values.refundDate,
      status: 'pending_approval'
    };
    
    setNewRefundModal(false);
    refundForm.resetFields();
    message.success('Refund request submitted successfully!');
  };

  return (
    <div>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card 
          title="Refund Tracking" 
          extra={
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleNewRefund}
            >
              New Refund Request
            </Button>
          }
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <Table
            dataSource={refundRequests}
            columns={[
              {
                title: 'Kit Name',
                dataIndex: 'kitName',
                key: 'kitName',
              },
              {
                title: 'Request Date',
                dataIndex: 'requestDate',
                key: 'requestDate',
                render: (date) => formatDate(date),
              },
              {
                title: 'Refund Date',
                dataIndex: 'refundDate',
                key: 'refundDate',
                render: (date) => formatDate(date),
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => (
                  <Tag color={getStatusColor(status)}>
                    {status.replace('_', ' ').toUpperCase()}
                  </Tag>
                ),
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button size="small">
                      Details
                    </Button>
                  </Space>
                ),
              },
            ]}
            rowKey="id"
          />
        </Card>
      </motion.div>

      {/* New Refund Request Modal */}
      <Modal
        title="New Refund Request"
        open={newRefundModal}
        onCancel={() => setNewRefundModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={refundForm}
          layout="vertical"
          onFinish={handleRefundSubmit}
        >
          <Form.Item
            name="kitName"
            label="Kit Name"
            rules={[{ required: true, message: 'Please select a kit' }]}
          >
            <Select placeholder="Select a kit">
              <Option value="Arduino Starter Kit">Arduino Starter Kit</Option>
              <Option value="Raspberry Pi Kit">Raspberry Pi Kit</Option>
              <Option value="IoT Sensor Kit">IoT Sensor Kit</Option>
              <Option value="ESP32 Development Kit">ESP32 Development Kit</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="refundDate"
            label="Refund Date"
            rules={[{ required: true, message: 'Please select refund date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              placeholder="Select refund date"
            />
          </Form.Item>


          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Request
              </Button>
              <Button onClick={() => setNewRefundModal(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

// Wallet Management Component
const WalletManagement = ({ wallet, setWallet }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      const response = await walletTransactionAPI.getHistory();
      console.log('Transaction history response:', response);
      
      // Handle response format
      let transactionsData = [];
      if (Array.isArray(response)) {
        transactionsData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        transactionsData = response.data;
      }
      
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = () => {
    navigate('/top-up');
  };

  const handlePayPenalties = () => {
    navigate('/penalty-payment');
  };

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <Statistic
                title="Current Balance"
                value={wallet.balance || 0}
                prefix={<DollarOutlined />}
                suffix="VND"
                valueStyle={{ color: 'white', fontWeight: 'bold' }}
              />
              <Space direction="vertical" style={{ width: '100%', marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  onClick={handleTopUp}
                  style={{ 
                    width: '100%',
                    background: 'rgba(255,255,255,0.2)',
                    border: '1px solid rgba(255,255,255,0.3)'
                  }}
                >
                  Top Up
                </Button>
                <Button 
                  onClick={handlePayPenalties}
                  style={{ 
                    width: '100%',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white'
                  }}
                >
                  Pay Penalties
                </Button>
              </Space>
            </Card>
          </motion.div>
        </Col>
        
        <Col xs={24} md={16}>
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
          >
            <Card 
              title="Transaction History" 
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={loadTransactionHistory}
                  loading={loading}
                >
                  Refresh
                </Button>
              }
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <Spin spinning={loading}>
                <Table
                  dataSource={transactions}
                  columns={[
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      render: (type) => {
                        // Mapping type sang thông tin theme
                        let config = {
                          label: type || 'Khác',
                          color: 'default',
                          icon: null,
                          bg: '#f6f6f6',
                          border: '1.5px solid #e0e0e0',
                          text: '#333'
                        };
                        switch ((type||'').toUpperCase()) {
                          case 'TOP_UP':
                          case 'TOPUP':
                            config = { label: 'Nạp tiền', color: 'success', icon: <DollarOutlined />, bg: '#e8f8ee', border: '1.5px solid #52c41a', text:'#2a8731'}; break;
                          case 'RENTAL_FEE':
                            config = { label: 'Thuê kit', color: 'geekblue', icon: <ShoppingOutlined />, bg: '#e6f7ff', border: '1.5px solid #177ddc', text:'#177ddc' }; break;
                          case 'PENALTY_PAYMENT':
                          case 'PENALTY':
                          case 'FINE':
                            config = { label: 'Phí phạt', color: 'error', icon: <ExclamationCircleOutlined />, bg: '#fff1f0', border:'1.5px solid #ff4d4f', text:'#d4001a'}; break;
                          case 'REFUND':
                            config = { label: 'Hoàn tiền', color:'purple', icon: <RollbackOutlined />, bg:'#f9f0ff', border:'1.5px solid #722ed1', text:'#722ed1' }; break;
                          default:
                            config = { label: type || 'Khác', color:'default', icon:<InfoCircleOutlined/>, bg:'#fafafa', border:'1.5px solid #bfbfbf', text:'#595959'};
                        }
                        return <Tag color={config.color} style={{background: config.bg, border:config.border, color:config.text,fontWeight:'bold', display:'flex', alignItems:'center', gap:4, fontSize:13, letterSpacing:1}}>
                          {config.icon} <span>{config.label}</span>
                        </Tag>;
                      }
                    },
                    {
                      title: 'Amount',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amount) => (
                        <Text strong style={{ 
                          color: amount > 0 ? '#52c41a' : '#ff4d4f' 
                        }}>
                          {amount ? amount.toLocaleString() : 0} VND
                        </Text>
                      ),
                    },
                    {
                      title: 'Description',
                      dataIndex: 'description',
                      key: 'description',
                      render: (description) => description || 'N/A',
                    },
                    {
                      title: 'Date',
                      dataIndex: 'createdAt',
                      key: 'date',
                      render: (date) => {
                        if (!date) return 'N/A';
                        return new Date(date).toLocaleString('vi-VN');
                      },
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => {
                        const statusColor = status === 'COMPLETED' || status === 'SUCCESS' ? 'success' :
                                          status === 'PENDING' ? 'processing' :
                                          status === 'FAILED' ? 'error' : 'default';
                        return (
                          <Tag color={statusColor}>
                            {status || 'N/A'}
                          </Tag>
                        );
                      },
                    },
                  ]}
                  rowKey={(record, index) => record.id || record.transactionId || index}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} transactions`,
                  }}
                  locale={{ emptyText: 'No transactions found' }}
                />
              </Spin>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

// Settings Component
const Settings = () => (
  <div>
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <Card 
        title="Settings" 
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Notifications" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Email Notifications</Text>
                  <Switch defaultChecked style={{ marginLeft: '16px' }} />
                </div>
                <div>
                  <Text>Push Notifications</Text>
                  <Switch defaultChecked style={{ marginLeft: '16px' }} />
                </div>
                <div>
                  <Text>Rental Alerts</Text>
                  <Switch defaultChecked style={{ marginLeft: '16px' }} />
                </div>
              </Space>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Privacy" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Show Profile to Members</Text>
                  <Switch defaultChecked style={{ marginLeft: '16px' }} />
                </div>
                <div>
                  <Text>Allow Direct Messages</Text>
                  <Switch defaultChecked style={{ marginLeft: '16px' }} />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </motion.div>
  </div>
);

// Borrow Tracking Component
const BorrowTracking = ({ borrowingRequests, setBorrowingRequests, user }) => {
  const [loading, setLoading] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchBorrowingRequests();
    }
  }, [user?.id]);

  const fetchBorrowingRequests = async () => {
    setLoading(true);
    try {
      if (!user || !user.id) {
        console.error('User or user ID is missing');
        setBorrowingRequests([]);
        return;
      }
      const requests = await borrowingRequestAPI.getByUser(user.id);
      console.log('Borrowing requests for user:', requests);
      setBorrowingRequests(requests || []);
    } catch (error) {
      console.error('Error fetching borrowing requests:', error);
      message.error('Failed to load borrowing requests');
    } finally {
      setLoading(false);
    }
  };

  const showRequestDetails = (request) => {
    setSelectedRequest(request);
    setDetailDrawerVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
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

  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text code>{id?.substring(0, 8)}...</Text>
    },
    {
      title: 'Kit Name',
      dataIndex: ['kit', 'kitName'],
      key: 'kitName',
      render: (kitName) => kitName || 'N/A'
    },
    {
      title: 'Request Type',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (type) => (
        <Tag color={type === 'BORROW_KIT' ? 'blue' : 'purple'}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Expected Return Date',
      dataIndex: 'expectReturnDate',
      key: 'expectReturnDate',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showRequestDetails(record)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card 
          title="Borrow Tracking" 
          extra={
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchBorrowingRequests}
              loading={loading}
            >
              Refresh
            </Button>
          }
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <Table
            columns={columns}
            dataSource={borrowingRequests}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </motion.div>

      {/* Request Details Drawer */}
      <Drawer
        title="Request Details"
        placement="right"
        width={600}
        onClose={() => setDetailDrawerVisible(false)}
        open={detailDrawerVisible}
      >
        {selectedRequest && (
          <div>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Request ID">
                <Text code>{selectedRequest.id}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Kit Name">
                <Text strong>{selectedRequest.kit?.kitName || 'N/A'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Request Type">
                <Tag color={selectedRequest.requestType === 'BORROW_KIT' ? 'blue' : 'purple'}>
                  {selectedRequest.requestType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedRequest.status)}>
                  {selectedRequest.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reason">
                {selectedRequest.reason || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Expected Return Date">
                {selectedRequest.expectReturnDate ? new Date(selectedRequest.expectReturnDate).toLocaleString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Deposit Amount">
                {selectedRequest.depositAmount ? `${selectedRequest.depositAmount.toLocaleString()} VND` : 'N/A'}
              </Descriptions.Item>
            </Descriptions>

            {selectedRequest.qrCode && (
              <div style={{ marginTop: '24px', textAlign: 'center' }}>
                <Title level={4}>QR Code</Title>
                <img 
                  src={`data:image/png;base64,${selectedRequest.qrCode}`} 
                  alt="QR Code"
                  style={{ maxWidth: '100%', border: '1px solid #d9d9d9', borderRadius: '8px' }}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
};

// Profile Management Component
const ProfileManagement = ({ profile, setProfile, loading, setLoading, user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      console.log('Profile response:', response);
      
      const profileData = response?.data || response;
      setProfile(profileData);
      
      // Set form values when profile is loaded
      if (profileData) {
        form.setFieldsValue({
          fullName: profileData.fullName || '',
          phone: profileData.phone || '',
          avatarUrl: profileData.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      message.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    if (profile) {
      form.setFieldsValue({
        fullName: profile.fullName || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatarUrl || '',
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
  };

  const handleSave = async (values) => {
    try {
      setSaving(true);
      const updateData = {
        fullName: values.fullName,
        phone: values.phone,
        avatarUrl: values.avatarUrl || null,
      };

      const response = await authAPI.updateProfile(updateData);
      console.log('Update profile response:', response);
      
      const updatedProfile = response?.data || response;
      setProfile(updatedProfile);
      setIsEditing(false);
      
      message.success('Profile updated successfully');
      
      // Reload profile to get latest data
      await loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        whileHover="hover"
      >
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>My Profile</span>
              {!isEditing ? (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              ) : (
                <Space>
                  <Button onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => form.submit()}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </Space>
              )}
            </div>
          }
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <Spin spinning={loading}>
            {profile ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={{
                  fullName: profile.fullName || '',
                  phone: profile.phone || '',
                  avatarUrl: profile.avatarUrl || '',
                }}
              >
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                      <Avatar
                        size={120}
                        src={profile.avatarUrl || null}
                        icon={!profile.avatarUrl && <UserOutlined />}
                        style={{
                          background: profile.avatarUrl ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: '4px solid rgba(102, 126, 234, 0.2)',
                        }}
                      />
                      {isEditing && (
                        <Form.Item
                          name="avatarUrl"
                          style={{ marginTop: 16, marginBottom: 0 }}
                        >
                          <Input
                            placeholder="Avatar URL"
                            prefix={<UploadOutlined />}
                          />
                        </Form.Item>
                      )}
                    </div>
                  </Col>
                  
                  <Col xs={24} md={16}>
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Account ID">
                        <Text code>{profile.id}</Text>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Email">
                        <Text strong>{profile.email || 'N/A'}</Text>
                        <Tag color="blue" style={{ marginLeft: 8 }}>Cannot be changed</Tag>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Full Name">
                        {isEditing ? (
                          <Form.Item
                            name="fullName"
                            rules={[{ required: true, message: 'Please enter your full name' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="Enter your full name" />
                          </Form.Item>
                        ) : (
                          <Text strong>{profile.fullName || 'N/A'}</Text>
                        )}
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Phone">
                        {isEditing ? (
                          <Form.Item
                            name="phone"
                            rules={[
                              { pattern: /^[0-9]{10,11}$/, message: 'Please enter a valid phone number' }
                            ]}
                            style={{ marginBottom: 0 }}
                          >
                            <Input placeholder="Enter your phone number" />
                          </Form.Item>
                        ) : (
                          <Text>{profile.phone || 'N/A'}</Text>
                        )}
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Student Code">
                        <Text>{profile.studentCode || 'N/A'}</Text>
                        <Tag color="orange" style={{ marginLeft: 8 }}>Cannot be changed</Tag>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Role">
                        <Tag color="purple">{profile.role || 'N/A'}</Tag>
                        <Tag color="orange" style={{ marginLeft: 8 }}>Cannot be changed</Tag>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Account Status">
                        <Tag color={profile.isActive ? 'success' : 'error'}>
                          {profile.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                      </Descriptions.Item>
                      
                      <Descriptions.Item label="Created At">
                        <Text>{profile.createdAt ? formatDateTimeDisplay(profile.createdAt) : 'N/A'}</Text>
                      </Descriptions.Item>
                    </Descriptions>
                  </Col>
                </Row>
              </Form>
            ) : (
              <Empty description="Failed to load profile" />
            )}
          </Spin>
        </Card>
      </motion.div>
    </div>
  );
};

export default LeaderPortal; 