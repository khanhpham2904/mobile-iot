import React, { useState, useEffect } from 'react';
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
  Timeline, 
  Switch, 
  DatePicker, 
  Upload, 
  Tabs, 
  Alert, 
  Descriptions, 
  Empty, 
  Spin, 
  Popover,
  notification, 
  Transfer, 
  Popconfirm, 
  Checkbox,
  InputNumber
} from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import {
  DashboardOutlined,
  SettingOutlined,
  UserOutlined,
  TeamOutlined,
  ToolOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  BellOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  BuildOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ExportOutlined,
  HistoryOutlined,
  ImportOutlined,
  RollbackOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { kitAPI, kitComponentAPI, borrowingRequestAPI, walletTransactionAPI, userAPI, authAPI, classesAPI, studentGroupAPI, borrowingGroupAPI, penaltyPoliciesAPI, penaltiesAPI, penaltyDetailAPI, damageReportAPI, notificationAPI } from './api';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

function AdminPortal({ onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [kits, setKits] = useState([]);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [rentalRequests, setRentalRequests] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  
  // Modal states
  
  // Import/Export states
  const [availableStudents, setAvailableStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [groupMembersModalVisible, setGroupMembersModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  // Kit Inspection and Fine Management states
  const [kitInspectionModalVisible, setKitInspectionModalVisible] = useState(false);
  const [selectedKit, setSelectedKit] = useState(null);
  const [selectedRental, setSelectedRental] = useState(null);
  const [damageAssessment, setDamageAssessment] = useState({});
  const [fineAmount, setFineAmount] = useState(0);
  const [kitInspectionLoading, setKitInspectionLoading] = useState(false);
  const [selectedPenaltyPolicies, setSelectedPenaltyPolicies] = useState([]);
  const [fines, setFines] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [logHistory, setLogHistory] = useState([]);
  const [penaltyPolicies, setPenaltyPolicies] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false);
  const [notificationLoading, setNotificationLoading] = useState(false);
  
  // Form instances

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


  useEffect(() => {
    loadData();
  }, []);

  // Auto-calculate fine amount when damage or penalty policies change
  useEffect(() => {
    if (kitInspectionModalVisible) {
      calculateFineAmount();
    }
  }, [damageAssessment, selectedPenaltyPolicies, kitInspectionModalVisible]);

  // Load unresolved penalties for Fine Management tab
  useEffect(() => {
    const loadUnresolvedPenalties = async () => {
      try {
        const res = await penaltiesAPI.getUnresolved();
        console.log('Unresolved penalties response:', res);
        const data = Array.isArray(res) ? res : (res && Array.isArray(res.data) ? res.data : []);
        const mapped = data.map(p => ({
          id: p.id,
          kitId: p.borrowRequestId || 'N/A',
          kitName: 'N/A',
          studentEmail: p.accountEmail || 'N/A',
          studentName: p.accountEmail || 'N/A',
          leaderEmail: p.accountEmail || 'N/A',
          leaderName: p.accountEmail || 'N/A',
          fineAmount: (p.totalAmount !== undefined && p.totalAmount !== null) ? Number(p.totalAmount) : 0,
          createdAt: p.takeEffectDate || new Date().toISOString(),
          dueDate: new Date().toISOString(),
          status: p.resolved ? 'paid' : 'pending',
          damageAssessment: {},
        }));
        setFines(mapped);
      } catch (e) {
        console.error('Error loading unresolved penalties:', e);
      }
    };
    if (selectedKey === 'fines') {
      loadUnresolvedPenalties();
    }
  }, [selectedKey]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch real data from API
      console.log('Loading data from API...');
      
      // Fetch all kits from API
      try {
        const kitsResponse = await kitAPI.getAllKits();
        console.log('Raw kits response:', kitsResponse);
        
        // Handle direct array response
        if (Array.isArray(kitsResponse)) {
          // Transform the data to handle null values and ensure proper format
          const transformedKits = kitsResponse.map(kit => ({
            ...kit,
            status: kit.status || 'AVAILABLE', // Default to AVAILABLE if null
            components: kit.components || [], // Convert null to empty array for display
            imageUrl: kit.imageUrl === 'null' ? null : kit.imageUrl // Convert string 'null' to actual null
          }));
          setKits(transformedKits);
          console.log('Kits loaded successfully:', transformedKits.length);
          console.log('Transformed kits:', transformedKits);
        } 
        // Handle wrapped response format
        else if (kitsResponse && kitsResponse.data && Array.isArray(kitsResponse.data)) {
          setKits(kitsResponse.data);
          console.log('Kits loaded successfully:', kitsResponse.data.length);
        } 
        // Handle empty or invalid response
        else {
          setKits([]);
          console.log('No kits found or invalid response format');
        }
      } catch (kitsError) {
        console.error('Error loading kits:', kitsError);
        setKits([]);
      }
      
      // Groups are loaded from API
      
      // Fetch users from API
      try {
        const usersData = await userAPI.getAllAccounts(0, 100); // Get first 100 users
        console.log('Users response:', usersData);
        
        if (usersData && usersData.length > 0) {
          // Map ProfileResponse to user format for table
          const mappedUsers = usersData.map(profile => ({
            id: profile.id,
            name: profile.fullName || profile.email || 'Unknown',
            email: profile.email,
            phone: profile.phone,
            studentCode: profile.studentCode,
            role: profile.role?.toLowerCase() || 'member',
            status: 'Active', // Default status since ProfileResponse doesn't have status
            createdAt: new Date().toISOString()
          }));
          
          setUsers(mappedUsers);
          console.log('Users loaded successfully:', mappedUsers.length);
        } else {
          setUsers([]);
          console.log('No users found or invalid response format');
        }
      } catch (usersError) {
        console.error('Error loading users:', usersError);
        setUsers([]);
      }
      // Fetch rental requests from API
      try {
        const rentalResponse = await borrowingRequestAPI.getAll();
        console.log('Raw rental requests response:', rentalResponse);
        
        if (Array.isArray(rentalResponse)) {
          setRentalRequests(rentalResponse);
          console.log('Rental requests loaded successfully:', rentalResponse.length);
        } else if (rentalResponse && rentalResponse.data && Array.isArray(rentalResponse.data)) {
          setRentalRequests(rentalResponse.data);
          console.log('Rental requests loaded successfully:', rentalResponse.data.length);
        } else {
          setRentalRequests([]);
          console.log('No rental requests data');
        }
      } catch (rentalError) {
        console.error('Error loading rental requests:', rentalError);
        setRentalRequests([]);
      }

      // Fetch approved requests for refund checking
      try {
        const approvedResponse = await borrowingRequestAPI.getApproved();
        console.log('Raw approved requests response:', approvedResponse);
        
        if (Array.isArray(approvedResponse)) {
          // Transform approved requests to refund request format
          const refundRequestsData = approvedResponse.map(request => ({
            id: request.id,
            rentalId: request.id,
            kitId: request.kit?.id || 'N/A',
            kitName: request.kit?.kitName || 'N/A',
            userEmail: request.requestedBy?.email || 'N/A',
            userName: request.requestedBy?.fullName || 'N/A',
            status: 'pending',
            requestDate: request.createdAt || new Date().toISOString(),
            approvedDate: request.approvedDate || new Date().toISOString(),
            totalCost: request.depositAmount || 0,
            damageAssessment: {},
            reason: request.reason || 'Course project',
            depositAmount: request.depositAmount || 0,
            requestType: request.requestType // Add request type to distinguish kit vs component
          }));
          
          setRefundRequests(refundRequestsData);
          console.log('Approved requests loaded successfully:', refundRequestsData.length);
        } else {
          setRefundRequests([]);
          console.log('No approved requests found or invalid response format');
        }
      } catch (approvedError) {
        console.error('Error loading approved requests:', approvedError);
        setRefundRequests([]);
      }
      
      // Fetch wallet transactions from API
      let transactionsData = [];
      try {
        console.log('Fetching wallet transactions...');
        const transactionsResponse = await walletTransactionAPI.getAll();
        console.log('Raw wallet transactions response:', transactionsResponse);
        console.log('Response type:', typeof transactionsResponse);
        console.log('Is array:', Array.isArray(transactionsResponse));
        
        if (Array.isArray(transactionsResponse)) {
          transactionsData = transactionsResponse;
          setTransactions(transactionsResponse);
          console.log('Wallet transactions loaded successfully:', transactionsResponse.length);
          console.log('First transaction:', transactionsResponse[0]);
        } else if (transactionsResponse && Array.isArray(transactionsResponse.data)) {
          transactionsData = transactionsResponse.data;
          setTransactions(transactionsResponse.data);
          console.log('Wallet transactions loaded from response.data:', transactionsResponse.data.length);
        } else {
          setTransactions([]);
          console.log('No transactions data');
        }
      } catch (transactionsError) {
        console.error('Error loading wallet transactions:', transactionsError);
        setTransactions([]);
      }
      
      setFines([]);

      // Fetch penalty policies from API
      try {
        const penaltyPoliciesResponse = await penaltyPoliciesAPI.getAll();
        console.log('Penalty policies response:', penaltyPoliciesResponse);
        
        // Check if response has data property (ApiResponse wrapper)
        const policiesData = penaltyPoliciesResponse?.data || penaltyPoliciesResponse;
        
        if (Array.isArray(policiesData)) {
          setPenaltyPolicies(policiesData);
          console.log('Penalty policies loaded successfully:', policiesData.length);
        } else {
          setPenaltyPolicies([]);
          console.log('No penalty policies found or invalid response format:', penaltyPoliciesResponse);
        }
      } catch (penaltyPoliciesError) {
        console.error('Error loading penalty policies:', penaltyPoliciesError);
        setPenaltyPolicies([]);
      }
      
      // Load available students for group management
      const studentUsers = []; // TODO: Replace with real API call to get student users
      setAvailableStudents(studentUsers);
      
      // Calculate system stats from loaded data (using response data directly)
      const availableKitsCount = kits.filter(kit => kit.status === 'AVAILABLE').length;
      const pendingRequestsCount = rentalRequests.filter(req => req.status === 'PENDING' || req.status === 'PENDING_APPROVAL').length;
      
      // Calculate monthly revenue from transactions (current month) using response data
      const statsCurrentMonth = new Date().getMonth();
      const statsCurrentYear = new Date().getFullYear();
      const statsMonthlyRevenueAmount = transactionsData
        .filter(txn => {
          const txnDate = new Date(txn.createdAt || txn.transactionDate);
          return txnDate.getMonth() === statsCurrentMonth && 
                 txnDate.getFullYear() === statsCurrentYear &&
                 (txn.type === 'RENTAL_FEE' || txn.type === 'PENALTY_PAYMENT');
        })
        .reduce((sum, txn) => sum + (txn.amount || 0), 0);
      
      setSystemStats({
        totalUsers: users.length,
        availableKits: availableKitsCount,
        pendingApprovals: pendingRequestsCount,
        monthlyRevenue: statsMonthlyRevenueAmount
      });
      
      console.log('Data loaded successfully');
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
      const response = await notificationAPI.getRoleNotifications();
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
    loadNotifications();
  }, []);

  const notificationTypeStyles = {
    ALERT: { color: 'volcano', label: 'Cảnh báo' },
    DEPOSIT: { color: 'green', label: 'Giao dịch ví' },
    SYSTEM: { color: 'blue', label: 'Hệ thống' },
    USER: { color: 'purple', label: 'Người dùng' }
  };

  const unreadNotificationsCount = notifications.filter((item) => !item.isRead).length;

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
              const notificationDate = item.createdAt ? formatDateTime(item.createdAt) : 'N/A';
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

  // Import/Export Functions
  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `${filename}.xlsx`);
  };

  const importFromExcel = (file, type) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsArrayBuffer(file);
    });
  };



  const handleExportKits = () => {
    const kitData = kits.map(kit => ({
      'Kit ID': kit.id,
      'Name': kit.name,
      'Category': kit.category,
      'Quantity': kit.quantity,
      'Price': kit.price,
      'Status': kit.status,
      'Location': kit.location,
      'Description': kit.description
    }));
    exportToExcel(kitData, 'kits_list');
    notification.success({
      message: 'Export Successful',
      description: 'Kit list exported to Excel file',
      placement: 'topRight',
    });
  };



  const handleImportKits = async (file) => {
    try {
      const importedData = await importFromExcel(file, 'kits');
      const newKits = importedData.map((kit, index) => ({
        id: Date.now() + index,
        name: kit.Name || kit.name,
        category: kit.Category || kit.category || 'STUDENT_KIT',
        quantity: parseInt(kit.Quantity || kit.quantity) || 1,
        price: parseInt(kit.Price || kit.price) || 0,
        status: 'AVAILABLE',
        location: kit.Location || kit.location || 'Lab 1',
        description: kit.Description || kit.description || '',
        components: []
      }));
      
      setKits(prev => [...prev, ...newKits]);
      
      notification.success({
        message: 'Import Successful',
        description: `${newKits.length} kits imported successfully`,
        placement: 'topRight',
      });
    } catch (error) {
      notification.error({
        message: 'Import Failed',
        description: 'Failed to import kits. Please check file format.',
        placement: 'topRight',
      });
    }
  };

  // Group Management Functions

  const adjustGroupMembers = (group) => {
    setSelectedGroup(group);
    setSelectedStudents(group.members || []);
    setGroupMembersModalVisible(true);
  };

  const saveGroupMembers = async () => {
    console.log('=== saveGroupMembers called ===');
    console.log('Selected group:', selectedGroup);
    console.log('Current members (emails):', selectedGroup?.members);
    console.log('New members (emails):', selectedStudents);
    
    // Get full student objects including IDs
    const allStudents = await userAPI.getStudents();
    const currentMembersEmails = selectedGroup?.members || [];
    const newMembersEmails = selectedStudents || [];
    
    // Find members to remove (in current but not in new)
    const membersToRemove = currentMembersEmails.filter(email => !newMembersEmails.includes(email));
    
    // Find members to add (in new but not in current)
    const membersToAdd = newMembersEmails.filter(email => !currentMembersEmails.includes(email));
    
    console.log('Members to remove:', membersToRemove);
    console.log('Members to add:', membersToAdd);
    
    try {
      // Remove members
      for (const email of membersToRemove) {
        const student = allStudents.find(s => s.email === email);
        if (student) {
          console.log(`Removing member: ${email} (ID: ${student.id})`);
          await borrowingGroupAPI.removeMemberFromGroup(selectedGroup.id, student.id);
        }
      }
      
      // Add new members
      for (let i = 0; i < membersToAdd.length; i++) {
        const email = membersToAdd[i];
        const student = allStudents.find(s => s.email === email);
        if (student) {
          // First new member becomes MEMBER (not LEADER to avoid conflict)
          const role = 'MEMBER';
          
          const borrowingGroupData = {
            studentGroupId: selectedGroup.id,
            accountId: student.id,
            roles: role
          };
          
          console.log(`Adding member: ${email} (ID: ${student.id})`);
          await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
        }
      }
      
      // Update local state
    setGroups(prev => prev.map(group => 
      group.id === selectedGroup.id 
        ? { ...group, members: selectedStudents }
        : group
    ));
    
    setGroupMembersModalVisible(false);
    setSelectedGroup(null);
    setSelectedStudents([]);
    
    notification.success({
      message: 'Group Updated',
        description: `Successfully updated ${selectedGroup?.groupName || 'group'}. Removed ${membersToRemove.length}, added ${membersToAdd.length}.`,
      placement: 'topRight',
    });
    } catch (error) {
      console.error('Error updating group members:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to update group members',
        placement: 'topRight',
      });
    }
  };


  // Kit Inspection and Fine Management Functions

  const openRefundKitInspection = async (refundRequest) => {
    console.log('Opening kit inspection for:', refundRequest);
    console.log('Available kits:', kits);
    
    // Check if this is a component rental or full kit rental
    const isComponentRental = refundRequest.requestType === 'BORROW_COMPONENT';
    
    // For component rental, we still need to find the parent kit
    const kit = kits.find(k => 
      k.kitName === refundRequest.kitName || 
      k.name === refundRequest.kitName
    );
    
    console.log('Found kit:', kit);
    console.log('Is component rental:', isComponentRental);
    
    if (!kit) {
      notification.error({
        message: 'Kit Not Found',
        description: `The kit "${refundRequest.kitName}" could not be found. Available kits: ${kits.map(k => k.kitName || k.name).join(', ')}`,
        placement: 'topRight',
        duration: 6,
      });
      return;
    }
    
    // Create a rental-like object for the refund request
    const rentalObject = {
      id: refundRequest.id || refundRequest.rentalId,
      kitId: kit.id,
      kitName: refundRequest.kitName,
      userEmail: refundRequest.userEmail,
      userName: refundRequest.userName || refundRequest.userEmail?.split('@')[0] || 'Unknown',
      status: refundRequest.status,
      totalCost: refundRequest.depositAmount || 0,
      requestType: refundRequest.requestType // Add request type for inspection logic
    };
    
    console.log('Set rental object:', rentalObject);
    console.log('Set selected kit:', kit);
    
    let kitToUse = kit;
    
    // If component rental, fetch the rented components
    if (isComponentRental) {
      try {
        const rentedComponents = await borrowingRequestAPI.getRequestComponents(refundRequest.id);
        console.log('Fetched rented components:', rentedComponents);
        
        // Update kit to show only the rented components
        if (rentedComponents && rentedComponents.length > 0) {
          // Find actual components from kits
          const actualComponents = rentedComponents.map(rc => {
            const actualComp = kit.components?.find(c => 
              c.id === rc.kitComponentsId || c.componentName === rc.componentName
            );
            return actualComp ? {
              ...actualComp,
              rentedQuantity: rc.quantity,
              componentName: rc.componentName
            } : {
              componentName: rc.componentName,
              name: rc.componentName,
              quantity: rc.quantity,
              rentedQuantity: rc.quantity
            };
          });
          
          // Create a temporary kit object with only rented components
          kitToUse = {
            ...kit,
            components: actualComponents.length > 0 ? actualComponents : kit.components
          };
          
          console.log('Set selected kit with rented components:', kitToUse);
        } else {
          console.log('No rented components found, using full kit');
        }
      } catch (error) {
        console.error('Error fetching rented components:', error);
      }
    } else {
      // For full kit rental, use kit as is
      console.log('Full kit selected - components:', kit.components);
    }
    
    console.log('Final kit to use:', kitToUse);
    console.log('Kit components:', kitToUse.components);
    
    // Set all states before opening modal
    setSelectedRental(rentalObject);
    setSelectedKit(kitToUse);
    setDamageAssessment(refundRequest.damageAssessment || {});
    setFineAmount(0);
    setSelectedPenaltyPolicies([]);
    
    // Open modal after setting all states
    setTimeout(() => {
      setKitInspectionModalVisible(true);
      console.log('Kit inspection modal opened');
    }, 100);
  };

  const handleComponentDamage = (componentName, isDamaged, damageValue = 0) => {
    setDamageAssessment(prev => ({
      ...prev,
      [componentName]: {
        damaged: isDamaged,
        value: damageValue
      }
    }));
  };

  const calculateFineAmount = () => {
    let totalFine = 0;
    
    // Calculate fine from component damage
    Object.values(damageAssessment).forEach(component => {
      if (component.damaged) {
        totalFine += component.value;
      }
    });
    
    // Add penalty policies amount
    selectedPenaltyPolicies.forEach(policy => {
      if (policy.amount) {
        totalFine += policy.amount;
      }
    });
    
    setFineAmount(totalFine);
    return totalFine;
  };

  const submitKitInspection = async () => {
    setKitInspectionLoading(true);
    let totalFine = calculateFineAmount();
    
    // Check if this is a refund request or rental request
    const isRefundRequest = selectedRental && (selectedRental.status === 'approved' || selectedRental.status === 'pending');
    
    try {
      // Update borrowing request status to RETURNED when checkin
      if (selectedRental && selectedRental.id) {
        try {
          await borrowingRequestAPI.update(selectedRental.id, { 
            status: 'RETURNED',
            actualReturnDate: new Date().toISOString()
          });
          console.log('Borrowing request status updated to RETURNED');
        } catch (updateError) {
          console.error('Error updating borrowing request:', updateError);
        }
      }

      // Update kit status to AVAILABLE
      if (selectedKit && selectedKit.id) {
        try {
          const kitUpdateData = {
            status: 'AVAILABLE'
          };
          await kitAPI.updateKit(selectedKit.id, kitUpdateData);
          console.log('Kit status updated to AVAILABLE');
        } catch (kitUpdateError) {
          console.error('Error updating kit status:', kitUpdateError);
        }
      }
    } catch (error) {
      console.error('Error during checkin process:', error);
    }
    
    if (totalFine > 0 && (selectedPenaltyPolicies.length > 0 || Object.keys(damageAssessment).length > 0)) {
      try {
        // Compute 50% rental fee (remaining to pay). Prefer depositAmount; fallback to totalCost
        const rentalHalfFee = (selectedRental?.depositAmount && selectedRental.depositAmount > 0)
          ? selectedRental.depositAmount
          : (selectedRental?.totalCost && selectedRental.totalCost > 0)
            ? selectedRental.totalCost
            : 0;

        // Add rental 50% to total penalty amount
        totalFine = totalFine + (rentalHalfFee || 0);

        // Create penalty
        const penaltyData = {
          semester: new Date().getFullYear() + '-' + (new Date().getMonth() < 6 ? 'SPRING' : 'FALL'),
          takeEffectDate: new Date(),
          kitType: selectedKit?.type || 'STUDENT_KIT',
          resolved: false,
          note: 'Kit returned with damage',
          totalAmount: totalFine,
          borrowRequestId: selectedRental?.id,
          accountId: users.find(u => u.email === selectedRental?.userEmail)?.id,
          policyId: null
        };
        
        console.log('Creating penalty:', penaltyData);
        const penaltyResponse = await penaltiesAPI.create(penaltyData);
        console.log('Penalty created:', penaltyResponse);
        const penaltyId = penaltyResponse?.id || penaltyResponse?.data?.id;
        
        if (penaltyId) {
          // Build penalty details from selected policies
          const penaltyDetailsData = (selectedPenaltyPolicies || []).map(policy => ({
            amount: policy.amount || 0,
            description: policy.policyName ? 
              `${policy.policyName}${policy.type ? ' - ' + policy.type : ''}` : 
              'Policy violation',
            policiesId: policy.id,
            penaltyId: penaltyId
          }));

          // Add extra penalty detail for rental 50% fee
          if (rentalHalfFee && rentalHalfFee > 0) {
            penaltyDetailsData.push({
              amount: rentalHalfFee,
              description: 'Trả tiền thuê kit (50%)',
              policiesId: null,
              penaltyId: penaltyId
            });
          }

          if (penaltyDetailsData.length > 0) {
            console.log('Creating penalty details (including rental 50% if any):', penaltyDetailsData);
            const penaltyDetailsResponse = await penaltyDetailAPI.createMultiple(penaltyDetailsData);
            console.log('Penalty details created:', penaltyDetailsResponse);
          }
        }
        
        // Create damage report
        const damageDescriptions = Object.entries(damageAssessment)
          .filter(([_, assessment]) => assessment.damaged)
          .map(([component, assessment]) => `${component}: ${assessment.value} VND`)
          .join(', ');
        
        const damageReportData = {
          description: damageDescriptions || 'No component damage',
          status: 'PENDING',
          generatedByEmail: selectedRental?.userEmail,
          kitId: selectedKit?.id,
          borrowRequestId: selectedRental?.id,
          totalDamageValue: Object.values(damageAssessment)
            .filter(a => a.damaged)
            .reduce((sum, a) => sum + a.value, 0)
        };
        
        console.log('Creating damage report:', damageReportData);
        const damageReportResponse = await damageReportAPI.create(damageReportData);
        console.log('Damage report created:', damageReportResponse);
      } catch (error) {
        console.error('Error creating penalty and damage report:', error);
      }
      
      // Find the group leader for this rental
      const group = groups.find(g => 
        g.members && g.members.includes(selectedRental.userEmail)
      );
      
      if (group) {
        const leaderEmail = group.leader;
        const leader = users.find(u => u.email === leaderEmail);
        
        const newFine = {
          id: Date.now(),
          rentalId: selectedRental.id,
          kitId: selectedKit.id,
          kitName: selectedKit.name,
          studentEmail: selectedRental.userEmail,
          studentName: selectedRental.userName,
          leaderEmail: leaderEmail,
          leaderName: leader ? leader.name : 'Unknown',
          damageAssessment: { ...damageAssessment },
          fineAmount: totalFine,
          status: 'pending',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        };
        
        setFines(prev => [...prev, newFine]);
        
        notification.success({
          message: 'Kit Inspection Completed',
          description: `Fine of ${totalFine.toLocaleString()} VND sent to group leader ${leader ? leader.name : leaderEmail}`,
          placement: 'topRight',
          duration: 5,
        });
      } else {
        notification.warning({
          message: 'No Group Found',
          description: 'Student is not part of any group. Fine will be sent directly to student.',
          placement: 'topRight',
        });
        
        const newFine = {
          id: Date.now(),
          rentalId: selectedRental.id,
          kitId: selectedKit.id,
          kitName: selectedKit.name,
          studentEmail: selectedRental.userEmail,
          studentName: selectedRental.userName,
          leaderEmail: selectedRental.userEmail,
          leaderName: selectedRental.userName,
          damageAssessment: { ...damageAssessment },
          fineAmount: totalFine,
          status: 'pending',
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        
        setFines(prev => [...prev, newFine]);
      }

      try {
        const targetAccountId = users.find(u => u.email === (selectedRental?.userEmail))?.id;

        const notificationsPayload = [{
          subType: totalFine > 0 ? 'UNPAID_PENALTY' : 'OVERDUE_RETURN',
          userId: targetAccountId,
          title: totalFine > 0 ? 'Bạn có khoản phạt mới' : 'Trả kit thành công',
          message:
            totalFine > 0
              ? `Kit ${selectedKit?.kitName || ''} có phát sinh khoản phạt ${totalFine.toLocaleString()} VND. Vui lòng kiểm tra và thanh toán.`
              : `Kit ${selectedKit?.kitName || ''} đã được check-in thành công.`
        }];

        if (group) {
          const leaderAccountId = users.find(u => u.email === group.leader)?.id;
          if (leaderAccountId && leaderAccountId !== targetAccountId) {
            notificationsPayload.push({
              subType: 'UNPAID_PENALTY',
              userId: leaderAccountId,
              title: 'Khoản phạt của nhóm',
              message: `Nhóm có khoản phạt ${totalFine.toLocaleString()} VND do kit ${selectedKit?.kitName || ''} bị tổn thất.`
            });
          }
        }

        await notificationAPI.createNotifications(notificationsPayload);
      } catch (notifyError) {
        console.error('Error sending check-in notifications:', notifyError);
      }
      
      // For refund requests with damage, add to log history and remove from refund requests
      if (isRefundRequest) {
        const logEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          action: 'KIT_RETURNED_WITH_DAMAGE',
          type: 'return',
          user: selectedRental.userEmail,
          userName: selectedRental.userName,
          details: {
            kitName: selectedKit.name,
            kitId: selectedKit.id,
            requestId: selectedRental.id,
            reason: 'Kit returned with damage - fine created',
            damageDescription: 'Kit components have damage',
            originalRentalId: selectedRental.id,
            processedBy: 'admin@fpt.edu.vn',
            fineAmount: totalFine,
            damageAssessment: { ...damageAssessment }
          },
          status: 'RETURNED',
          adminAction: 'checked_in',
          adminUser: 'admin@fpt.edu.vn',
          adminTimestamp: new Date().toISOString()
        };
        
        setLogHistory(prev => [logEntry, ...prev]);
        
        // Remove from refund requests
        setRefundRequests(prev => prev.filter(req => req.id !== selectedRental.id));
        
        notification.success({
          message: 'Kit Checkin Completed',
          description: `Kit returned with damage. Fine of ${totalFine.toLocaleString()} VND has been created.`,
          placement: 'topRight',
          duration: 5,
        });
      } else {
        notification.success({
          message: 'Kit Inspection Completed',
          description: `Fine of ${totalFine.toLocaleString()} VND sent to group leader`,
          placement: 'topRight',
          duration: 5,
        });
      }
    } else {
      // No damage detected
      if (isRefundRequest) {
        // Calculate refund amount (assuming full refund for no damage)
        const refundAmount = selectedRental.totalCost || 0;
        
        try {
          // TODO: Process refund to wallet via API
          // const refundResult = await refundAPI.create(...);
          const refundResult = { success: true };
          
          if (refundResult.success) {
            // Update kit status to available
            setKits(prev => prev.map(kit => 
              kit.id === selectedKit.id 
                ? { ...kit, status: 'AVAILABLE' }
                : kit
            ));
            
            // Add refund transaction to log history
            const logEntry = {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              action: 'REFUND_PROCESSED',
              type: 'refund',
              user: selectedRental.userEmail,
              userName: selectedRental.userName,
              details: {
                kitName: selectedKit.name,
                kitId: selectedKit.id,
                requestId: `REF-${selectedRental.id}`,
                refundAmount: refundAmount,
                refundStatus: 'completed',
                originalRentalId: selectedRental.id,
                processedBy: 'admin@fpt.edu.vn',
                inspectionNotes: 'No damage found - full refund processed',
                kitStatusChanged: 'AVAILABLE',
                transactionId: refundResult.transactionId
              },
              status: 'COMPLETED',
              adminAction: 'refund_processed',
              adminUser: 'admin@fpt.edu.vn',
              adminTimestamp: new Date().toISOString()
            };
            
            setLogHistory(prev => [logEntry, ...prev]);
            
            // Remove from refund requests
            setRefundRequests(prev => prev.filter(req => req.id !== selectedRental.id));
            
            notification.success({
              message: 'Refund Processed Successfully',
              description: `Refund of ${refundAmount.toLocaleString()} VND has been sent to ${selectedRental.userName}'s wallet. Kit status changed to AVAILABLE.`,
              placement: 'topRight',
              duration: 5,
            });
          } else {
            notification.error({
              message: 'Refund Failed',
              description: 'Failed to process refund to wallet. Please try again.',
              placement: 'topRight',
            });
            setKitInspectionLoading(false);
            return; // Don't close modal if refund failed
          }
        } catch (error) {
          notification.error({
            message: 'Refund Error',
            description: 'An error occurred while processing the refund. Please try again.',
            placement: 'topRight',
          });
          setKitInspectionLoading(false);
          return; // Don't close modal if refund failed
        }
      } else {
        // Update kit status to available for regular rental returns
        setKits(prev => prev.map(kit => 
          kit.id === selectedKit.id 
            ? { ...kit, status: 'AVAILABLE' }
            : kit
        ));
        
        notification.success({
          message: 'Kit Inspection Completed',
          description: 'No damage detected. Kit returned successfully and status changed to AVAILABLE.',
          placement: 'topRight',
        });
        
        // Update rental status to returned
        setRentalRequests(prev => prev.map(rental => 
          rental.id === selectedRental.id 
            ? { ...rental, status: 'RETURNED', returnDate: new Date().toISOString() }
            : rental
        ));
      }
    }
    
    setKitInspectionModalVisible(false);
    setSelectedKit(null);
    setSelectedRental(null);
    setDamageAssessment({});
    setFineAmount(0);
    setSelectedPenaltyPolicies([]);
    setKitInspectionLoading(false);
  };





  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'kits',
      icon: <ToolOutlined />,
      label: 'Kit Management',
    },
    {
      key: 'rentals',
      icon: <ShoppingOutlined />,
      label: 'Rental Approvals',
    },
    {
      key: 'refunds',
      icon: <RollbackOutlined />,
      label: 'Refund Checking',
    },
    {
      key: 'fines',
      icon: <DollarOutlined />,
      label: 'Fine Management',
    },
    {
      key: 'transactions',
      icon: <FileTextOutlined />,
      label: 'Transaction History',
    },
    {
      key: 'log-history',
      icon: <HistoryOutlined />,
      label: 'Log History',
    },
    {
      key: 'groups',
      icon: <TeamOutlined />,
      label: 'Group Management',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'User Management',
    },
    {
      key: 'penalty-policies',
      icon: <SafetyCertificateOutlined />,
      label: 'Penalty Policies',
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

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('vi-VN');
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
            {collapsed ? 'IoT' : 'IoT Kit Rental'}
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
                {selectedKey === 'dashboard' && <DashboardContent systemStats={systemStats} />}
                {selectedKey === 'kits' && <KitManagement kits={kits} setKits={setKits} handleExportKits={handleExportKits} handleImportKits={handleImportKits} />}
                {selectedKey === 'rentals' && <RentalApprovals rentalRequests={rentalRequests} setRentalRequests={setRentalRequests} setLogHistory={setLogHistory} setTransactions={setTransactions} setRefundRequests={setRefundRequests} onNavigateToRefunds={() => setSelectedKey('refunds')} />}
                {selectedKey === 'refunds' && <RefundApprovals refundRequests={refundRequests} setRefundRequests={setRefundRequests} openRefundKitInspection={openRefundKitInspection} setLogHistory={setLogHistory} />}
                {selectedKey === 'fines' && <FineManagement fines={fines} setFines={setFines} setLogHistory={setLogHistory} />}
                {selectedKey === 'transactions' && <TransactionHistory transactions={transactions} setTransactions={setTransactions} />}
                {selectedKey === 'log-history' && <LogHistory logHistory={logHistory} setLogHistory={setLogHistory} />}
                {selectedKey === 'groups' && <GroupManagement groups={groups} setGroups={setGroups} adjustGroupMembers={adjustGroupMembers} availableStudents={availableStudents} />}
                {selectedKey === 'users' && <UserManagement users={users} setUsers={setUsers} />}
                {selectedKey === 'penalty-policies' && <PenaltyPoliciesManagement penaltyPolicies={penaltyPolicies} setPenaltyPolicies={setPenaltyPolicies} />}
                {selectedKey === 'settings' && <Settings />}
              </motion.div>
            </AnimatePresence>
          </Spin>
        </Content>
      </Layout>
      
      {/* Group Members Modal */}
      <Modal
        title={`Adjust Members - ${selectedGroup?.name}`}
        open={groupMembersModalVisible}
        onCancel={() => {
          setGroupMembersModalVisible(false);
          setSelectedGroup(null);
          setSelectedStudents([]);
        }}
        onOk={saveGroupMembers}
        width={800}
        centered
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Available Students:</Text>
          <Text type="secondary" style={{ marginLeft: 8 }}>
            Select students to add to this group
          </Text>
        </div>
        
        <Transfer
          dataSource={availableStudents.map(student => ({
            key: student.email,
            title: student.name,
            description: student.email,
            ...student
          }))}
          titles={['Available Students', 'Group Members']}
          targetKeys={selectedStudents}
          onChange={setSelectedStudents}
          render={item => (
            <div style={{ padding: '8px 0' }}>
              <div style={{ fontWeight: 'bold' }}>{item.title}</div>
              <div style={{ color: '#666', fontSize: '12px' }}>{item.description}</div>
            </div>
          )}
          listStyle={{
            width: 300,
            height: 400,
          }}
          showSearch
          filterOption={(inputValue, item) =>
            item.title.indexOf(inputValue) !== -1 || item.description.indexOf(inputValue) !== -1
          }
        />
        
        <div style={{ marginTop: 16, padding: 16, background: '#f5f5f5', borderRadius: 8 }}>
          <Text strong>Current Group Members ({selectedStudents.length}):</Text>
          <div style={{ marginTop: 8 }}>
            {selectedStudents.length > 0 ? (
              selectedStudents.map(email => {
                const student = availableStudents.find(s => s.email === email);
                return (
                  <Tag key={email} style={{ margin: '4px' }}>
                    {student ? student.name : email}
                  </Tag>
                );
              })
            ) : (
              <Text type="secondary">No members selected</Text>
            )}
          </div>
        </div>
      </Modal>
      
      {/* Kit Inspection Modal */}
      <Modal
        title={`Kit Inspection - ${selectedKit?.kitName || selectedKit?.name || 'Unknown'}`}
        open={kitInspectionModalVisible}
        onCancel={() => {
          setKitInspectionModalVisible(false);
          setSelectedKit(null);
          setSelectedRental(null);
          setDamageAssessment({});
          setFineAmount(0);
          setSelectedPenaltyPolicies([]);
        }}
        onOk={submitKitInspection}
        width={800}
        centered
        destroyOnClose
        okText="Submit Inspection"
        cancelText="Cancel"
        confirmLoading={kitInspectionLoading}
      >
        {selectedKit && selectedRental && (
          <div>
            <Alert
              message={selectedRental.requestType === 'BORROW_COMPONENT' ? 'Component Return Inspection' : 'Kit Return Inspection'}
              description={`Inspecting ${selectedRental.requestType === 'BORROW_COMPONENT' ? 'component' : 'kit'} returned by ${selectedRental.userName} (${selectedRental.userEmail})`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Descriptions title="Rental Information" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Student">{selectedRental.userName}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedRental.userEmail}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={selectedRental.requestType === 'BORROW_COMPONENT' ? 'orange' : 'blue'}>
                  {selectedRental.requestType === 'BORROW_COMPONENT' ? 'Component Rental' : 'Full Kit Rental'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Kit">{selectedKit.kitName || selectedKit.name}</Descriptions.Item>
              <Descriptions.Item label="Rental ID">#{selectedRental.id}</Descriptions.Item>
              {selectedRental.depositAmount && (
                <Descriptions.Item label="Deposit Amount">
                  {selectedRental.depositAmount.toLocaleString()} VND
                </Descriptions.Item>
              )}
            </Descriptions>
            
            <Divider>Component Inspection</Divider>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong>Check each component for damage:</Text>
            </div>
            
            {(selectedKit.components && selectedKit.components.length > 0) ? (
              selectedKit.components.map((component, index) => (
                <Card 
                  key={index} 
                  size="small" 
                  style={{ marginBottom: 8 }}
                  title={
                    <Space>
                      <Text strong>{component.componentName || component.name}</Text>
                      {component.condition && (
                        <Tag color={component.condition === 'New' ? 'green' : 'orange'}>
                          {component.condition}
                        </Tag>
                      )}
                      {component.rentedQuantity && (
                        <Tag color="purple">Rented: {component.rentedQuantity}</Tag>
                      )}
                    </Space>
                  }
                >
                  <Row gutter={16} align="middle">
                    <Col span={12}>
                      <Text>Quantity: {component.quantity || component.rentedQuantity}</Text>
                    </Col>
                  <Col span={12}>
                    <Space>
                      <Checkbox
                        checked={damageAssessment[component.componentName || component.name]?.damaged || false}
                        onChange={(e) => handleComponentDamage(component.componentName || component.name, e.target.checked, e.target.checked ? 50000 : 0)}
                      >
                        Damaged
                      </Checkbox>
                      {damageAssessment[component.componentName || component.name]?.damaged && (
                        <InputNumber
                          placeholder="Damage Value (VND)"
                          value={damageAssessment[component.componentName || component.name]?.value || 0}
                          onChange={(value) => handleComponentDamage(component.componentName || component.name, true, value || 0)}
                          style={{ width: 150 }}
                          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        />
                      )}
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))
            ) : (
              <Alert
                message="No Components"
                description="No components found for inspection."
                type="warning"
                showIcon
              />
            )}
            
            <Divider orientation="left">
              <Space>
                <SafetyCertificateOutlined style={{ color: '#722ed1' }} />
                <Text strong style={{ fontSize: 16 }}>Chính Sách Phạt (Penalty Policies)</Text>
              </Space>
            </Divider>
            
            {penaltyPolicies && penaltyPolicies.length > 0 ? (
              <List
              dataSource={penaltyPolicies}
                renderItem={(policy) => (
                  <List.Item>
                    <Row style={{ width: '100%' }} align="middle" gutter={16}>
                      <Col flex="auto">
                        <Space direction="vertical" size={4} style={{ width: '100%' }}>
                          <Text strong>{policy.policyName || 'Unnamed Policy'}</Text>
                          <Text type="secondary" style={{ fontSize: 14 }}>
                            {policy.amount ? policy.amount.toLocaleString() : 'N/A'} VND
                          </Text>
                        </Space>
                      </Col>
                      <Col>
                        <Checkbox
                          checked={selectedPenaltyPolicies.some(selected => selected.id === policy.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPenaltyPolicies(prev => [...prev, policy]);
                            } else {
                              setSelectedPenaltyPolicies(prev => prev.filter(p => p.id !== policy.id));
                            }
                          }}
                        />
                      </Col>
                    </Row>
                  </List.Item>
                )}
                style={{ 
                  background: '#fafafa',
                  borderRadius: '8px',
                  padding: '8px 0',
                  marginBottom: 16 
                }}
              />
            ) : (
              <Alert
                message="Không có chính sách phạt"
                description="Hiện tại không có chính sách phạt nào được áp dụng cho lần trả kit này."
                type="info"
                showIcon
                icon={<InfoCircleOutlined />}
              style={{ marginBottom: 16 }}
            />
            )}
            
            <Divider />
            
            <Alert
              message={`Total Fine: ${fineAmount.toLocaleString()} VND`}
              description={
                fineAmount > 0 
                  ? "This fine will be sent to the group leader if the student is part of a group, otherwise to the student directly."
                  : "No damage detected. Kit will be returned successfully."
              }
              type={fineAmount > 0 ? "warning" : "success"}
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {fineAmount > 0 && (
              <Alert
                message="Fine Details"
                description={
                  <div>
                    {/* Component damage fines */}
                    {Object.entries(damageAssessment).map(([component, assessment]) => (
                      assessment.damaged && (
                        <div key={component} style={{ marginBottom: 4 }}>
                          <Text strong>{component} (Damage):</Text> {assessment.value.toLocaleString()} VND
                        </div>
                      )
                    ))}
                    {/* Penalty policies */}
                    {selectedPenaltyPolicies.length > 0 && (
                      <>
                        {selectedPenaltyPolicies.map((policy) => (
                          <div key={policy.id} style={{ marginBottom: 4 }}>
                            <Text strong>{policy.policyName} (Policy):</Text> {policy.amount ? policy.amount.toLocaleString() : 0} VND
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                }
                type="warning"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </Layout>
  );
}

// Dashboard Component
const DashboardContent = ({ systemStats }) => {
  // Animation variants for dashboard
  const statCardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.6,
        ease: "easeOut"
      }
    }),
    hover: {
      y: -8,
      scale: 1.05,
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: systemStats.totalUsers || 0,
      icon: <UserOutlined />,
      color: '#1890ff',
      suffix: 'users'
    },
    {
      title: 'Available Kits',
      value: systemStats.availableKits || 0,
      icon: <ToolOutlined />,
      color: '#52c41a',
      suffix: 'kits'
    },
    {
      title: 'Pending Approvals',
      value: systemStats.pendingApprovals || 0,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      suffix: 'requests'
    },
    {
      title: 'Monthly Revenue',
      value: systemStats.monthlyRevenue || 0,
      icon: <DollarOutlined />,
      color: '#722ed1',
      suffix: 'VND'
    }
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {statCards.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <motion.div
              custom={index}
              variants={statCardVariants}
              initial="hidden"
              animate="visible"
              whileHover="hover"
            >
              <Card
                style={{
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  overflow: 'hidden',
                  position: 'relative'
                }}
                bodyStyle={{ padding: '32px' }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 + 0.5, duration: 0.3 }}
                  style={{
                    display: 'inline-block',
                    padding: '12px',
                    borderRadius: '50%',
                    background: `${stat.color}15`,
                    marginBottom: '16px'
                  }}
                >
                  <div style={{ color: stat.color, fontSize: '24px' }}>
                    {stat.icon}
                  </div>
                </motion.div>
                <Statistic
                  title={
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.7, duration: 0.3 }}
                    >
                      {stat.title}
                    </motion.div>
                  }
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ 
                    color: stat.color, 
                    fontSize: '28px',
                    fontWeight: 'bold'
                  }}
                  prefix={null}
                />
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
      
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            <Card 
              title="Recent Activity" 
              extra={<a href="#" style={{ color: '#667eea', fontWeight: 'bold' }}>View All</a>}
              style={{
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}
              headStyle={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderBottom: 'none',
                borderRadius: '20px 20px 0 0'
              }}
            >
              <Timeline>
                {systemStats.recentActivity?.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
                  >
                    <Timeline.Item color="blue">
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                      >
                        {activity.action}
                      </motion.p>
                      <motion.p 
                        style={{ fontSize: 12, color: '#999' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.1 + index * 0.1, duration: 0.3 }}
                      >
                        {activity.user} • {activity.time}
                      </motion.p>
                    </Timeline.Item>
                  </motion.div>
                ))}
              </Timeline>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <Card 
              title="Popular Kits" 
              extra={<a href="#" style={{ color: '#667eea', fontWeight: 'bold' }}>View All</a>}
              style={{
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                overflow: 'hidden'
              }}
              headStyle={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderBottom: 'none',
                borderRadius: '20px 20px 0 0'
              }}
            >
              <List
                dataSource={systemStats.popularKits || []}
                renderItem={(item, index) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1 + index * 0.1, duration: 0.3 }}
                  >
                    <List.Item>
                      <List.Item.Meta
                        title={item.name}
                        description={`${item.rentals} rentals`}
                      />
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Tag color="blue">{item.rentals} rentals</Tag>
                      </motion.div>
                    </List.Item>
                  </motion.div>
                )}
              />
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

// Kit Management Component
const KitManagement = ({ kits, setKits, handleExportKits, handleImportKits }) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [components, setComponents] = useState([]);
  const [componentModalVisible, setComponentModalVisible] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);
  const [componentFormVisible, setComponentFormVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load kits from API - now handled by parent component
  const loadKits = async () => {
    // Kits are now loaded by the parent AdminPortal component
    // This function is kept for compatibility but does nothing
    console.log('KitManagement: Kits are loaded by parent component');
  };

  // Load components for the current kit from API
  const loadComponents = async () => {
    if (!editingKit?.id) {
      console.log('loadComponents: No editingKit.id, skipping');
      return;
    }
    
    console.log('loadComponents: Starting refresh for kit:', editingKit.id);
    
    try {
      setLoading(true);
      // Fetch fresh kit data with components from backend
      const response = await kitAPI.getKitById(editingKit.id);
      console.log('loadComponents: API response:', response);
      
      if (response && response.data) {
        const kitData = response.data;
        const kitComponents = kitData.components || [];
        console.log('loadComponents: Fresh components from API:', kitComponents);
        setComponents(kitComponents);
        
        // Update the editingKit with fresh data
        setEditingKit(prev => ({ ...prev, components: kitComponents }));
        console.log('loadComponents: Components refreshed successfully');
      } else {
        console.log('loadComponents: No data in response, using fallback');
        // Fallback to existing components if API fails
        const kitComponents = editingKit.components || [];
        setComponents(kitComponents);
      }
    } catch (error) {
      console.error('loadComponents: Error loading components:', error);
      // Fallback to existing components if API fails
      const kitComponents = editingKit.components || [];
      setComponents(kitComponents);
      notification.error({
        message: 'Error',
        description: 'Failed to load components',
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKits();
  }, []);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'kitName',
      key: 'kitName',
      render: (text, record) => (
        <Button type="link" onClick={() => showKitDetails(record)}>
          {text}
        </Button>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'LECTURER_KIT' ? 'red' : type === 'STUDENT_KIT' ? 'blue' : 'default'}>
          {type}
        </Tag>
      )
    },
    {
      title: 'Total Quantity',
      dataIndex: 'quantityTotal',
      key: 'quantityTotal',
    },
    {
      title: 'Available',
      dataIndex: 'quantityAvailable',
      key: 'quantityAvailable',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'AVAILABLE' ? 'green' : status === 'IN_USE' ? 'orange' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Components',
      key: 'components',
      render: (_, record) => (
        <div>
          <Text>{record.components?.length || 0} components</Text>
          <br />
          <Button 
            type="link" 
            size="small" 
            onClick={() => manageComponents(record)}
            style={{ padding: 0, height: 'auto' }}
          >
            Manage Components
          </Button>
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => editKit(record)}>
              Edit
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button type="default" size="small" icon={<EyeOutlined />} onClick={() => showKitDetails(record)}>
              Details
            </Button>
          </motion.div>
        </Space>
      )
    }
  ];

  const showKitDetails = (kit) => {
    Modal.info({
      title: 'Kit Details',
      width: 700,
      content: (
        <div>
          <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="ID">
              <Text code>{kit.id}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Kit Name">{kit.kitName}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={kit.type === 'LECTURER_KIT' ? 'red' : kit.type === 'STUDENT_KIT' ? 'blue' : 'default'}>
                {kit.type}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={kit.status === 'AVAILABLE' ? 'green' : kit.status === 'IN_USE' ? 'orange' : 'red'}>
                {kit.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total Quantity">{kit.quantityTotal}</Descriptions.Item>
            <Descriptions.Item label="Available Quantity">{kit.quantityAvailable}</Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>{kit.description || 'No description'}</Descriptions.Item>
            <Descriptions.Item label="Image URL" span={2}>
              {kit.imageUrl && kit.imageUrl !== 'null' ? (
                <div>
                  <Text code style={{ fontSize: '12px', wordBreak: 'break-all' }}>{kit.imageUrl}</Text>
                  <br />
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={() => window.open(kit.imageUrl, '_blank')}
                    style={{ padding: 0, marginTop: 4 }}
                  >
                    Open Image
                  </Button>
                </div>
              ) : (
                <Text type="secondary">No image available</Text>
              )}
            </Descriptions.Item>
          </Descriptions>
          
          <Divider>Components</Divider>
          
          {kit.components && kit.components.length > 0 ? (
            <Table
              dataSource={kit.components}
              columns={[
                { title: 'Component Name', dataIndex: 'name', key: 'name' },
                { 
                  title: 'Amount', 
                  dataIndex: 'amount', 
                  key: 'amount',
                  render: (amt) => (
                    <Text strong style={{ color: '#1890ff' }}>
                      {amt ? Number(amt).toLocaleString() : 0} VND
                    </Text>
                  )
                },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                { 
                  title: 'Condition', 
                  dataIndex: 'condition', 
                  key: 'condition',
                  render: (condition) => (
                    <Tag color={condition === 'New' ? 'green' : condition === 'Used' ? 'orange' : 'red'}>
                      {condition}
                    </Tag>
                  )
                }
              ]}
              pagination={false}
              size="small"
            />
          ) : (
            <Text type="secondary">No components available (0 components)</Text>
          )}
        </div>
      )
    });
  };

  const editKit = (kit) => {
    setEditingKit(kit);
    
    // Map API data to form field names
    const formData = {
      name: kit.kitName || kit.name, // Map kitName to name field
      category: kit.type || kit.category, // Map type to category field
      quantityTotal: kit.quantityTotal,
      quantityAvailable: kit.quantityAvailable,
      status: kit.status,
      description: kit.description,
      imageUrl: kit.imageUrl
    };
    
    console.log('Editing kit:', kit);
    console.log('Form data:', formData);
    
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const manageComponents = (kit) => {
    setEditingKit(kit);
    setComponents(kit.components || []);
    setComponentModalVisible(true);
  };

  const addComponent = () => {
    setEditingComponent({});
    form.resetFields();
    setComponentFormVisible(true);
  };

  const editComponent = (component) => {
    // Map the component data to match form field names
    const mappedComponent = {
      id: component.id,
      componentName: component.componentName || component.name,
      componentType: component.componentType || component.type,
      description: component.description,
      quantityTotal: component.quantityTotal,
      quantityAvailable: component.quantityAvailable,
      pricePerCom: component.pricePerCom,
      status: component.status,
      imageUrl: component.imageUrl
    };
    setEditingComponent(mappedComponent);
    
    // Populate form with component data
    form.setFieldsValue({
      componentName: mappedComponent.componentName,
      componentType: mappedComponent.componentType,
      description: mappedComponent.description,
      quantityTotal: mappedComponent.quantityTotal,
      quantityAvailable: mappedComponent.quantityAvailable,
      pricePerCom: mappedComponent.pricePerCom,
      status: mappedComponent.status,
      imageUrl: mappedComponent.imageUrl
    });
    
    setComponentFormVisible(true);
  };

  const handleComponentSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingComponent && editingComponent.id) {
        // Update existing component
        const componentData = {
          kitId: editingKit.id, // Add kit_id to associate component with the kit
          componentName: values.componentName,
          componentType: values.componentType,
          description: values.description || '',
          quantityTotal: values.quantityTotal,
          quantityAvailable: values.quantityAvailable,
          pricePerCom: values.pricePerCom || 0,
          status: values.status,
          imageUrl: values.imageUrl || ''
        };

        console.log('Updating component with data:', componentData);
        const response = await kitComponentAPI.updateComponent(editingComponent.id, componentData);
        console.log('Update response:', response);
        
        // The backend returns the component data directly
        if (response && response.id) {
          // Refresh components from backend to get the latest data
          await loadComponents();
          
          // Close the form modal after successful update
          setComponentFormVisible(false);
          setEditingComponent(null);
          
          notification.success({
            message: 'Success',
            description: 'Component updated successfully',
            placement: 'topRight',
            duration: 4,
          });
        } else {
          notification.error({
            message: 'Error',
            description: 'Failed to update component',
            placement: 'topRight',
            duration: 4,
          });
        }
      } else {
        // Create new component using backend API
        const componentData = {
          kitId: editingKit.id, // Add kit_id to associate component with the kit
          componentName: values.componentName,
          componentType: values.componentType,
          description: values.description || '',
          quantityTotal: values.quantityTotal,
          quantityAvailable: values.quantityAvailable,
          pricePerCom: values.pricePerCom || 0,
          status: values.status,
          imageUrl: values.imageUrl || ''
        };

        const response = await kitComponentAPI.createComponent(componentData);
        
        // The backend returns the component data directly
        if (response && response.id) {
          console.log('Create component: Success, calling loadComponents()');
          // Refresh components from backend to get the latest data
          await loadComponents();
          
          // Close the form modal after successful creation
          setComponentFormVisible(false);
          setEditingComponent(null);
          
          notification.success({
            message: 'Success',
            description: 'Component created successfully',
            placement: 'topRight',
            duration: 4,
          });
        }
      }
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save component: ' + error.message,
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteComponent = async (componentId) => {
    try {
      const response = await kitComponentAPI.deleteComponent(componentId);
      console.log('Delete component response:', response);
      
      // The backend returns "Your KitComponent is Delete successfully" string
      if (response !== undefined && response !== null) {
        console.log('Delete component: Success, calling loadComponents()');
        // Refresh components from backend to get the latest data
        await loadComponents();
        
        notification.success({
          message: 'Success',
          description: 'Component deleted successfully',
          placement: 'topRight',
          duration: 4,
        });
      }
    } catch (error) {
      console.error('Error deleting component:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to delete component: ' + error.message,
        placement: 'topRight',
        duration: 4,
      });
    }
  };

  const saveComponents = () => {
    setKits(prev => prev.map(kit => 
      kit.id === editingKit.id ? { ...kit, components: components } : kit
    ));
    setComponentModalVisible(false);
    setEditingKit(null);
    setComponents([]);
    notification.success({
      message: 'Success',
      description: 'Components saved successfully',
      placement: 'topRight',
      duration: 3,
    });
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
    if (editingKit) {
        // Update existing kit using backend API
        const kitData = {
          kitName: values.name, // Map name back to kitName
          type: values.category, // Map category back to type
          quantityTotal: values.quantityTotal,
          quantityAvailable: values.quantityAvailable,
          status: values.status,
          description: values.description,
          imageUrl: values.imageUrl
        };

        console.log('Updating kit with data:', kitData);
        const response = await kitAPI.updateKit(editingKit.id, kitData);
        console.log('Update kit response:', response);
        
        if (response) {
          // Refresh kits from backend to get the latest data
          const updatedKitsResponse = await kitAPI.getAllKits();
          if (Array.isArray(updatedKitsResponse)) {
            setKits(updatedKitsResponse);
          }
          
          // Close modal and reset form
          setModalVisible(false);
          setEditingKit(null);
          form.resetFields();
          
      notification.success({
        message: 'Success',
        description: 'Kit updated successfully',
        placement: 'topRight',
          duration: 4,
      });
        } else {
          notification.error({
            message: 'Error',
            description: 'Failed to update kit',
            placement: 'topRight',
            duration: 4,
          });
        }
    } else {
        // Create new kit using backend API
        const kitData = {
          kitName: values.name,
          type: values.category?.toUpperCase() || 'STUDENT_KIT',
        status: 'AVAILABLE',
          description: values.description || '',
          imageUrl: values.imageUrl || '',
          quantityTotal: values.quantityTotal || 1,
          quantityAvailable: values.quantityAvailable || values.quantityTotal || 1,
          components: values.components || []
        };

        const response = await kitAPI.createSingleKit(kitData);
        
        if (response.data) {
          const newKit = {
            id: response.data.id,
            ...response.data
      };
      setKits(prev => [...prev, newKit]);
      notification.success({
        message: 'Success',
            description: response.message || 'Kit created successfully',
        placement: 'topRight',
            duration: 4,
      });
    }
      }
      
    setModalVisible(false);
    setEditingKit(null);
    form.resetFields();
    } catch (error) {
      notification.error({
        message: 'Error',
        description: 'Failed to save kit: ' + error.message,
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          title="Kit Management"
          extra={
            <Space>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload
                  accept=".xlsx,.xls"
                  showUploadList={false}
                  beforeUpload={(file) => {
                    handleImportKits(file);
                    return false;
                  }}
                >
                  <Button 
                    icon={<ImportOutlined />}
                    style={{
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                      border: 'none',
                      fontWeight: 'bold',
                      color: '#fff'
                    }}
                  >
                    Import Kits
                  </Button>
                </Upload>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  icon={<ExportOutlined />}
                  onClick={handleExportKits}
                  style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                    border: 'none',
                    fontWeight: 'bold',
                    color: '#fff'
                  }}
                >
                  Export Kits
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => setModalVisible(true)}
                  style={{
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Add Kit
                </Button>
              </motion.div>
            </Space>
          }
          style={{
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}
          headStyle={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <Table 
            columns={columns} 
            dataSource={kits} 
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
          />
        </Card>
      </motion.div>

      <Modal
        title={editingKit ? 'Edit Kit' : 'Add Kit'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingKit(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        centered
        destroyOnClose
        maskClosable={false}
        style={{ top: 20 }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Kit Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Kit Type" rules={[{ required: true }]}>
            <Select>
              <Option value="STUDENT_KIT">Student Kit</Option>
              <Option value="LECTURER_KIT">Lecturer Kit</Option>
            </Select>
          </Form.Item>
          <Form.Item name="quantityTotal" label="Total Quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="quantityAvailable" label="Available Quantity" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select>
              <Option value="AVAILABLE">Available</Option>
              <Option value="IN_USE">In Use</Option>
              <Option value="MAINTENANCE">Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="primary" htmlType="submit">
                  {editingKit ? 'Update' : 'Add'}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button onClick={() => {
                  setModalVisible(false);
                  setEditingKit(null);
                  form.resetFields();
                }}>
                  Cancel
                </Button>
              </motion.div>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Component Management Modal */}
      <Modal
        title={`Manage Components - ${editingKit?.name || 'Kit'}`}
        open={componentModalVisible}
        onCancel={() => {
          setComponentModalVisible(false);
          setEditingKit(null);
          setComponents([]);
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setComponentModalVisible(false);
            setEditingKit(null);
            setComponents([]);
          }}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={saveComponents}>
            Save Components
          </Button>
        ]}
        width={800}
        centered
        destroyOnClose
        maskClosable={false}
        style={{ top: 20 }}
      >
        <div style={{ marginBottom: 16 }}>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addComponent}
            style={{
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
              border: 'none',
              fontWeight: 'bold'
            }}
          >
            Add Component
          </Button>
        </div>

        <Table
          dataSource={components}
          columns={[
            { title: 'Component Name', dataIndex: 'componentName', key: 'componentName' },
            { title: 'Type', dataIndex: 'componentType', key: 'componentType' },
            { title: 'Total Quantity', dataIndex: 'quantityTotal', key: 'quantityTotal' },
            { title: 'Available Quantity', dataIndex: 'quantityAvailable', key: 'quantityAvailable' },
            { title: 'Price (VND)', dataIndex: 'pricePerCom', key: 'pricePerCom' },
            { 
              title: 'Status', 
              dataIndex: 'status', 
              key: 'status',
              render: (status) => (
                <Tag color={status === 'AVAILABLE' ? 'green' : status === 'IN_USE' ? 'orange' : status === 'MAINTENANCE' ? 'blue' : 'red'}>
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
                    type="default" 
                    size="small" 
                    icon={<EditOutlined />} 
                    onClick={() => editComponent(record)}
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Are you sure you want to delete this component?"
                    onConfirm={() => deleteComponent(record.id)}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button 
                      type="default" 
                      size="small" 
                      danger 
                      icon={<DeleteOutlined />}
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
          pagination={false}
          size="small"
        />

        {/* Component Form Modal */}
        <Modal
          title={editingComponent && editingComponent.id ? 'Edit Component' : 'Add Component'}
          open={componentFormVisible}
          onCancel={() => {
            setEditingComponent(null);
            setComponentFormVisible(false);
          }}
          footer={null}
          width={500}
          centered
          destroyOnClose
          maskClosable={false}
        >
          <Form 
            layout="vertical" 
            onFinish={handleComponentSubmit}
            initialValues={editingComponent || {}}
          >
            <Form.Item 
              name="componentName" 
              label="Component Name" 
              rules={[{ required: true, message: 'Please enter component name' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item 
              name="componentType" 
              label="Component Type" 
              rules={[{ required: true, message: 'Please select component type' }]}
            >
              <Select>
                <Option value="RED">Red</Option>
                <Option value="BLACK">Black</Option>
                <Option value="WHITE">White</Option>
              </Select>
            </Form.Item>
            <Form.Item 
              name="quantityTotal" 
              label="Total Quantity" 
              rules={[{ required: true, message: 'Please enter total quantity' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item 
              name="quantityAvailable" 
              label="Available Quantity" 
              rules={[{ required: true, message: 'Please enter available quantity' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item 
              name="pricePerCom" 
              label="Price Per Component (VND)"
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item 
              name="status" 
              label="Status" 
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select>
                <Option value="AVAILABLE">Available</Option>
                <Option value="IN_USE">In Use</Option>
                <Option value="MAINTENANCE">Maintenance</Option>
                <Option value="DAMAGED">Damaged</Option>
              </Select>
            </Form.Item>
            <Form.Item 
              name="description" 
              label="Description"
            >
              <Input.TextArea />
            </Form.Item>
            <Form.Item 
              name="imageUrl" 
              label="Image URL"
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  {editingComponent ? 'Update' : 'Add'}
                </Button>
                <Button onClick={() => {
                  setEditingComponent(null);
                  form.resetFields();
                  setComponentFormVisible(false);
                }}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Modal>
    </div>
  );
};

// Rental Approvals Component
const RentalApprovals = ({ rentalRequests, setRentalRequests, setLogHistory, setTransactions, setRefundRequests, onNavigateToRefunds }) => {
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => id ? `#${id.substring(0, 8)}...` : 'N/A'
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div>{record.requestedBy?.fullName || 'N/A'}</div>
          <Text type="secondary">{record.requestedBy?.email || 'N/A'}</Text>
        </div>
      )
    },
    {
      title: 'Kit',
      dataIndex: 'kit',
      key: 'kit',
      render: (kit) => kit?.kitName || 'N/A'
    },
    {
      title: 'Request Type',
      dataIndex: 'requestType',
      key: 'requestType'
    },
    {
      title: 'Deposit Amount',
      dataIndex: 'depositAmount',
      key: 'depositAmount',
      render: (amount) => `${(amount || 0).toLocaleString()} VND`
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
      render: (status, record) => {
        const isEditing = selectedStatuses[record.id]?.editing || false;
        const selectedStatus = selectedStatuses[record.id]?.value || status;
        
        return (
          <Space>
            {isEditing ? (
              <>
                <Select
                  value={selectedStatus}
                  onChange={(newStatus) => setSelectedStatuses(prev => ({ 
                    ...prev, 
                    [record.id]: { 
                      ...prev[record.id], 
                      value: newStatus 
                    } 
                  }))}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="PENDING">Pending</Option>
                  <Option value="APPROVED">Approved</Option>
                  <Option value="REJECTED">Rejected</Option>
                  <Option value="BORROWED">Borrowed</Option>
                  <Option value="RETURNED">Returned</Option>
                </Select>
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleStatusChange(record.id, selectedStatus)}
                  style={{
                    background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                    border: 'none',
                    color: '#fff'
                  }}
                >
                  Apply
                </Button>
                <Button
                  type="default"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setSelectedStatuses(prev => {
                    const newState = { ...prev };
                    delete newState[record.id];
                    return newState;
                  })}
                  style={{
                    border: '1px solid #d9d9d9',
                    color: '#666'
                  }}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Tag 
                  color={
                    status === 'PENDING' ? 'orange' : 
                    status === 'APPROVED' ? 'green' : 
                    status === 'REJECTED' ? 'red' : 
                    status === 'BORROWED' ? 'blue' : 
                    status === 'RETURNED' ? 'green' : 'default'
                  }
                  style={{ minWidth: 80, textAlign: 'center' }}
                >
                  {status || 'PENDING'}
                </Tag>
                {status === 'APPROVED' && (
                  <Button
                    type="default"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setSelectedStatuses(prev => ({ 
                      ...prev, 
                      [record.id]: { 
                        editing: true, 
                        value: status 
                      } 
                    }))}
                    style={{
                      border: '1px solid #d9d9d9',
                      color: '#666'
                    }}
                  >
                    Edit
                  </Button>
                )}
              </>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'PENDING' ? (
            <>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApproval(record.id, 'approve')}>
                  Approve
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button type="primary" danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleApproval(record.id, 'reject')}>
                  Reject
                </Button>
              </motion.div>
            </>
          ) : null}
        </Space>
      )
    }
  ];

  const handleStatusChange = (id, newStatus) => {
    const request = rentalRequests.find(req => req.id === id);
    
    // If status is changing to BORROWED, add to log history and remove from rental requests
    if (newStatus === 'BORROWED') {
      // Add to log history
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'RENTAL_REQUEST_BORROWED',
        type: 'rental',
        user: request.userEmail,
        userName: request.userName,
        details: {
          kitName: request.kitName,
          kitId: request.kitId || `KIT-${request.id}`,
          requestId: `REQ-${request.id}`,
          reason: request.reason || 'Course project',
          duration: `${request.duration} days`,
          borrowedBy: 'admin@fpt.edu.vn',
          borrowNotes: 'Kit borrowed by student'
        },
        status: 'BORROWED',
        adminAction: 'borrowed',
        adminUser: 'admin@fpt.edu.vn',
        adminTimestamp: new Date().toISOString()
      };
      
      setLogHistory(prev => [logEntry, ...prev]);
      
      // Remove from rental requests
      setRentalRequests(prev => prev.filter(req => req.id !== id));
      
      notification.success({
        message: 'Kit Borrowed',
        description: `Kit has been marked as borrowed and moved to log history`,
        placement: 'topRight',
        duration: 3,
      });
    } else {
      // Normal status update
      setRentalRequests(prev => prev.map(req => 
        req.id === id ? { 
          ...req, 
          status: newStatus,
          updatedBy: 'admin@fpt.edu.vn',
          updatedDate: new Date().toISOString()
        } : req
      ));
      
      notification.success({
        message: 'Status Updated',
        description: `Rental request status changed to ${newStatus.replace('_', ' ')}`,
        placement: 'topRight',
        duration: 3,
      });
    }
    
    // Clear the editing state for this record
    setSelectedStatuses(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };


  const handleApproval = async (id, action) => {
    try {
      const request = rentalRequests.find(req => req.id === id);
      
      // Determine the status based on action
      const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';
      
      // Prepare request body for update
      const updateData = {
        status: newStatus,
        note: action === 'reject' ? 'Request rejected by admin' : 'Request approved by admin'
      };
      
      // Call API to update the borrowing request
      await borrowingRequestAPI.update(id, updateData);
      
      // Update local state
      setRentalRequests(prev => prev.map(req => 
        req.id === id ? { 
          ...req, 
          status: newStatus,
          approvedDate: action === 'approve' ? new Date().toISOString() : req.approvedDate,
          note: updateData.note
        } : req
      ));
      
      // Reload transaction history when approved
      if (action === 'approve') {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_SUCCESS',
              title: 'Yêu cầu thuê kit được chấp nhận',
              message: `Yêu cầu thuê kit ${request?.kit?.kitName || ''} của bạn đã được admin phê duyệt.`,
              userId: request?.requestedBy?.id
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending approval notifications:', notifyError);
        }
        try {
          const transactionsResponse = await walletTransactionAPI.getAll();
          if (Array.isArray(transactionsResponse)) {
            setTransactions(transactionsResponse);
            console.log('Transaction history reloaded');
          }
        } catch (error) {
          console.error('Error reloading transactions:', error);
        }
      }
      
      // Add to log history when rejected
      if (action === 'reject') {
        const logEntry = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          action: 'RENTAL_REQUEST_REJECTED',
          type: 'rental',
          user: request.requestedBy?.email || 'N/A',
          userName: request.requestedBy?.fullName || 'N/A',
          details: {
            kitName: request.kit?.kitName || 'N/A',
            kitId: request.kit?.id || 'N/A',
            requestId: request.id,
            reason: request.reason || 'Course project',
            rejectedBy: 'admin@fpt.edu.vn',
            rejectionReason: 'Rental request rejected by admin',
            fineAmount: 0
          },
          status: 'REJECTED',
          adminAction: 'rejected',
          adminUser: 'admin@fpt.edu.vn',
          adminTimestamp: new Date().toISOString()
        };
        
        setLogHistory(prev => [logEntry, ...prev]);
        
        // Send rejection notification to user
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REJECTED',
              title: 'Yêu cầu thuê kit bị từ chối',
              message: `Yêu cầu thuê kit ${request?.kit?.kitName || ''} của bạn đã bị admin từ chối.`,
              userId: request?.requestedBy?.id
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending rejection notification:', notifyError);
        }
      }

      // When approved, refresh refund requests from backend and navigate to refund checking tab
      if (action === 'approve') {
        // Reload approved requests from backend
        try {
          const approvedResponse = await borrowingRequestAPI.getApproved();
          console.log('Refreshed approved requests:', approvedResponse);
          
        if (Array.isArray(approvedResponse)) {
          // Transform approved requests to refund request format
          const refundRequestsData = approvedResponse.map(req => ({
            id: req.id,
            rentalId: req.id,
            kitId: req.kit?.id || 'N/A',
            kitName: req.kit?.kitName || 'N/A',
            userEmail: req.requestedBy?.email || 'N/A',
            userName: req.requestedBy?.fullName || 'N/A',
            status: 'pending',
            requestDate: req.createdAt || new Date().toISOString(),
            approvedDate: req.approvedDate || new Date().toISOString(),
            totalCost: req.depositAmount || 0,
            damageAssessment: {},
            reason: req.reason || 'Course project',
            depositAmount: req.depositAmount || 0,
            requestType: req.requestType // Add request type
          }));
            
            setRefundRequests(refundRequestsData);
            console.log('Refund requests updated from backend:', refundRequestsData.length);
          }
        } catch (refreshError) {
          console.error('Error refreshing approved requests:', refreshError);
        }

        // Navigate to refund checking tab after a short delay
        setTimeout(() => {
          if (onNavigateToRefunds) {
            onNavigateToRefunds();
          }
        }, 1000);
      }
      
      notification.success({
        message: action === 'approve' ? 'Request Approved' : 'Request Rejected',
        description: action === 'approve' 
          ? 'Request approved successfully! Navigate to Refund Checking to monitor refund status.'
          : 'Request rejected successfully',
        placement: 'topRight',
        duration: 4,
      });
    } catch (error) {
      console.error('Error updating request:', error);
      notification.error({
        message: 'Error',
        description: `Failed to ${action === 'approve' ? 'approve' : 'reject'} request: ${error.message}`,
        placement: 'topRight',
        duration: 5,
      });
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        title="Rental Request Management"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          overflow: 'hidden'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0'
        }}
      >
        <Table 
          columns={columns} 
          dataSource={rentalRequests} 
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </Card>
    </motion.div>
  );
};

// Refund Approvals Component
const RefundApprovals = ({ refundRequests, setRefundRequests, openRefundKitInspection, setLogHistory }) => {
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const columns = [
    {
      title: 'Request ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${String(id).substring(0, 8)}...`
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName'
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (type) => (
        <Tag color={type === 'BORROW_COMPONENT' ? 'orange' : 'blue'}>
          {type === 'BORROW_COMPONENT' ? 'Component' : 'Full Kit'}
        </Tag>
      )
    },
    {
      title: 'Kit/Component',
      dataIndex: 'kitName',
      key: 'kitName'
    },
    {
      title: 'Request Date',
      dataIndex: 'requestDate',
      key: 'requestDate',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="green" style={{ minWidth: 80, textAlign: 'center' }}>
          APPROVED
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
              <Button 
                type="primary" 
                size="small" 
                icon={<BuildOutlined />} 
                onClick={() => {
                  console.log('Checkin Kit button clicked, record:', record);
                  openRefundKitInspection(record);
                }}
              >
                Checkin Kit
              </Button>
          </motion.div>
        </Space>
      )
    }
  ];

  // Removed unused handleRefundStatusChange function
  const _handleRefundStatusChange = (id, newStatus) => {
    const request = refundRequests.find(req => req.id === id);
    
    // If status is changing to REJECTED, add to log history and remove from refund requests
    if (newStatus === 'REJECTED') {
      // Add to log history
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'REFUND_REQUEST_REJECTED',
        type: 'refund',
        user: request.userEmail,
        userName: request.userName || request.userEmail,
        details: {
          kitName: request.kitName,
          kitId: request.kitId || `KIT-${request.id}`,
          requestId: `REF-${request.id}`,
          reason: request.reason || 'Refund request',
          damageDescription: request.damageDescription || 'N/A',
          originalRentalId: request.originalRentalId || `RENT-${request.id}`,
          rejectedBy: 'admin@fpt.edu.vn',
          rejectionReason: 'Refund request rejected by admin',
          fineAmount: request.fineAmount || 0
        },
        status: 'REJECTED',
        adminAction: 'rejected',
        adminUser: 'admin@fpt.edu.vn',
        adminTimestamp: new Date().toISOString()
      };
      
      setLogHistory(prev => [logEntry, ...prev]);
      
      // Remove from refund requests
      setRefundRequests(prev => prev.filter(req => req.id !== id));
      
      notification.success({
        message: 'Refund Rejected',
        description: `Refund request has been rejected and moved to log history`,
        placement: 'topRight',
        duration: 3,
      });
    } else if (newStatus === 'RETURNED') {
      // If status is changing to RETURNED, add to log history and remove from refund requests
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'REFUND_REQUEST_RETURNED',
        type: 'refund',
        user: request.userEmail,
        userName: request.userName || request.userEmail,
        details: {
          kitName: request.kitName,
          kitId: request.kitId || `KIT-${request.id}`,
          requestId: `REF-${request.id}`,
          reason: request.reason || 'Refund request',
          damageDescription: 'No damage found',
          originalRentalId: request.originalRentalId || `RENT-${request.id}`,
          returnedBy: 'admin@fpt.edu.vn',
          returnNotes: 'Kit returned in good condition'
        },
        status: 'RETURNED',
        adminAction: 'returned',
        adminUser: 'admin@fpt.edu.vn',
        adminTimestamp: new Date().toISOString()
      };
      
      setLogHistory(prev => [logEntry, ...prev]);
      
      // Remove from refund requests
      setRefundRequests(prev => prev.filter(req => req.id !== id));
      
      notification.success({
        message: 'Kit Returned',
        description: `Kit has been returned successfully and moved to log history`,
        placement: 'topRight',
        duration: 3,
      });
    } else {
      // Normal status update
      setRefundRequests(prev => prev.map(req => 
        req.id === id ? { 
          ...req, 
          status: newStatus,
          updatedBy: 'admin@fpt.edu.vn',
          updatedDate: new Date().toISOString()
        } : req
      ));
      
      notification.success({
        message: 'Status Updated',
        description: `Refund request status changed to ${newStatus.replace('_', ' ')}`,
        placement: 'topRight',
        duration: 3,
      });
    }
    
    // Clear the editing state for this record
    setSelectedStatuses(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  // Removed unused handleRefundApproval function
  const _handleRefundApproval = (id, action) => {
    const request = refundRequests.find(req => req.id === id);
    
    if (action === 'approve') {
      setRefundRequests(prev => prev.map(req => 
        req.id === id ? { 
          ...req, 
          status: 'approved',
          approvedBy: 'admin@fpt.edu.vn',
          approvalDate: new Date().toISOString()
        } : req
      ));
      
      notification.success({
        message: 'Success',
        description: `Refund request approved successfully`,
        placement: 'topRight',
        duration: 3,
      });
    } else {
      // Add to log history when rejected
      const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'REFUND_REQUEST_REJECTED',
        type: 'refund',
        user: request.userEmail,
        userName: request.userName || request.userEmail,
        details: {
          kitName: request.kitName,
          kitId: request.kitId || `KIT-${request.id}`,
          requestId: `REF-${request.id}`,
          reason: request.reason || 'Refund request',
          damageDescription: request.damageDescription || 'N/A',
          originalRentalId: request.originalRentalId || `RENT-${request.id}`,
          rejectedBy: 'admin@fpt.edu.vn',
          rejectionReason: 'Refund request rejected by admin',
          fineAmount: request.fineAmount || 0
        },
        status: 'REJECTED',
        adminAction: 'rejected',
        adminUser: 'admin@fpt.edu.vn',
        adminTimestamp: new Date().toISOString()
      };
      
      setLogHistory(prev => [logEntry, ...prev]);
      
      // Remove from refund requests
      setRefundRequests(prev => prev.filter(req => req.id !== id));
      
      notification.success({
        message: 'Refund Rejected',
        description: `Refund request has been rejected and moved to log history`,
        placement: 'topRight',
        duration: 3,
      });
    }
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        title="Refund Checking Management"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          overflow: 'hidden'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0'
        }}
      >
        <Table 
          columns={columns} 
          dataSource={refundRequests} 
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </Card>
    </motion.div>
  );
};

// Fine Management Component
const FineManagement = ({ fines, setFines, setLogHistory }) => {
  const [fineDetailModalVisible, setFineDetailModalVisible] = useState(false);
  const [selectedFine, setSelectedFine] = useState(null);

  const columns = [
    {
      title: 'Fine ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => `#${id}`
    },
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
      render: (name, record) => (
        <div>
          <div>{name}</div>
          <Text type="secondary">{record.studentEmail}</Text>
        </div>
      )
    },
    {
      title: 'Group Leader',
      dataIndex: 'leaderName',
      key: 'leaderName',
      render: (name, record) => (
        <div>
          <div>{name}</div>
          <Text type="secondary">{record.leaderEmail}</Text>
        </div>
      )
    },
    {
      title: 'Fine Amount',
      dataIndex: 'fineAmount',
      key: 'fineAmount',
      render: (amount) => (
        <Text strong style={{ color: '#cf1322' }}>
          {amount.toLocaleString()} VND
        </Text>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => showFineDetails(record)}
            >
              Details
            </Button>
          </motion.div>
        </Space>
      )
    }
  ];

  const showFineDetails = (fine) => {
    setSelectedFine(fine);
    setFineDetailModalVisible(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        title="Fine Management"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          overflow: 'hidden'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0'
        }}
      >
        <Table 
          columns={columns} 
          dataSource={fines} 
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
          }}
        />
      </Card>

      {/* Fine Details Modal */}
      <Modal
        title="Fine Details"
        open={fineDetailModalVisible}
        onCancel={() => {
          setFineDetailModalVisible(false);
          setSelectedFine(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setFineDetailModalVisible(false);
            setSelectedFine(null);
          }}>
            Close
          </Button>
        ]}
        width={700}
        centered
      >
        {selectedFine && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Fine ID">#{selectedFine.id}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={selectedFine.status === 'paid' ? 'green' : 'orange'}>
                  {selectedFine.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Student">{selectedFine.studentName}</Descriptions.Item>
              <Descriptions.Item label="Student Email">{selectedFine.studentEmail}</Descriptions.Item>
              <Descriptions.Item label="Group Leader">{selectedFine.leaderName}</Descriptions.Item>
              <Descriptions.Item label="Leader Email">{selectedFine.leaderEmail}</Descriptions.Item>
              <Descriptions.Item label="Fine Amount">
                <Text strong style={{ color: '#cf1322' }}>
                  {selectedFine.fineAmount.toLocaleString()} VND
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created">{new Date(selectedFine.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Due Date">{new Date(selectedFine.dueDate).toLocaleString()}</Descriptions.Item>
            </Descriptions>
            
            <Divider>Damage Assessment</Divider>
            
            {selectedFine.damageAssessment && Object.keys(selectedFine.damageAssessment).length > 0 ? (
              Object.entries(selectedFine.damageAssessment).map(([component, assessment]) => (
                assessment.damaged && (
                  <Card key={component} size="small" style={{ marginBottom: 8 }}>
                    <Row justify="space-between" align="middle">
                      <Col>
                        <Text strong>{component}</Text>
                      </Col>
                      <Col>
                        <Text type="danger">{assessment.value.toLocaleString()} VND</Text>
                      </Col>
                    </Row>
                  </Card>
                )
              ))
            ) : (
              <Alert
                message="No Damage Assessment"
                description="No damage assessment recorded for this fine."
                type="info"
                showIcon
              />
            )}
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

// Group Management Component
const GroupManagement = ({ groups, setGroups, adjustGroupMembers, availableStudents }) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [lecturers, setLecturers] = useState([]);
  const [loadingLecturers, setLoadingLecturers] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  // Add student modal state
  const [addStudentModalVisible, setAddStudentModalVisible] = useState(false);
  const [selectedGroupRecord, setSelectedGroupRecord] = useState(null);
  const [studentsToAdd, setStudentsToAdd] = useState([]);
  const [isFirstMember, setIsFirstMember] = useState(false);
  const [addingLoading, setAddingLoading] = useState(false);

  // Load lecturers and classes when component mounts
  useEffect(() => {
    loadLecturers();
    loadClasses();
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      const studentGroups = await studentGroupAPI.getAll();
      
      // Get all borrowing groups for each student group
      const groupsWithMembers = await Promise.all(
        studentGroups.map(async (group) => {
          const borrowingGroups = await borrowingGroupAPI.getByStudentGroupId(group.id);
          
          // Map borrowing groups to members list
          const members = borrowingGroups.map(bg => {
            return {
              id: bg.accountId,
              name: bg.accountName,
              email: bg.accountEmail,
              role: bg.roles
            };
          });

          // Find leader
          const leader = borrowingGroups.find(bg => bg.roles === 'LEADER');
          
          return {
            id: group.id,
            groupName: group.groupName || group.name, // Support both field names
            classId: group.classId,
            lecturer: group.lecturerEmail || (group.accountId ? group.lecturerEmail : null), // Use lecturerEmail from response
            lecturerName: group.lecturerName, // Store lecturer name for display
            leader: leader ? leader.accountEmail : null,
            members: members.map(m => m.email),
            status: group.status,
            lecturerId: group.accountId // Store lecturer account ID
          };
        })
      );

      console.log('Loaded groups:', groupsWithMembers);
      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error loading groups:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load groups',
        placement: 'topRight',
      });
    }
  };

  const loadLecturers = async () => {
    setLoadingLecturers(true);
    try {
      const lecturerList = await userAPI.getLecturers();
      setLecturers(lecturerList);
    } catch (error) {
      console.error('Failed to load lecturers:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load lecturers',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setLoadingLecturers(false);
    }
  };

  const loadClasses = async () => {
    setLoadingClasses(true);
    try {
      const classesList = await classesAPI.getAllClasses();
      // Map classes to dropdown options
      const classOptions = classesList.map(cls => ({
        value: cls.id,
        label: `${cls.classCode} - ${cls.semester}`,
        classCode: cls.classCode,
        semester: cls.semester
      }));
      setClasses(classOptions);
    } catch (error) {
      console.error('Failed to load classes:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load classes',
        placement: 'topRight',
        duration: 3,
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const columns = [
    {
      title: 'Group Name',
      dataIndex: 'groupName',
      key: 'groupName',
      render: (groupName) => groupName || '-'
    },
    {
      title: 'IoT Subject',
      dataIndex: 'classId',
      key: 'classId',
      render: (classId) => {
        const classInfo = classes.find(c => c.value === classId);
        return classInfo ? classInfo.label : '-';
      }
    },
    {
      title: 'Leader',
      dataIndex: 'leader',
      key: 'leader',
      render: (leader) => leader || '-'
    },
    {
      title: 'Lecturer',
      dataIndex: 'lecturerName',
      key: 'lecturerName',
      render: (lecturerName, record) => {
        // Use lecturerName directly from the response, or fallback to lecturerEmail
        return lecturerName || record.lecturer || '-';
      }
    },
    {
      title: 'Members',
      dataIndex: 'members',
      key: 'members',
      render: (members) => (
        <div>
          {members?.map((member, index) => (
            <Tag key={index} style={{ marginBottom: 4 }}>{member}</Tag>
          ))}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              size="small" 
              icon={<UserOutlined />}
              onClick={() => handleAddStudentToGroup(record)}
              style={{
                background: 'linear-gradient(135deg, #52c41a 0%, #389e0d 100%)',
                border: 'none'
              }}
            >
              Add Student
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="default" 
              size="small" 
              icon={<EditOutlined />}
              onClick={() => adjustGroupMembers(record)}
            >
              Adjust Members
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Popconfirm
              title="Delete Group"
              description={`Are you sure you want to delete group "${record.groupName}"? This will also delete all associated members.`}
              onConfirm={() => handleDeleteGroup(record.id)}
              okText="Yes"
              cancelText="No"
              okType="danger"
            >
              <Button 
                type="primary" 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          </motion.div>
        </Space>
      )
    }
  ];

  const handleAddStudentToGroup = async (groupRecord) => {
    console.log('handleAddStudentToGroup called with:', groupRecord);
    setSelectedGroupRecord(groupRecord);
    setAddingLoading(true);
    
    try {
      // Get all students
      const allStudents = await userAPI.getStudents();
      console.log('All students:', allStudents);
      
      // Get all existing borrowing groups to check which students are already in groups
      const allBorrowingGroups = await borrowingGroupAPI.getAll();
      console.log('All borrowing groups:', allBorrowingGroups);
      
      // Filter available students (not in any group)
      const availableStudents = allStudents.filter(student => {
        const isInAnyGroup = allBorrowingGroups.some(bg => {
          const bgAccountId = bg.accountId?.toString();
          const studentId = student.id?.toString();
          return bgAccountId === studentId;
        });
        return !isInAnyGroup;
      });
      
      console.log('Total students:', allStudents.length);
      console.log('Students in groups:', allStudents.length - availableStudents.length);
      console.log('Available students:', availableStudents.length);
      
      if (availableStudents.length === 0) {
        notification.warning({
          message: 'No Available Students',
          description: 'All students are already assigned to groups',
          placement: 'topRight',
        });
        return;
      }

      // Check if group already has students
      const existingMembers = await borrowingGroupAPI.getByStudentGroupId(groupRecord.id);
      const firstMember = existingMembers.length === 0;

      // Select random 2-4 students (or less if not enough available)
      const minStudents = 2;
      const maxStudents = 4;
      const availableCount = availableStudents.length;
      const numberOfStudentsToAdd = Math.min(maxStudents, Math.max(minStudents, availableCount));
      
      console.log('Available students:', availableCount);
      console.log('Number of students to add (calculated):', numberOfStudentsToAdd);
      
      if (availableCount < minStudents) {
        notification.warning({
          message: 'Insufficient Students',
          description: `Only ${availableCount} student(s) available. Need at least ${minStudents}.`,
          placement: 'topRight',
        });
        return;
      }
      
      const shuffledStudents = [...availableStudents].sort(() => 0.5 - Math.random());
      const selectedStudents = shuffledStudents.slice(0, numberOfStudentsToAdd);

      console.log('Selected students to add:', selectedStudents);
      console.log('Is first member:', firstMember);
      console.log('Number of students to add:', numberOfStudentsToAdd);
      
      // Set state and show modal
      setStudentsToAdd(selectedStudents);
      setIsFirstMember(firstMember);
      setAddStudentModalVisible(true);
    } catch (error) {
      console.error('Error loading students:', error);
        notification.error({
          message: 'Error',
        description: 'Failed to load students',
          placement: 'topRight',
        });
    } finally {
      setAddingLoading(false);
    }
  };

  const handleConfirmAddStudents = async () => {
    console.log('=== handleConfirmAddStudents called ===');
    console.log('Adding students to group...');
    console.log('Selected students:', studentsToAdd);
    console.log('Is first member:', isFirstMember);
    console.log('Group ID:', selectedGroupRecord?.id);
    
    setAddingLoading(true);
    
    try {
            const addedStudents = [];
            
            // Add each student to the group
      console.log(`Starting loop to add ${studentsToAdd.length} students`);
      for (let i = 0; i < studentsToAdd.length; i++) {
        const student = studentsToAdd[i];
              
              // First student becomes LEADER, others become MEMBERS
              const role = (isFirstMember && i === 0) ? 'LEADER' : 'MEMBER';
              
              const borrowingGroupData = {
          studentGroupId: selectedGroupRecord.id,
                accountId: student.id,
                roles: role
              };

        console.log(`Adding student ${i + 1}/${studentsToAdd.length}:`, {
                student: student.fullName,
                role: role,
                data: borrowingGroupData
              });

              const response = await borrowingGroupAPI.addMemberToGroup(borrowingGroupData);
              console.log('API Response:', response);
              
              addedStudents.push({
                name: student.fullName,
                email: student.email,
                role: role
              });
            }

            // Refresh group data
            await loadGroups();

            notification.success({
        message: `${studentsToAdd.length} Students Added`,
        description: `Successfully added ${studentsToAdd.length} students to the group`,
              placement: 'topRight',
              duration: 4,
            });
      
      // Close modal
      setAddStudentModalVisible(false);
          } catch (error) {
            console.error('Error adding students to group:', error);
            notification.error({
              message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to add students to group',
              placement: 'topRight',
            });
    } finally {
      setAddingLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      await studentGroupAPI.delete(groupId);
      
      // Reload groups after deletion
      await loadGroups();
      
      notification.success({
        message: 'Group Deleted Successfully',
        description: 'The group and all associated members have been deleted.',
        placement: 'topRight',
        duration: 4,
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to delete group',
        placement: 'topRight',
        duration: 4,
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Create empty group using StudentGroupController
      const lecturer = lecturers.find(l => l.value === values.lecturer);
      const groupData = {
        groupName: values.name,
        classId: values.classId,
        accountId: lecturer?.id || null, // Lecturer ID
        status: true,
        roles: null // No role initially (lecturer is not a group role)
      };
      
      const response = await studentGroupAPI.create(groupData);
      
      if (response) {
        // Create local group object for UI
        const newGroup = {
          id: response.id || Date.now(),
          name: values.name,
          lecturer: values.lecturer,
          classId: values.classId,
          leader: null, // No leader initially
          members: [], // Empty members initially
          status: 'active',
          createdAt: new Date().toISOString()
        };
        
        setGroups(prev => [...prev, newGroup]);
        notification.success({
          message: 'Group Created Successfully',
          description: `Group "${values.name}" created. You can now add students to this group.`,
          placement: 'topRight',
          duration: 4,
        });
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Failed to create group:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to create group',
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          title="Group Management"
          extra={
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => setModalVisible(true)}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                Create Group
              </Button>
            </motion.div>
          }
          style={{
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}
          headStyle={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <Table 
            columns={columns} 
            dataSource={groups} 
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
          />
        </Card>
      </motion.div>

      <Modal
        title="Create New Group"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Group Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="classId" label="IoT Subject" rules={[{ required: true, message: 'Please select a class' }]}>
            <Select
              showSearch
              placeholder="Search and select IoT subject"
              optionFilterProp="children"
              loading={loadingClasses}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={classes}
            />
          </Form.Item>
          <Form.Item name="lecturer" label="Lecturer" rules={[{ required: true, message: 'Please select a lecturer' }]}>
            <Select
              showSearch
              placeholder="Search and select lecturer"
              optionFilterProp="children"
              loading={loadingLecturers}
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
                (option?.email ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={lecturers}
            />
          </Form.Item>
          <Alert
            message="Automatic Member Assignment"
            description="When you create a group, the system will automatically assign up to 3 random available students. The first assigned student will become the group leader."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Group with Random Members
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        title={`Add ${studentsToAdd.length} Students to Group "${selectedGroupRecord?.groupName}"`}
        open={addStudentModalVisible}
        onOk={handleConfirmAddStudents}
        onCancel={() => setAddStudentModalVisible(false)}
        confirmLoading={addingLoading}
        okText={`Add ${studentsToAdd.length} Students`}
        cancelText="Cancel"
        width={600}
      >
        <div>
          <p>Selected students to add:</p>
          <List
            size="small"
            dataSource={studentsToAdd}
            renderItem={(student, index) => {
              return (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <span>
                        {isFirstMember && index === 0 && <Tag color="gold">LEADER</Tag>}
                        <Tag color={index === 0 && isFirstMember ? 'blue' : 'default'}>
                          {index === 0 && isFirstMember ? 'LEADER' : 'MEMBER'}
                        </Tag>
                        {student.fullName} ({student.email})
                      </span>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

// User Management Component
const UserManagement = ({ users, setUsers }) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'Phone Number',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => phone || '-'
    },
    {
      title: 'Student Code',
      dataIndex: 'studentCode',
      key: 'studentCode',
      render: (studentCode) => studentCode || '-'
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : role === 'lecturer' ? 'orange' : 'blue'}>
          {role}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>
          {status}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => editUser(record)}>
              Edit
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => deleteUser(record.id)}>
              Delete
            </Button>
          </motion.div>
        </Space>
      )
    }
  ];

  const editUser = (user) => {
    setEditingUser(user);
    setSelectedRole(user.role);
    
    // Map user data to form field names
    const formData = {
      name: user.name || user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      studentCode: user.studentCode || ''
    };
    
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const deleteUser = (id) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this user?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        setUsers(prev => prev.filter(user => user.id !== id));
        notification.success({
          message: 'Success',
          description: 'User deleted successfully',
          placement: 'topRight',
          duration: 3,
        });
      }
    });
  };

  const handleSubmit = async (values) => {
    try {
    if (editingUser) {
        // Update existing user using backend API
        try {
          const updateData = {
            username: values.email,
            password: values.password,
            studentCode: values.studentCode || null,
            roles: values.role?.toUpperCase() || 'STUDENT',
            phoneNumber: values.phone || null,
            fullName: values.name || null
          };

          console.log('Updating user with data:', updateData);
          const response = await authAPI.updateUser(editingUser.id, updateData);
          console.log('Update user response:', response);
          
          if (response && response.email) {
            // Refresh users list from API
            try {
              const usersData = await userAPI.getAllAccounts(0, 100);
              
              if (usersData && usersData.length > 0) {
                const mappedUsers = usersData.map(profile => ({
                  id: profile.id,
                  name: profile.fullName || profile.email || 'Unknown',
                  email: profile.email,
                  phone: profile.phone,
                  studentCode: profile.studentCode,
                  role: profile.role?.toLowerCase() || 'member',
                  status: 'Active',
                  createdAt: new Date().toISOString()
                }));
                setUsers(mappedUsers);
              }
            } catch (refreshError) {
              console.error('Error refreshing users:', refreshError);
              notification.warning({
                message: 'Warning',
                description: 'User updated successfully but failed to refresh the list. Please refresh the page.',
                placement: 'topRight',
                duration: 4,
              });
            }
            
      notification.success({
        message: 'Success',
              description: `User updated successfully: ${response.email}`,
        placement: 'topRight',
        duration: 3,
      });
    } else {
            notification.error({
              message: 'Error',
              description: 'Failed to update user - Invalid response',
              placement: 'topRight',
              duration: 3,
            });
          }
        } catch (updateError) {
          console.error('Error updating user:', updateError);
          notification.error({
            message: 'Error',
            description: updateError.message || 'Failed to update user',
            placement: 'topRight',
            duration: 3,
          });
        }
      } else {
        // Create new user using backend API
        const userData = {
          username: values.email,
          password: values.password,
          studentCode: values.studentCode || null,
          roles: values.role?.toUpperCase() || 'STUDENT',
          phoneNumber: values.phone || null,
          fullName: values.name || null
        };

        console.log('Creating user with data:', userData);
        const response = await authAPI.register(
          userData.username, 
          userData.password, 
          userData.studentCode, 
          userData.roles,
          userData.phoneNumber,
          userData.fullName
        );
        console.log('Create user response:', response);
        
        if (response && response.email) {
          // Backend returns RegisterResponse object, refresh users list from API
          try {
            const usersData = await userAPI.getAllAccounts(0, 100);
            
            if (usersData && usersData.length > 0) {
              const mappedUsers = usersData.map(profile => ({
                id: profile.id,
                name: profile.fullName || profile.email || 'Unknown',
                email: profile.email,
                phone: profile.phone,
                studentCode: profile.studentCode,
                role: profile.role?.toLowerCase() || 'member',
                status: 'Active',
                createdAt: new Date().toISOString()
              }));
              setUsers(mappedUsers);
            }
          } catch (refreshError) {
            console.error('Error refreshing users:', refreshError);
            // Still show success message even if refresh fails
            notification.warning({
              message: 'Warning',
              description: 'User created successfully but failed to refresh the list. Please refresh the page.',
              placement: 'topRight',
              duration: 4,
            });
          }
          
      notification.success({
        message: 'Success',
            description: `User created successfully: ${response.email}`,
            placement: 'topRight',
            duration: 3,
          });
        } else {
          notification.error({
            message: 'Error',
            description: 'Failed to create user - Invalid response',
        placement: 'topRight',
        duration: 3,
      });
    }
      }
      
    setModalVisible(false);
    setEditingUser(null);
      setSelectedRole(null);
    form.resetFields();
    } catch (error) {
      console.error('Error handling user submission:', error);
      notification.error({
        message: 'Error',
        description: error.message || 'Failed to handle user submission',
        placement: 'topRight',
        duration: 3,
      });
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          title="User Management"
                  extra={
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => {
                setSelectedRole(null);
                setModalVisible(true);
              }}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Add User
            </Button>
          </motion.div>
        }
          style={{
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}
          headStyle={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <Table 
            columns={columns} 
            dataSource={users} 
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
            }}
          />
        </Card>
      </motion.div>

      <Modal
        title={editingUser ? 'Edit User' : 'Add User'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          setSelectedRole(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone Number">
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select onChange={(value) => setSelectedRole(value)}>
              <Option value="student">Student</Option>
              <Option value="lecturer">Lecturer</Option>
              <Option value="admin">Admin</Option>
              <Option value="academic">Academic Affairs</Option>
              <Option value="leader">Leader</Option>
              <Option value="member">Member</Option>
              <Option value="parent">Parent</Option>
            </Select>
          </Form.Item>
          {selectedRole === 'student' && (
            <Form.Item name="studentCode" label="Student Code" rules={[{ required: true, message: 'Student Code is required for students' }]}>
              <Input placeholder="Enter student code" />
            </Form.Item>
          )}
          {!editingUser && (
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingUser(null);
                setSelectedRole(null);
                form.resetFields();
              }}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};



// Transaction History Component
const TransactionHistory = ({ transactions, setTransactions }) => {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const { RangePicker } = DatePicker;
  const { Option } = Select;

  // Animation variants for this component
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

  const getTransactionTypeColor = (type) => {
    switch (type) {
      case 'TOP_UP':
        return 'green';
      case 'PENALTY_PAYMENT':
        return 'red';
      case 'REFUND':
        return 'blue';
      case 'RENTAL_FEE':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'TOP_UP':
        return <PlusOutlined />;
      case 'PENALTY_PAYMENT':
        return <DollarOutlined />;
      case 'REFUND':
        return <RollbackOutlined />;
      case 'RENTAL_FEE':
        return <ShoppingOutlined />;
      default:
        return <FileTextOutlined />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateTimeString) => {
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  const showTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };

  const handleExportTransactions = () => {
    const transactionData = transactions.map(txn => ({
      'Transaction ID': txn.transactionId,
      'User Name': txn.userName || 'N/A',
      'User Email': txn.email || txn.userEmail || 'N/A',
      'User Role': txn.userRole || 'N/A',
      'Type': txn.type,
      'Amount': txn.amount,
      'Currency': txn.currency,
      'Status': txn.status,
      'Description': txn.description,
      'Kit Name': txn.kitName || 'N/A',
      'Payment Method': txn.paymentMethod,
      'Transaction Date': txn.transactionDate,
      'Processed By': txn.processedBy || 'N/A',
      'Reference': txn.reference,
      'Notes': txn.notes
    }));

    const ws = XLSX.utils.json_to_sheet(transactionData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, 'transaction_history.xlsx');
    
    notification.success({
      message: 'Export Successful',
      description: 'Transaction history exported to Excel file',
      placement: 'topRight',
    });
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      (transaction.id || '').toString().toLowerCase().includes(searchText.toLowerCase()) ||
      (transaction.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (transaction.paymentMethod || '').toLowerCase().includes(searchText.toLowerCase());

    const matchesType = typeFilter === 'all' || (transaction.type || transaction.transactionType) === typeFilter;

    let matchesDate = true;
    if (dateRange && dateRange.length === 2) {
      const transactionDate = new Date(transaction.createdAt || transaction.transactionDate);
      const startDate = dateRange[0].startOf('day');
      const endDate = dateRange[1].endOf('day');
      matchesDate = transactionDate >= startDate && transactionDate <= endDate;
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const totalAmount = filteredTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0);

  return (
    <div>
      <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
        <Card 
          title="Transaction History" 
          extra={
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={handleExportTransactions}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Export to Excel
            </Button>
          }
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <Alert
            message="Transaction Overview"
            description="View and manage all financial transactions including rental payments, fines, refunds, and deposits."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          {/* Statistics Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: '12px' }}>
                <Statistic
                  title="Total Transactions"
                  value={filteredTransactions.length}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card size="small" style={{ textAlign: 'center', borderRadius: '12px' }}>
                <Statistic
                  title="Total Amount"
                  value={formatAmount(totalAmount)}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: totalAmount >= 0 ? '#52c41a' : '#ff4d4f' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Filters */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <Input
                placeholder="Search transactions..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ borderRadius: '8px' }}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="Filter by type"
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: '100%', borderRadius: '8px' }}
              >
                <Option value="all">All Types</Option>
                <Option value="TOP_UP">Top Up</Option>
                <Option value="PENALTY_PAYMENT">Penalty Payment</Option>
                <Option value="REFUND">Refund</Option>
                <Option value="RENTAL_FEE">Rental Fee</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                placeholder={['Start Date', 'End Date']}
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%', borderRadius: '8px' }}
              />
            </Col>
          </Row>

          {/* Transactions Table */}
          <Table
            dataSource={filteredTransactions}
            columns={[
              {
                title: 'Transaction ID',
                dataIndex: 'id',
                key: 'id',
                render: (text) => text ? <Text code>{text.substring(0, 8)}...</Text> : 'N/A'
              },
              {
                title: 'Type',
                dataIndex: 'type',
                key: 'type',
                render: (type, record) => {
                  const transactionType = type || record.transactionType;
                  return (
                    <Tag color={getTransactionTypeColor(transactionType)} icon={getTransactionTypeIcon(transactionType)}>
                      {transactionType ? transactionType.replace(/_/g, ' ') : 'N/A'}
                  </Tag>
                  );
                }
              },
              {
                title: 'Amount',
                dataIndex: 'amount',
                key: 'amount',
                render: (amount) => (
                  <Text strong style={{ color: amount >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {amount ? amount.toLocaleString() : '0'} VND
                  </Text>
                )
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status, record) => {
                  const transactionStatus = status || record.transactionStatus;
                  return (
                    <Tag color={getStatusColor(transactionStatus)}>
                      {transactionStatus || 'N/A'}
                  </Tag>
                  );
                }
              },
              {
                title: 'Description',
                dataIndex: 'description',
                key: 'description',
                ellipsis: true
              },
              {
                title: 'Date',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (date) => date ? formatDateTime(date) : 'N/A'
              },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, record) => (
                  <Space>
                    <Button 
                      type="primary" 
                      size="small" 
                      icon={<EyeOutlined />} 
                      onClick={() => showTransactionDetails(record)}
                    >
                      View Details
                    </Button>
                  </Space>
                ),
              },
            ]}
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} transactions`
            }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </motion.div>

      {/* Transaction Details Modal */}
      <Modal
        title="Transaction Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
        centered
      >
        {selectedTransaction && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Transaction ID" span={2}>
              <Text code>{selectedTransaction.transactionId || selectedTransaction.id || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="User Name">{selectedTransaction.userName || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="User Email">{selectedTransaction.email || selectedTransaction.userEmail || 'N/A'}</Descriptions.Item>
            <Descriptions.Item label="User Role">
              <Tag color="blue">{selectedTransaction.userRole || 'N/A'}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Transaction Type">
              <Tag color={getTransactionTypeColor(selectedTransaction.type)} icon={getTransactionTypeIcon(selectedTransaction.type)}>
                {selectedTransaction.type ? selectedTransaction.type.replace(/_/g, ' ') : selectedTransaction.transactionType ? selectedTransaction.transactionType.replace(/_/g, ' ') : 'N/A'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Amount" span={2}>
              <Text strong style={{ fontSize: '18px', color: (selectedTransaction.amount || 0) >= 0 ? '#52c41a' : '#ff4d4f' }}>
                {formatAmount(selectedTransaction.amount || 0)}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(selectedTransaction.status || selectedTransaction.transactionStatus)}>
                {selectedTransaction.status || selectedTransaction.transactionStatus || 'N/A'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Kit Name" span={2}>
              {selectedTransaction.kitName || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {selectedTransaction.description || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Transaction Date">
              {selectedTransaction.transactionDate ? formatDateTime(selectedTransaction.transactionDate) : 
               selectedTransaction.createdAt ? formatDateTime(selectedTransaction.createdAt) : 'N/A'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

// Settings Component
const Settings = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card 
        title="System Settings"
        style={{
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          overflow: 'hidden'
        }}
        headStyle={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0'
        }}
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Card 
                title="General Settings" 
                size="small"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  overflow: 'hidden'
                }}
                headStyle={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  borderBottom: 'none',
                  borderRadius: '16px 16px 0 0'
                }}
              >
                <Form layout="vertical">
                  <Form.Item label="System Name">
                    <Input defaultValue="IoT Kit Rental System" />
                  </Form.Item>
                  <Form.Item label="Email Notifications">
                    <Switch defaultChecked />
                  </Form.Item>
                  <Form.Item label="Auto Approve Requests">
                    <Switch />
                  </Form.Item>
                </Form>
              </Card>
            </motion.div>
          </Col>
          <Col span={12}>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card 
                title="Security Settings" 
                size="small"
                style={{
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  overflow: 'hidden'
                }}
                headStyle={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  borderBottom: 'none',
                  borderRadius: '16px 16px 0 0'
                }}
              >
                <Form layout="vertical">
                  <Form.Item label="Session Timeout (minutes)">
                    <Input type="number" defaultValue={30} />
                  </Form.Item>
                  <Form.Item label="Password Policy">
                    <Select defaultValue="medium">
                      <Option value="low">Low</Option>
                      <Option value="medium">Medium</Option>
                      <Option value="high">High</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Two-Factor Authentication">
                    <Switch />
                  </Form.Item>
                </Form>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Card>
    </motion.div>
  );
};

// Log History Component
const LogHistory = ({ logHistory, setLogHistory }) => {
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load borrowing requests by statuses (REJECTED, RETURNED)
  useEffect(() => {
    loadBorrowingRequests();
  }, []);

  const loadBorrowingRequests = async () => {
    setLoading(true);
    try {
      const requests = await borrowingRequestAPI.getByStatuses(['REJECTED', 'RETURNED']);
      console.log('Fetched borrowing requests:', requests);
      
      // Map borrowing requests to log history format
      const mappedLogs = requests.map(request => {
        const status = request.status || 'UNKNOWN';
        const action = status === 'REJECTED' ? 'RENTAL_REQUEST_REJECTED' : 
                       status === 'RETURNED' ? 'RENTAL_REQUEST_RETURNED' : 
                       'RENTAL_REQUEST_OTHER';
        
        return {
          id: request.id,
          timestamp: request.actualReturnDate || request.approvedDate || request.createdAt || new Date().toISOString(),
          action: action,
          type: 'rental',
          user: request.requestedBy?.email || 'N/A',
          userName: request.requestedBy?.fullName || request.requestedBy?.email || 'N/A',
          details: {
            kitName: request.kit?.kitName || 'N/A',
            kitId: request.kit?.id || 'N/A',
            requestId: request.id?.toString() || 'N/A',
            reason: request.reason || 'N/A',
            requestType: request.requestType || 'N/A',
            depositAmount: request.depositAmount || 0,
            expectReturnDate: request.expectReturnDate || 'N/A',
            actualReturnDate: request.actualReturnDate || 'N/A'
          },
          status: status,
          adminAction: status === 'REJECTED' ? 'rejected' : status === 'RETURNED' ? 'returned' : 'N/A',
          adminUser: 'admin@fpt.edu.vn',
          adminTimestamp: request.actualReturnDate || request.approvedDate || request.createdAt || new Date().toISOString()
        };
      });
      
      setLogHistory(mappedLogs);
    } catch (error) {
      console.error('Error loading borrowing requests:', error);
      message.error('Failed to load borrowing requests');
      setLogHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants for the component
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

  const getActionIcon = (action) => {
    switch (action) {
      case 'RENTAL_REQUEST_BORROWED':
        return <ShoppingOutlined style={{ color: '#1890ff' }} />;
      case 'RENTAL_REQUEST_RETURNED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'RENTAL_REQUEST_REJECTED':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'REFUND_REQUEST_REJECTED':
        return <CloseCircleOutlined style={{ color: '#f5222d' }} />;
      case 'REFUND_REQUEST_RETURNED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'FINE_PAID':
        return <DollarOutlined style={{ color: '#52c41a' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };


  // Removed unused getActionColor function
  const _getActionColor = (action) => {
    switch (action) {
      case 'RENTAL_REQUEST_BORROWED':
        return 'blue';
      case 'RENTAL_REQUEST_RETURNED':
        return 'green';
      case 'REFUND_REQUEST_REJECTED':
        return 'red';
      case 'REFUND_REQUEST_RETURNED':
        return 'green';
      case 'FINE_PAID':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'BORROWED':
        return 'processing';
      case 'RETURNED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'PAID':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredLogs = logHistory.filter(log => {
    const matchesSearch = (log.userName || '').toLowerCase().includes(searchText.toLowerCase()) ||
                         (log.details?.kitName || '').toLowerCase().includes(searchText.toLowerCase()) ||
                         (log.details?.requestId || '').toLowerCase().includes(searchText.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    
    let matchesDate = true;
    if (dateRange && dateRange[0] && dateRange[1]) {
      const logDate = new Date(log.timestamp);
      const startDate = dateRange[0].startOf('day').toDate();
      const endDate = dateRange[1].endOf('day').toDate();
      matchesDate = logDate >= startDate && logDate <= endDate;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 200,
      render: (action) => (
        <Space>
          {getActionIcon(action)}
          <span>{action.replace(/_/g, ' ')}</span>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={type === 'rental' ? 'blue' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      width: 150,
    },
    {
      title: 'Kit',
      dataIndex: 'details',
      key: 'kitName',
      width: 150,
      render: (details) => details.kitName,
    },
    {
      title: 'Request ID',
      dataIndex: 'details',
      key: 'requestId',
      width: 120,
      render: (details) => details.requestId,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => formatTimestamp(timestamp),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewDetails(record)}
        >
          Details
        </Button>
      ),
    },
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
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HistoryOutlined style={{ color: '#667eea' }} />
              <span>Log History</span>
            </div>
          }
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  // Refresh log data
                  loadBorrowingRequests();
                }}
              >
                Refresh
              </Button>
              <Button
                icon={<ExportOutlined />}
                onClick={() => {
                  // Export log data
                  const data = filteredLogs.map(log => ({
                    'Timestamp': formatTimestamp(log.timestamp),
                    'Action': log.action.replace(/_/g, ' '),
                    'Type': log.type.toUpperCase(),
                    'User': log.userName,
                    'Kit': log.details.kitName,
                    'Request ID': log.details.requestId,
                    'Status': log.status.toUpperCase(),
                    'Admin Action': log.adminAction || 'N/A',
                    'Admin User': log.adminUser || 'N/A'
                  }));
                  
                  const ws = XLSX.utils.json_to_sheet(data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Log History');
                  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
                  const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                  saveAs(dataBlob, 'log_history.xlsx');
                  
                  notification.success({
                    message: 'Export Successful',
                    description: 'Log history exported to Excel file',
                    placement: 'topRight',
                  });
                }}
              >
                Export
              </Button>
            </Space>
          }
          style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
        >
          <Tabs>
            <Tabs.TabPane tab="Request History" key="requests">
              {/* Filters */}
              <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Search by user, kit, or request ID"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
                              <Select
                  placeholder="Filter by status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                  allowClear
                >
                  <Option value="all">All Status</Option>
                  <Option value="BORROWED">Borrowed</Option>
                  <Option value="RETURNED">Returned</Option>
                  <Option value="REJECTED">Rejected</Option>
                  <Option value="PAID">Paid</Option>
                </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Filter by type"
                value={typeFilter}
                onChange={setTypeFilter}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="all">All Types</Option>
                <Option value="rental">Rental</Option>
                <Option value="refund">Refund</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <DatePicker.RangePicker
                value={dateRange}
                onChange={setDateRange}
                style={{ width: '100%' }}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
          </Row>

          {/* Statistics */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Total Logs"
                  value={filteredLogs.length}
                  prefix={<HistoryOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Rental Requests"
                  value={filteredLogs.filter(log => log.type === 'rental').length}
                  prefix={<ShoppingOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={6}>
              <Card size="small">
                <Statistic
                  title="Returned Items"
                  value={filteredLogs.filter(log => log.status === 'RETURNED').length}
                  prefix={<CheckCircleOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
                <Col xs={24} sm={6}>
                  <Card size="small">
                    <Statistic
                  title="Rejected Items"
                  value={filteredLogs.filter(log => log.status === 'REJECTED').length}
                  prefix={<CloseCircleOutlined />}
                      valueStyle={{ color: '#f5222d' }}
                    />
                  </Card>
                </Col>
              </Row>

          {/* Log Table */}
              <Table
            dataSource={filteredLogs}
            columns={columns}
                rowKey="id"
            loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} logs`,
                }}
                scroll={{ x: 1200 }}
              />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </motion.div>

      {/* Log Detail Modal */}
      <Modal
        title="Log Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedLog(null);
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModalVisible(false);
            setSelectedLog(null);
          }}>
            Close
          </Button>
        ]}
        width={800}
        centered
      >
        {selectedLog && (
          <div>
            <Descriptions bordered column={2}>
                  <Descriptions.Item label="Action" span={2}>
                    <Space>
                      {getActionIcon(selectedLog.action)}
                      <span style={{ fontWeight: 'bold' }}>
                        {selectedLog.action.replace(/_/g, ' ')}
                      </span>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Type">
                    <Tag color={selectedLog.type === 'rental' ? 'blue' : 'orange'}>
                      {selectedLog.type.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedLog.status)}>
                      {selectedLog.status.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="User">
                    {selectedLog.userName} ({selectedLog.user})
                  </Descriptions.Item>
                  <Descriptions.Item label="Timestamp">
                    {formatTimestamp(selectedLog.timestamp)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Kit Name" span={2}>
                {selectedLog.details?.kitName || 'N/A'} (ID: {selectedLog.details?.kitId || 'N/A'})
                  </Descriptions.Item>
                  <Descriptions.Item label="Request ID" span={2}>
                {selectedLog.details?.requestId || 'N/A'}
                  </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedLog.details?.reason || 'N/A'}
                  </Descriptions.Item>
              <Descriptions.Item label="Request Type" span={2}>
                <Tag color={selectedLog.details?.requestType === 'BORROW_COMPONENT' ? 'orange' : 'blue'}>
                  {selectedLog.details?.requestType || 'N/A'}
                    </Tag>
                  </Descriptions.Item>
              <Descriptions.Item label="Deposit Amount" span={2}>
                {selectedLog.details?.depositAmount ? selectedLog.details.depositAmount.toLocaleString() + ' VND' : 'N/A'}
                  </Descriptions.Item>
              <Descriptions.Item label="Expected Return Date">
                {selectedLog.details?.expectReturnDate ? formatTimestamp(selectedLog.details.expectReturnDate) : 'N/A'}
                  </Descriptions.Item>
              <Descriptions.Item label="Actual Return Date">
                {selectedLog.details?.actualReturnDate ? formatTimestamp(selectedLog.details.actualReturnDate) : 'N/A'}
                  </Descriptions.Item>
              {selectedLog.adminAction && (
                <>
                  <Descriptions.Item label="Admin Action">
                    <Tag color={selectedLog.adminAction === 'rejected' ? 'red' : selectedLog.adminAction === 'returned' ? 'green' : 'default'}>
                      {selectedLog.adminAction.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Admin User">
                    {selectedLog.adminUser || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Admin Timestamp">
                    {formatTimestamp(selectedLog.adminTimestamp)}
                  </Descriptions.Item>
                </>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Penalty Policies Management Component
const PenaltyPoliciesManagement = ({ penaltyPolicies, setPenaltyPolicies }) => {
  const [form] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper function for date formatting
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'N/A';
    return new Date(dateTimeString).toLocaleString('vi-VN');
  };

  // Load penalty policies on mount
  useEffect(() => {
    loadPenaltyPolicies();
  }, []);

  const loadPenaltyPolicies = async () => {
    setLoading(true);
    try {
      const response = await penaltyPoliciesAPI.getAll();
      console.log('Penalty policies response:', response);
      
      // Handle ApiResponse wrapper
      const policiesData = response?.data || response;
      
      if (Array.isArray(policiesData)) {
        setPenaltyPolicies(policiesData);
        console.log('Penalty policies loaded successfully:', policiesData.length);
      } else {
        setPenaltyPolicies([]);
        console.log('No penalty policies found or invalid response format');
      }
    } catch (error) {
      console.error('Error loading penalty policies:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load penalty policies',
        placement: 'topRight',
        duration: 3,
      });
      setPenaltyPolicies([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Policy Name',
      dataIndex: 'policyName',
      key: 'policyName',
      render: (text) => <Text strong>{text || 'N/A'}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const typeColors = {
          'damaged': 'orange',
          'lost': 'red',
          'lated': 'blue',
          'LATE': 'blue',
          'DAMAGED': 'orange',
          'LOST': 'red'
        };
        const color = typeColors[type] || 'default';
        return (
          <Tag color={color}>
            {type ? type.toUpperCase() : 'N/A'}
          </Tag>
        );
      }
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#cf1322' }}>
          {amount ? amount.toLocaleString() : '0'} VND
        </Text>
      )
    },
    {
      title: 'Issued Date',
      dataIndex: 'issuedDate',
      key: 'issuedDate',
      render: (date) => date ? formatDateTime(date) : 'N/A'
    },
    {
      title: 'Resolved Date',
      dataIndex: 'resolved',
      key: 'resolved',
      render: (date) => date ? formatDateTime(date) : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => editPolicy(record)}
            >
              Edit
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Popconfirm
              title="Delete Policy"
              description={`Are you sure you want to delete policy "${record.policyName}"?`}
              onConfirm={() => deletePolicy(record.id)}
              okText="Yes"
              cancelText="No"
              okType="danger"
            >
              <Button 
                type="primary" 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          </motion.div>
        </Space>
      )
    }
  ];

  const editPolicy = (policy) => {
    setEditingPolicy(policy);
    
    // Format dates for DatePicker
    const formData = {
      policyName: policy.policyName || '',
      type: policy.type || '',
      amount: policy.amount || 0,
      issuedDate: policy.issuedDate ? dayjs(policy.issuedDate) : null,
      resolved: policy.resolved ? dayjs(policy.resolved) : null,
      penaltyId: policy.penaltyId || null
    };
    
    form.setFieldsValue(formData);
    setModalVisible(true);
  };

  const deletePolicy = async (id) => {
    try {
      await penaltyPoliciesAPI.delete(id);
      
      // Reload policies after deletion
      await loadPenaltyPolicies();
      
      notification.success({
        message: 'Policy Deleted Successfully',
        description: 'The penalty policy has been deleted.',
        placement: 'topRight',
        duration: 3,
      });
    } catch (error) {
      console.error('Error deleting policy:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to delete policy',
        placement: 'topRight',
        duration: 4,
      });
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Format dates for API
      // Structure penalty relationship: send { penalty: { id: penaltyId } } or null
      const policyData = {
        policyName: values.policyName,
        type: values.type,
        amount: values.amount || 0,
        issuedDate: values.issuedDate ? values.issuedDate.toISOString() : null,
        resolved: values.resolved ? values.resolved.toISOString() : null,
        penalty: values.penaltyId ? { id: values.penaltyId } : null
      };

      if (editingPolicy) {
        // Update existing policy
        console.log('Updating policy with data:', policyData);
        const response = await penaltyPoliciesAPI.update(editingPolicy.id, policyData);
        console.log('Update policy response:', response);
        
        notification.success({
          message: 'Success',
          description: 'Penalty policy updated successfully',
          placement: 'topRight',
          duration: 3,
        });
      } else {
        // Create new policy
        console.log('Creating policy with data:', policyData);
        const response = await penaltyPoliciesAPI.create(policyData);
        console.log('Create policy response:', response);
        
        notification.success({
          message: 'Success',
          description: 'Penalty policy created successfully',
          placement: 'topRight',
          duration: 3,
        });
      }
      
      // Reload policies after create/update
      await loadPenaltyPolicies();
      
      // Close modal and reset form
      setModalVisible(false);
      setEditingPolicy(null);
      form.resetFields();
    } catch (error) {
      console.error('Error saving policy:', error);
      notification.error({
        message: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to save policy',
        placement: 'topRight',
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card
          title="Penalty Policies Management"
          extra={
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => {
                  setEditingPolicy(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                Add Policy
              </Button>
            </motion.div>
          }
          style={{
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            overflow: 'hidden'
          }}
          headStyle={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            borderBottom: 'none',
            borderRadius: '20px 20px 0 0'
          }}
        >
          <Table 
            columns={columns} 
            dataSource={penaltyPolicies} 
            rowKey="id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} policies`
            }}
          />
        </Card>
      </motion.div>

      {/* Add/Edit Policy Modal */}
      <Modal
        title={editingPolicy ? 'Edit Penalty Policy' : 'Add Penalty Policy'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingPolicy(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        centered
        destroyOnClose
        maskClosable={false}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
        >
          <Form.Item 
            name="policyName" 
            label="Policy Name" 
            rules={[{ required: true, message: 'Please enter policy name' }]}
          >
            <Input placeholder="Enter policy name" />
          </Form.Item>
          
          <Form.Item 
            name="type" 
            label="Type" 
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select placeholder="Select policy type">
              <Option value="damaged">Damaged</Option>
              <Option value="lost">Lost</Option>
              <Option value="lated">Late Return</Option>
            </Select>
          </Form.Item>
          
          <Form.Item 
            name="amount" 
            label="Amount (VND)" 
            rules={[
              { required: true, message: 'Please enter amount' },
              { type: 'number', min: 0, message: 'Amount must be greater than or equal to 0' }
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter penalty amount"
            />
          </Form.Item>
          
          <Form.Item 
            name="issuedDate" 
            label="Issued Date"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Select issued date"
            />
          </Form.Item>
          
          <Form.Item 
            name="resolved" 
            label="Resolved Date"
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              placeholder="Select resolved date"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={loading}
                >
                  {editingPolicy ? 'Update' : 'Create'}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  onClick={() => {
                    setModalVisible(false);
                    setEditingPolicy(null);
                    form.resetFields();
                  }}
                >
                  Cancel
                </Button>
              </motion.div>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPortal; 