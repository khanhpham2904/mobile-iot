import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Card,
  Table,
  Button,
  message,
  Tag,
  Row,
  Col,
  Statistic,
  Typography,
  Space,
  Avatar,
  Badge,
  List,
  Alert,
  Descriptions,
  Empty,
  Spin,
  Modal,
  Form,
  Input,
  Select,
  Divider
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LoadingOutlined,
  WalletOutlined,
  DollarOutlined,
  BellOutlined,
  PlusOutlined,
  UserAddOutlined,
  EditOutlined,
  CheckCircleOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { authAPI, borrowingGroupAPI, studentGroupAPI, walletAPI, walletTransactionAPI, classesAPI, userAPI } from './api';
import dayjs from 'dayjs';

// Default wallet structure
const defaultWallet = { balance: 0, transactions: [] };

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// Helper functions
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

const formatDateTimeDisplay = (dateString) => {
  if (!dateString) return 'N/A';
  const date = dayjs(dateString);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : 'N/A';
};

function MemberPortal({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState(null);
  const [wallet, setWallet] = useState(defaultWallet);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Group management states
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [joinGroupModalVisible, setJoinGroupModalVisible] = useState(false);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form] = Form.useForm();

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
    if (user && user.id) {
      loadData();
    }
  }, [user]);

  // Load lecturers and classes for create group form
  useEffect(() => {
    if (createGroupModalVisible) {
      loadLecturersAndClasses();
    }
  }, [createGroupModalVisible]);

  const loadLecturersAndClasses = async () => {
    try {
      // Load lecturers
      const lecturersData = await userAPI.getLecturers();
      setLecturers(lecturersData || []);

      // Load classes
      const classesData = await classesAPI.getAllClasses();
      const classOptions = (classesData || []).map(cls => ({
        value: cls.id,
        label: `${cls.classCode || cls.className || 'Unknown'} - ${cls.semester || 'N/A'}`,
        id: cls.id,
        classCode: cls.classCode,
        semester: cls.semester
      }));
      setClasses(classOptions);
    } catch (error) {
      console.error('Error loading lecturers and classes:', error);
      message.error('Failed to load lecturers and classes');
    }
  };

  // Group management functions
  const handleCreateGroup = async (values) => {
    try {
      if (!user || !user.id) {
        message.error('User information not available');
        return;
      }

      // Find lecturer by email
      const selectedLecturer = lecturers.find(l => l.email === values.lecturer);
      if (!selectedLecturer || !selectedLecturer.id) {
        message.error('Invalid lecturer selection');
        return;
      }

      // Create group using API
      const groupData = {
        groupName: values.name,
        classId: values.classId || null, // Class ID if available
        accountId: selectedLecturer.id, // Lecturer's account ID
        status: true
      };

      const response = await studentGroupAPI.create(groupData);
      
      if (response && response.id) {
        // After creating group, add the user as the leader
        try {
          const borrowingGroupData = {
            studentGroupId: response.id,
            accountId: user.id,
            roles: 'LEADER' // Creator becomes leader
          };
          
          await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
          
          message.success('Group created successfully! You are now the leader.');
          setCreateGroupModalVisible(false);
          form.resetFields();
          
          // Reload data to reflect changes
          await loadData();
        } catch (addMemberError) {
          console.error('Error adding user as leader:', addMemberError);
          message.warning('Group created but failed to add you as leader. Please contact admin.');
          setCreateGroupModalVisible(false);
          form.resetFields();
          await loadData();
        }
      } else {
        message.error('Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      message.error('Failed to create group: ' + (error.message || 'Unknown error'));
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      if (!user || !user.id) {
        message.error('User information not available');
        return;
      }
      
      // Check if group exists and has space
      const targetGroup = availableGroups.find(g => g.id === groupId);
      if (!targetGroup) {
        message.error('Group not found');
        return;
      }
      
      const currentMemberCount = targetGroup.members?.length || 0;
      const maxMembers = targetGroup.maxMembers || 4;
      
      if (currentMemberCount >= maxMembers) {
        message.error('Group is full');
        return;
      }
      
      // Join the group using API
      const borrowingGroupData = {
        studentGroupId: groupId,
        accountId: user.id,
        roles: 'MEMBER' // New members join as MEMBER
      };
      
      await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
      
      message.success('Successfully joined the group!');
      setJoinGroupModalVisible(false);
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error joining group:', error);
      const errorMessage = error.message || 'Failed to join group';
      
      if (errorMessage.includes('already a member')) {
        message.error('You are already a member of this group');
      } else {
        message.error(`Failed to join group: ${errorMessage}`);
      }
    }
  };

  const loadData = async () => {
    if (!user || !user.id) {
      console.warn('User or user.id is missing');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Load wallet
      try {
        const walletResponse = await walletAPI.getMyWallet();
        const walletData = walletResponse?.data || walletResponse || {};
        
        // Fetch transaction history separately
        let transactions = [];
        try {
          const transactionHistoryResponse = await walletTransactionAPI.getHistory();
          const transactionData = Array.isArray(transactionHistoryResponse) 
            ? transactionHistoryResponse 
            : (transactionHistoryResponse?.data || []);
          
          // Map transactions to expected format
          transactions = transactionData.map(txn => ({
            type: txn.type || txn.transactionType || 'UNKNOWN',
            amount: txn.amount || 0,
            date: txn.createdAt ? new Date(txn.createdAt).toLocaleDateString('vi-VN') : 'N/A',
            description: txn.description || '',
            status: txn.status || txn.transactionStatus || 'COMPLETED',
            id: txn.id
          }));
        } catch (txnError) {
          console.error('Error loading transaction history:', txnError);
          transactions = [];
        }
        
        setWallet({
          balance: walletData.balance || 0,
          transactions: transactions
        });
      } catch (error) {
        console.error('Error loading wallet:', error);
        setWallet(defaultWallet);
      }
      
      // Load group info from borrowing group API
      try {
        let groupId = user?.borrowingGroupInfo?.groupId;
        
        // If no groupId from user info, try to get it from borrowing groups
        if (!groupId && user.id) {
          const borrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
          if (borrowingGroups && borrowingGroups.length > 0) {
            groupId = borrowingGroups[0].studentGroupId;
          }
        }
        
        if (groupId) {
          // Get borrowing groups for this student group (all members)
          const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(groupId);
          
          // Get student group details
          const studentGroup = await studentGroupAPI.getById(groupId);
          
          if (studentGroup) {
            // Map borrowing groups to members
            const members = (borrowingGroups || []).map(bg => ({
              id: bg.accountId,
              name: bg.accountName || bg.accountEmail,
              email: bg.accountEmail,
              role: bg.roles
            }));
            
            // Find leader
            const leaderMember = members.find(member => (member.role || '').toUpperCase() === 'LEADER');
            
            const groupData = {
              id: studentGroup.id,
              name: studentGroup.groupName,
              leader: leaderMember ? (leaderMember.name || leaderMember.email) : 'N/A',
              leaderEmail: leaderMember?.email || null,
              members: members.filter(m => (m.role || '').toUpperCase() === 'MEMBER'),
              lecturer: studentGroup.lecturerEmail || null,
              lecturerName: studentGroup.lecturerName || null,
              classId: studentGroup.classId,
              status: studentGroup.status ? 'active' : 'inactive'
            };
            
            setGroup(groupData);
          } else {
            setGroup(null);
          }
        } else {
          setGroup(null);
        }
      } catch (error) {
        console.error('Error loading group info:', error);
        setGroup(null);
      }
      
      // Load available groups for joining (groups where user is not a member)
      try {
        const allGroups = await studentGroupAPI.getAll();
        const allGroupsData = Array.isArray(allGroups) ? allGroups : (allGroups?.data || []);
        
        // Filter out groups where user is already a member
        const userBorrowingGroups = await borrowingGroupAPI.getByAccountId(user.id);
        const userGroupIds = new Set(
          (userBorrowingGroups || []).map(bg => bg.studentGroupId)
        );
        
        // Get member counts for each group
        const groupsWithCounts = await Promise.all(
          allGroupsData
            .filter(g => !userGroupIds.has(g.id) && g.status) // Only active groups user is not in
            .map(async (g) => {
              try {
                const members = await borrowingGroupAPI.getByStudentGroupId(g.id);
                return {
                  id: g.id,
                  name: g.groupName,
                  lecturer: g.lecturerEmail,
                  lecturerName: g.lecturerName,
                  classId: g.classId,
                  members: members || [],
                  maxMembers: 4, // Default max members, can be adjusted
                  status: g.status ? 'active' : 'inactive'
                };
              } catch (err) {
                console.error(`Error loading members for group ${g.id}:`, err);
                return null;
              }
            })
        );
        
        setAvailableGroups(groupsWithCounts.filter(g => g !== null));
      } catch (error) {
        console.error('Error loading available groups:', error);
        setAvailableGroups([]);
      }
      
      console.log('Member data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'group', icon: <TeamOutlined />, label: 'Group Info' },
    { key: 'wallet', icon: <WalletOutlined />, label: 'Wallet' },
    { key: 'profile', icon: <UserOutlined />, label: 'Profile' },
  ];

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
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
            {collapsed ? 'MBR' : 'Member Portal'}
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
                <Badge count={1} size="small" style={{ cursor: 'pointer' }}>
                  <div style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    color: '#667eea',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <BellOutlined />
                  </div>
                </Badge>
              </motion.div>
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
                                 {selectedKey === 'dashboard' && <DashboardContent group={group} wallet={wallet} />}
                 {selectedKey === 'group' && <GroupInfo 
                   group={group} 
                   onCreateGroup={() => setCreateGroupModalVisible(true)}
                   onJoinGroup={() => setJoinGroupModalVisible(true)}
                   availableGroups={availableGroups}
                 />}
                 {selectedKey === 'wallet' && <WalletManagement wallet={wallet} />}
                 {selectedKey === 'profile' && <ProfileManagement profile={profile} setProfile={setProfile} loading={profileLoading} setLoading={setProfileLoading} user={user} />}
              </motion.div>
            </AnimatePresence>
          </Spin>
        </Content>
      </Layout>

      {/* Create Group Modal */}
      <Modal
        title="Create New Group"
        open={createGroupModalVisible}
        onCancel={() => setCreateGroupModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroup}
        >
          <Form.Item
            name="name"
            label="Group Name"
            rules={[{ required: true, message: 'Please enter group name' }]}
          >
            <Input placeholder="Enter group name" />
          </Form.Item>
          
          <Form.Item
            name="lecturer"
            label="Lecturer"
            rules={[{ required: true, message: 'Please select a lecturer' }]}
          >
            <Select placeholder="Select lecturer" loading={lecturers.length === 0}>
              {lecturers.map(lecturer => (
                <Select.Option key={lecturer.id || lecturer.email} value={lecturer.email}>
                  {lecturer.fullName || lecturer.email} {lecturer.email && `(${lecturer.email})`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="classId"
            label="Class"
            rules={[{ required: false, message: 'Please select a class (optional)' }]}
          >
            <Select placeholder="Select class (optional)" allowClear loading={classes.length === 0}>
              {classes.map(cls => (
                <Select.Option key={cls.id || cls.value} value={cls.id || cls.value}>
                  {cls.label || `${cls.classCode} - ${cls.semester}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateGroupModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Group
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        title="Join Existing Group"
        open={joinGroupModalVisible}
        onCancel={() => setJoinGroupModalVisible(false)}
        footer={null}
        width={800}
      >
        <div>
          <Text>Select a group to join:</Text>
          <Divider />
          <Row gutter={[16, 16]}>
            {availableGroups.map(group => (
              <Col xs={24} sm={12} key={group.id}>
                <Card 
                  hoverable
                  style={{ borderRadius: '12px' }}
                  actions={[
                    <Button 
                      type="primary" 
                      onClick={() => handleJoinGroup(group.id)}
                      disabled={group.members.length >= group.maxMembers}
                    >
                      {group.members.length >= group.maxMembers ? 'Full' : 'Join Group'}
                    </Button>
                  ]}
                >
                  <Card.Meta
                    title={group.name}
                    description={group.description}
                  />
                  <div style={{ marginTop: '12px' }}>
                    <Text type="secondary">
                      Members: {group.members.length}/{group.maxMembers}
                    </Text>
                    <br />
                    <Text type="secondary">
                      Lecturer: {group.lecturer}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
          
          {availableGroups.length === 0 && (
            <Empty description="No available groups to join" />
          )}
        </div>
      </Modal>
      
    </Layout>
  );
}

// Dashboard Component
const DashboardContent = ({ group, wallet }) => (
  <div>
    <Row gutter={[24, 24]}>
      <Col xs={24} sm={12} lg={6}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="My Group"
              value={group ? (group.name.length > 15 ? group.name.substring(0, 15) + '...' : group.name) : 'No Group'}
              prefix={<TeamOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Group Members"
              value={group ? (group.members?.length || 0) + 1 : 0}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Wallet Balance"
              value={wallet?.balance || 0}
              prefix={<DollarOutlined style={{ color: '#722ed1' }} />}
              suffix="VND"
              valueStyle={{ color: '#722ed1', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} sm={12} lg={6}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Statistic
              title="Transactions"
              value={wallet?.transactions?.length || 0}
              prefix={<DollarOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16', fontWeight: 'bold' }}
            />
          </Card>
        </motion.div>
      </Col>
    </Row>

    <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
      <Col xs={24} lg={12}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card title="Group Information" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            {group ? (
              <Descriptions column={1}>
                <Descriptions.Item label="Group Name">
                  <Text strong>{group.name}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Leader">
                  <Tag color="gold">{group.leader}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Members">
                  <Badge count={(group.members?.length || 0) + 1} showZero color="#52c41a" />
                </Descriptions.Item>
                <Descriptions.Item label="Members">
                  {group.members && group.members.length > 0 ? (
                    <div>
                      {group.members.map((member, index) => {
                        const memberName = typeof member === 'string' ? member : (member.name || member.email);
                        return (
                          <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                            {memberName}
                          </Tag>
                        );
                      })}
                    </div>
                  ) : (
                    <Text type="secondary">No other members</Text>
                  )}
                </Descriptions.Item>
                {group.lecturer && (
                  <Descriptions.Item label="Lecturer">
                    <Tag color="purple">{group.lecturer}</Tag>
                  </Descriptions.Item>
                )}
                {group.classId && (
                  <Descriptions.Item label="Class ID">
                    <Text code>{group.classId}</Text>
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Status">
                  <Tag color={group.status === 'active' ? 'success' : 'error'}>
                    {group.status || 'inactive'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Empty description="No group found for this member" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} lg={12}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card title="Recent Transactions" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            {wallet?.transactions && wallet.transactions.length > 0 ? (
              <List
                size="small"
                dataSource={wallet.transactions.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<DollarOutlined style={{ color: item.amount > 0 ? '#52c41a' : '#ff4d4f' }} />}
                      title={
                        <Tag color={
                          item.type === 'TOP_UP' ? 'success' :
                          item.type === 'RENTAL_FEE' ? 'processing' :
                          item.type === 'PENALTY_PAYMENT' ? 'error' :
                          item.type === 'REFUND' ? 'purple' : 'default'
                        }>
                          {item.type?.replace(/_/g, ' ') || 'Transaction'}
                        </Tag>
                      }
                      description={item.date || item.description}
                    />
                    <div style={{ 
                      color: item.amount > 0 ? '#52c41a' : '#ff4d4f',
                      fontWeight: 'bold'
                    }}>
                      {item.amount > 0 ? '+' : ''}{item.amount?.toLocaleString() || 0} VND
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No transactions yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
          </Card>
        </motion.div>
      </Col>
    </Row>
  </div>
);

// Group Info Component
const GroupInfo = ({ group, onCreateGroup, onJoinGroup, availableGroups }) => (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card title="Group Information" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            {group ? (
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <Card title="Basic Info" size="small">
                    <Descriptions column={1} bordered>
                      <Descriptions.Item label="Group Name">
                        <Text strong>{group.name}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Leader">
                        <Tag color="gold">{group.leader}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Members">
                        <Badge count={(group.members?.length || 0) + 1} showZero color="#52c41a" />
                      </Descriptions.Item>
                      {group.lecturer && (
                        <Descriptions.Item label="Lecturer">
                          <Tag color="purple">{group.lecturer}</Tag>
                        </Descriptions.Item>
                      )}
                      {group.classId && (
                        <Descriptions.Item label="Class ID">
                          <Text code>{group.classId}</Text>
                        </Descriptions.Item>
                      )}
                      <Descriptions.Item label="Status">
                        <Tag color={group.status === 'active' ? 'success' : 'error'}>
                          {group.status || 'inactive'}
                        </Tag>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="Members" size="small">
                    <List
                      size="small"
                      dataSource={[
                        ...(group.members || []),
                        ...(group.leader ? [{ name: group.leader, email: group.leaderEmail, role: 'LEADER' }] : [])
                      ]}
                      renderItem={(member) => {
                        const memberName = typeof member === 'string' ? member : (member.name || member.email);
                        const memberEmail = typeof member === 'string' ? member : member.email;
                        const memberRole = typeof member === 'string' ? 'MEMBER' : (member.role || 'MEMBER');
                        const isLeader = memberRole === 'LEADER';
                        
                        return (
                          <List.Item>
                            <List.Item.Meta
                              avatar={
                                <Avatar 
                                  icon={<UserOutlined />} 
                                  style={{ backgroundColor: isLeader ? '#faad14' : '#52c41a' }}
                                >
                                  {isLeader ? 'L' : 'M'}
                                </Avatar>
                              }
                              title={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span>{memberName}</span>
                                  <Tag color={isLeader ? 'gold' : 'blue'} size="small">
                                    {memberRole}
                                  </Tag>
                                </div>
                              }
                              description={memberEmail || 'Group Member'}
                            />
                          </List.Item>
                        );
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            ) : (
          <div>
            <Alert 
              message="No Group Found" 
              description="You are not assigned to any group yet. You can create a new group or join an existing one."
              type="warning" 
              showIcon 
              style={{ marginBottom: '24px' }}
            />
            
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    hoverable
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}
                    onClick={onCreateGroup}
                  >
                    <PlusOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                    <Title level={4} style={{ color: 'white', margin: 0 }}>Create New Group</Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Start your own project group and become the leader
                    </Text>
                  </Card>
                </motion.div>
              </Col>
              
              <Col xs={24} sm={12}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card 
                    hoverable
                    style={{ 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      color: 'white',
                      textAlign: 'center'
                    }}
                    onClick={onJoinGroup}
                  >
                    <UserAddOutlined style={{ fontSize: '32px', marginBottom: '12px' }} />
                    <Title level={4} style={{ color: 'white', margin: 0 }}>Join Existing Group</Title>
                    <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                      Join an available group ({availableGroups.length} groups available)
                    </Text>
                  </Card>
                </motion.div>
              </Col>
            </Row>
            
            {availableGroups.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <Title level={4}>Available Groups</Title>
                <Row gutter={[16, 16]}>
                  {availableGroups.map(group => (
                    <Col xs={24} sm={12} md={8} key={group.id}>
                      <Card 
                        hoverable
                        style={{ borderRadius: '12px' }}
                        actions={[
                          <Button 
                            type="primary" 
                            onClick={() => onJoinGroup(group.id)}
                            disabled={(group.members?.length || 0) >= (group.maxMembers || 4)}
                          >
                            {(group.members?.length || 0) >= (group.maxMembers || 4) ? 'Full' : 'Join Group'}
                          </Button>
                        ]}
                      >
                        <Card.Meta
                          title={group.name}
                          description={group.lecturer ? `Lecturer: ${group.lecturer}` : 'No lecturer assigned'}
                        />
                        <div style={{ marginTop: '12px' }}>
                          <Text type="secondary">
                            Members: {group.members?.length || 0}/{group.maxMembers || 4}
                          </Text>
                          {group.classId && (
                            <>
                              <br />
                              <Text type="secondary">
                                Class ID: {group.classId}
                              </Text>
                            </>
                          )}
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  </div>
);





// Wallet Management Component
const WalletManagement = ({ wallet }) => (
  <div>
    <Row gutter={[24, 24]}>
      <Col xs={24} md={8}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
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
              value={wallet.balance}
              prefix={<DollarOutlined />}
              suffix="VND"
              valueStyle={{ color: 'white', fontWeight: 'bold' }}
            />
            
          </Card>
        </motion.div>
      </Col>
      
      <Col xs={24} md={16}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
          <Card title="Transaction History" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
            <Table
              dataSource={wallet.transactions}
              columns={[
                {
                  title: 'Type',
                  dataIndex: 'type',
                  key: 'type',
                  render: (type) => <Tag color={type === 'Top-up' ? 'success' : 'primary'}>{type}</Tag>
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  render: (amount) => `${amount.toLocaleString()} VND`
                },
                { title: 'Date', dataIndex: 'date', key: 'date' },
              ]}
              rowKey={(record, index) => index}
              pagination={false}
            />
          </Card>
        </motion.div>
      </Col>
    </Row>
  </div>
);



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

export default MemberPortal; 