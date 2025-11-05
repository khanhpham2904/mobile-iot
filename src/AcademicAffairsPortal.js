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
  List,
  Progress,
  Upload,
  Tabs,
  Alert,
  Descriptions,
  Empty,
  Skeleton,
  Spin,
  notification,
  InputNumber
} from 'antd';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  ReadOutlined,
  LogoutOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  PieChartOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ImportOutlined,
  ExportOutlined,
  ToolOutlined,
  ThunderboltOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LoadingOutlined } from '@ant-design/icons';
import { classesAPI, userAPI, classAssignmentAPI, excelImportAPI } from './api';

// Mock data - TODO: Replace with real API calls
const mockSemesters = [];
const mockKits = [];

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

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


const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'active':
    case 'approved':
    case 'completed':
      return 'success';
    case 'pending':
    case 'in_progress':
      return 'warning';
    case 'inactive':
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

function AcademicAffairsPortal({ user, onLogout }) {
  console.log('AcademicAffairsPortal received user:', user);
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // State for data management
  const [semesters, setSemesters] = useState([]);
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [kits, setKits] = useState([]);

  // State for modals and forms
  const [semesterModal, setSemesterModal] = useState({ visible: false, data: {} });
  const [studentModal, setStudentModal] = useState({ visible: false, data: {} });
  const [lecturerModal, setLecturerModal] = useState({ visible: false, data: {} });
  const [kitModal, setKitModal] = useState({ visible: false, data: {} });
  const [iotSubjectModal, setIotSubjectModal] = useState({ visible: false, data: {} });

  // Form instances
  const [semesterForm] = Form.useForm();
  const [studentForm] = Form.useForm();
  const [lecturerForm] = Form.useForm();
  const [kitForm] = Form.useForm();
  const [iotSubjectForm] = Form.useForm();

  // State for semester-based management
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [iotSubjects, setIotSubjects] = useState([]);
  const [lecturersList, setLecturersList] = useState([]);

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

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setSemesters(mockSemesters);
      setKits(mockKits);

      // Fetch Students from API
      try {
        const studentsData = await userAPI.getStudents();
        console.log('Fetched students data:', studentsData);
        
        const formatDate = (dateStr) => {
          if (!dateStr) return '-';
          try {
            const date = new Date(dateStr);
            return date.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          } catch (e) {
            console.error('Error formatting date:', e, dateStr);
            return '-';
          }
        };
        
        const mappedStudents = studentsData.map(student => ({
          id: student.id,
          name: student.fullName,
          email: student.email,
          studentCode: student.studentCode,
          phoneNumber: student.phoneNumber,
          createdAt: formatDate(student.createdAt),
          status: student.status
        }));
        
        setStudents(mappedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        setStudents([]);
      }

      // Fetch Lecturers from API
      try {
        const lecturersData = await userAPI.getLecturers();
        console.log('Fetched lecturers data:', lecturersData);
        
        const formatDate = (dateStr) => {
          if (!dateStr) return '-';
          try {
            const date = new Date(dateStr);
            return date.toLocaleString('vi-VN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          } catch (e) {
            console.error('Error formatting date:', e, dateStr);
            return '-';
          }
        };
        
        const mappedLecturers = lecturersData.map(lecturer => ({
          id: lecturer.id || lecturer.email,
          name: lecturer.fullName,
          email: lecturer.email,
          phoneNumber: lecturer.phone || '',
          createdAt: formatDate(lecturer.createdAt),
          status: lecturer.status || 'ACTIVE'
        }));
        
        setLecturers(mappedLecturers);
      } catch (error) {
        console.error('Error fetching lecturers:', error);
        setLecturers([]);
      }

      // Fetch IOT subjects from API
      try {
        const classesData = await classesAPI.getAllClasses();
        console.log('Fetched classes data:', classesData);
        
        // Map backend data to frontend format
        const mappedClasses = classesData.map(cls => {
          console.log('Processing class:', cls.id, 'createdAt:', cls.createdAt, 'updatedAt:', cls.updatedAt);
          
          // Format date từ LocalDateTime (format: "2024-01-15T10:30:00")
          const formatDate = (dateStr) => {
            if (!dateStr) return '-';
            try {
              const date = new Date(dateStr);
              return date.toLocaleString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });
            } catch (e) {
              console.error('Error formatting date:', e, dateStr);
              return '-';
            }
          };
          
          return {
            id: cls.id,
            classCode: cls.classCode,
            semester: cls.semester,
            status: cls.status,
            teacherId: cls.teacherId,
            teacherName: cls.teacherName,
            teacherEmail: cls.teacherEmail,
            createdAt: formatDate(cls.createdAt),
            updatedAt: formatDate(cls.updatedAt)
          };
        });
        
        console.log('Mapped classes:', mappedClasses);
        setIotSubjects(mappedClasses);
      } catch (error) {
        console.error('Error fetching classes:', error);
        notification.error({
          message: 'Error',
          description: 'Failed to load IOT subjects',
          placement: 'topRight',
        });
        setIotSubjects([]);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load data',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  // Import/Export Functions
  const exportToExcel = (data, filename) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(dataBlob, `${filename}.xlsx`);
  };


  const handleExportStudents = () => {
    const studentData = students.map(student => ({
      'Student ID': student.id,
      'Name': student.name,
      'Email': student.email,
      'Role': student.role,
      'Status': student.status,
      'Created Date': student.createdAt,
      'Last Login': student.lastLogin
    }));
    exportToExcel(studentData, 'students_list');
    notification.success({
      message: 'Export Successful',
      description: 'Student list exported to Excel file',
      placement: 'topRight',
    });
  };

  const handleExportLecturers = () => {
    const lecturerData = lecturers.map(lecturer => ({
      'Lecturer ID': lecturer.id,
      'Name': lecturer.name,
      'Email': lecturer.email,
      'Department': lecturer.department,
      'Specialization': lecturer.specialization,
      'Status': lecturer.status,
      'Hire Date': lecturer.hireDate
    }));
    exportToExcel(lecturerData, 'lecturers_list');
    notification.success({
      message: 'Export Successful',
      description: 'Lecturer list exported to Excel file',
      placement: 'topRight',
    });
  };

  const handleImportStudents = async (file) => {
    try {
      // Use the class-specific import endpoint that handles SpreadsheetML XML format
      const response = await excelImportAPI.importStudentsWithClasses(file);
      
      // The endpoint returns a string message like "Imported new students: X"
      const message = typeof response === 'string' ? response : (response.message || response.raw || 'Import completed');
      
      notification.success({
        message: 'Import Successful',
        description: message,
        placement: 'topRight',
      });

      // Refresh students list
      await loadData();
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: 'Import Failed',
        description: error.message || 'Failed to import students. Please check file format. Expected SpreadsheetML XML format.',
        placement: 'topRight',
      });
    }
  };

  const handleImportLecturers = async (file) => {
    try {
      const response = await excelImportAPI.importAccounts(file, 'LECTURER');
      
      if (response.success) {
        notification.success({
          message: 'Import Successful',
          description: response.message,
          placement: 'topRight',
        });
      } else {
        notification.error({
          message: 'Import Failed',
          description: response.message,
          placement: 'topRight',
        });
      }

      if (response.errors && response.errors.length > 0) {
        notification.warning({
          message: 'Import Warnings',
          description: `${response.errors.length} rows failed to import. Check console for details.`,
          placement: 'topRight',
        });
        console.error('Import errors:', response.errors);
      }

      // Refresh lecturers list
      await loadData();
    } catch (error) {
      console.error('Import error:', error);
      notification.error({
        message: 'Import Failed',
        description: 'Failed to import lecturers. Please check file format.',
        placement: 'topRight',
      });
    }
  };

  // Kit Management Functions
  const handleExportKits = () => {
    try {
      const data = kits.map(kit => ({
        'Kit Name': kit.name,
        'Category': kit.category,
        'Quantity': kit.quantity,
        'Location': kit.location,
        'Status': kit.status,
        'Price': kit.price
      }));
      exportToExcel(data, 'kits_export');
      message.success('Kits exported successfully');
    } catch (error) {
      console.error('Error exporting kits:', error);
      message.error('Failed to export kits');
    }
  };

  const handleViewKitDetails = (record) => {
    Modal.info({
      title: `Kit Details: ${record.name}`,
      width: 600,
      content: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Kit Name">{record.name}</Descriptions.Item>
          <Descriptions.Item label="Category">{record.category}</Descriptions.Item>
          <Descriptions.Item label="Quantity">{record.quantity}</Descriptions.Item>
          <Descriptions.Item label="Location">{record.location}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={getStatusColor(record.status)}>{record.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Price">${record.price}</Descriptions.Item>
        </Descriptions>
      ),
    });
  };

  // Removed unused handleEditKit and handleDeleteKit functions

  const _handleDeleteKit = (record) => {
    Modal.confirm({
      title: 'Delete Kit',
      content: `Are you sure you want to delete "${record.name}"?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        setKits(prev => prev.filter(kit => kit.id !== record.id));
        message.success('Kit deleted successfully');
      },
    });
  };



  // IOT Subject Management Functions
  const handleAddIotSubject = async () => {
    iotSubjectForm.resetFields();
    setIotSubjectModal({ visible: true, data: {} });
    
    // Fetch lecturers when opening the modal
    try {
      const lecturers = await classesAPI.getListLecturers();
      setLecturersList(lecturers || []);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      message.error('Failed to load lecturers');
    }
  };

  const handleEditIotSubject = async (record) => {
    // Fetch lecturers first before opening modal
    try {
      const lecturers = await classesAPI.getListLecturers();
      setLecturersList(lecturers || []);
      
      // Map record data to form values
      const formData = {
        classCode: record.classCode,
        semester: record.semester,
        status: record.status,
        lecturerId: record.teacherId  // Map teacherId to lecturerId field
      };
      
      iotSubjectForm.setFieldsValue(formData);
    setIotSubjectModal({ visible: true, data: record });
    } catch (error) {
      console.error('Error fetching lecturers:', error);
      message.error('Failed to load lecturers');
    }
  };

  const handleViewIotSubjectStudents = (record) => {
    // Mock enrolled students data since we removed enrollments
    const enrolledStudents = students.slice(0, Math.min(record.enrolledCount, 10)).map(student => student.name);

    Modal.info({
      title: `Students in ${record.name}`,
      width: 600,
      content: (
        <div>
          <Alert
            message={`Total Enrolled: ${enrolledStudents.length}/${record.capacity}`}
            type="info"
            style={{ marginBottom: 16 }}
          />
          <List
            dataSource={enrolledStudents}
            renderItem={(student, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={student}
                  description={`Student #${index + 1}`}
                />
              </List.Item>
            )}
          />
        </div>
      ),
    });
  };

  const handleDeleteIotSubject = (record) => {
    Modal.confirm({
      title: 'Delete IOT Subject',
      content: `Are you sure you want to delete "${record.classCode}"?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await classesAPI.deleteClass(record.id);
          await loadData();
          message.success('IOT Subject deleted successfully');
        } catch (error) {
          console.error('Error deleting IOT subject:', error);
          message.error('Failed to delete IOT subject');
        }
      },
    });
  };

  // Form submission handlers
  const handleKitSubmit = () => {
    kitForm.validateFields().then(values => {
      if (kitModal.data.id) {
        // Edit existing kit
        setKits(prev => prev.map(kit => 
          kit.id === kitModal.data.id ? { ...kit, ...values } : kit
        ));
        message.success('Kit updated successfully');
      } else {
        // Add new kit
        const newKit = {
          id: Date.now(),
          ...values,
          status: 'AVAILABLE'
        };
        setKits(prev => [...prev, newKit]);
        message.success('Kit added successfully');
      }
      setKitModal({ visible: false, data: {} });
      kitForm.resetFields();
    });
  };



  const handleIotSubjectSubmit = async () => {
    try {
      const values = await iotSubjectForm.validateFields();
      
      if (iotSubjectModal.data.id) {
        // Edit existing IOT subject
        const updateData = {
          classCode: values.classCode,
          semester: values.semester,
          status: values.status,
          teacherId: values.lecturerId  // Add teacherId for update
        };
        
        await classesAPI.updateClass(iotSubjectModal.data.id, updateData);
        
        // Refresh data
        await loadData();
        message.success('IOT Subject updated successfully');
      } else {
        // Add new IOT subject
        const createData = {
          classCode: values.classCode,
          semester: values.semester,
          status: values.status,
          teacherId: values.lecturerId
        };
        
        await classesAPI.createClass(createData, values.lecturerId);
        
        // Refresh data
        await loadData();
        message.success('IOT Subject created successfully');
      }
      
      setIotSubjectModal({ visible: false, data: {} });
      iotSubjectForm.resetFields();
    } catch (error) {
      console.error('Error submitting IOT subject:', error);
      message.error('Failed to save IOT subject');
    }
  };

  // Student Management Functions
  const handleAddStudent = () => {
    studentForm.resetFields();
    setStudentModal({ visible: true, data: {} });
  };

  const handleEditStudent = (record) => {
    // Map record data to form values
    const formData = {
      ...record
    };
    studentForm.setFieldsValue(formData);
    setStudentModal({ visible: true, data: record });
  };

  const handleDeleteStudent = (record) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this student?',
      content: `This will permanently delete ${record.name} from the system.`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        setStudents(prev => prev.filter(student => student.id !== record.id));
        message.success('Student deleted successfully');
      },
    });
  };

  const handleStudentSubmit = async () => {
    try {
      const values = await studentForm.validateFields();
      
      if (studentModal.data.id) {
        // Edit existing student
        setStudents(prev => prev.map(student =>
          student.id === studentModal.data.id ? { ...student, ...values } : student
        ));
        message.success('Student updated successfully');
      } else {
        // Create new student via API
        const response = await userAPI.createSingleStudent({
          name: values.name,
          email: values.email,
          studentCode: values.studentCode,
          phoneNumber: values.phoneNumber
        });
        
        console.log('Student created:', response);
        
        // Refresh students list
        await loadData();
        message.success('Student created successfully');
      }
      
      setStudentModal({ visible: false, data: {} });
      studentForm.resetFields();
    } catch (error) {
      console.error('Error submitting student:', error);
      message.error('Failed to save student');
    }
  };

  // Lecturer Management Functions
  const handleAddLecturer = () => {
    lecturerForm.resetFields();
    setLecturerModal({ visible: true, data: {} });
  };

  const handleEditLecturer = (record) => {
    // Convert date string to dayjs object for DatePicker
    const formData = {
      ...record,
      hireDate: record.hireDate ? dayjs(record.hireDate) : null
    };
    lecturerForm.setFieldsValue(formData);
    setLecturerModal({ visible: true, data: record });
  };

  const handleDeleteLecturer = (record) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this lecturer?',
      content: `This will permanently delete ${record.name} from the system.`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk() {
        setLecturers(prev => prev.filter(lecturer => lecturer.id !== record.id));
        message.success('Lecturer deleted successfully');
      },
    });
  };

  const handleLecturerSubmit = async () => {
    try {
      const values = await lecturerForm.validateFields();
      
      if (lecturerModal.data.id) {
        // Edit existing lecturer
        setLecturers(prev => prev.map(lecturer =>
          lecturer.id === lecturerModal.data.id ? { ...lecturer, ...values } : lecturer
        ));
        message.success('Lecturer updated successfully');
      } else {
        // Create new lecturer via API
        const response = await userAPI.createSingleLecturer({
          name: values.name,
          email: values.email,
          phoneNumber: values.phoneNumber
        });
        
        console.log('Lecturer created:', response);
        
        // Refresh lecturers list
        await loadData();
        message.success('Lecturer created successfully');
      }
      
      setLecturerModal({ visible: false, data: {} });
      lecturerForm.resetFields();
    } catch (error) {
      console.error('Error submitting lecturer:', error);
      message.error('Failed to save lecturer');
    }
  };

  const handleMenuClick = ({ key }) => {
    setSelectedKey(key);
  };

  // Menu items for Academic Affairs Portal
  const menuItems = [
    { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: 'student-enrollment', icon: <ReadOutlined />, label: 'Student Enrollment' },
    { key: 'students', icon: <UserOutlined />, label: 'Students' },
    { key: 'lecturers', icon: <TeamOutlined />, label: 'Lecturers' },
    { key: 'iot-subjects', icon: <ToolOutlined />, label: 'IOT Subjects' },
    { key: 'kits', icon: <ToolOutlined />, label: 'Kits' },
  ];

  if (!user) {
    console.log('AcademicAffairsPortal: No user provided, showing fallback');
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Authentication Required</h2>
          <p>Please log in to access the Academic Affairs Portal.</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

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
            {collapsed ? 'ACA' : 'Academic Affairs'}
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
                <Badge count={3} size="small" style={{ cursor: 'pointer' }}>
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
                {selectedKey === 'dashboard' && <DashboardContent semesters={semesters} students={students} lecturers={lecturers} kits={kits} iotSubjects={iotSubjects} />}
                {selectedKey === 'student-enrollment' && <StudentEnrollment semesters={semesters} setSemesters={setSemesters} semesterModal={semesterModal} setSemesterModal={setSemesterModal} semesterForm={semesterForm} />}
                {selectedKey === 'students' && <StudentManagement students={students} setStudents={setStudents} studentModal={studentModal} setStudentModal={setStudentModal} studentForm={studentForm} handleExportStudents={handleExportStudents} handleImportStudents={handleImportStudents} handleAddStudent={handleAddStudent} handleEditStudent={handleEditStudent} handleDeleteStudent={handleDeleteStudent} />}
                {selectedKey === 'lecturers' && <LecturerManagement lecturers={lecturers} setLecturers={setLecturers} lecturerModal={lecturerModal} setLecturerModal={setLecturerModal} lecturerForm={lecturerForm} handleExportLecturers={handleExportLecturers} handleImportLecturers={handleImportLecturers} handleAddLecturer={handleAddLecturer} handleEditLecturer={handleEditLecturer} handleDeleteLecturer={handleDeleteLecturer} />}
                {selectedKey === 'iot-subjects' && <IotSubjectsManagement iotSubjects={iotSubjects} setIotSubjects={setIotSubjects} selectedSemester={selectedSemester} setSelectedSemester={setSelectedSemester} semesters={semesters} handleAddIotSubject={handleAddIotSubject} handleEditIotSubject={handleEditIotSubject} handleViewIotSubjectStudents={handleViewIotSubjectStudents} handleDeleteIotSubject={handleDeleteIotSubject} />}
                {selectedKey === 'kits' && <KitsManagement kits={kits} setKits={setKits} handleExportKits={handleExportKits} handleViewKitDetails={handleViewKitDetails} />}
              </motion.div>
            </AnimatePresence>
          </Spin>
        </Content>
      </Layout>

      {/* Kit Modal */}
      <Modal
        title={kitModal.data.id ? "Edit Kit" : "Add Kit"}
        open={kitModal.visible}
        onOk={handleKitSubmit}
        onCancel={() => setKitModal({ visible: false, data: {} })}
        width={600}
        okText={kitModal.data.id ? "Update" : "Add"}
        cancelText="Cancel"
      >
        <Form form={kitForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Kit Name"
                rules={[{ required: true, message: 'Please enter kit name' }]}
              >
                <Input placeholder="Enter kit name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  <Option value="Sensors">Sensors</Option>
                  <Option value="Microcontrollers">Microcontrollers</Option>
                  <Option value="Actuators">Actuators</Option>
                  <Option value="Communication">Communication</Option>
                  <Option value="Power">Power</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Price"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="Enter price" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="location"
            label="Location"
            rules={[{ required: true, message: 'Please enter location' }]}
          >
            <Input placeholder="Enter location" />
          </Form.Item>
        </Form>
      </Modal>



      {/* Student Modal */}
      <Modal
        title={studentModal.data.id ? "Edit Student" : "Add Student"}
        open={studentModal.visible}
        onOk={handleStudentSubmit}
        onCancel={() => setStudentModal({ visible: false, data: {} })}
        width={600}
        okText={studentModal.data.id ? "Update" : "Add"}
        cancelText="Cancel"
      >
        <Form form={studentForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Student Name"
                rules={[{ required: true, message: 'Please enter student name' }]}
              >
                <Input placeholder="Enter student name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentCode"
                label="Student Code"
                rules={[{ required: true, message: 'Please enter student code' }]}
              >
                <Input placeholder="Enter student code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Lecturer Modal */}
      <Modal
        title={lecturerModal.data.id ? "Edit Lecturer" : "Add Lecturer"}
        open={lecturerModal.visible}
        onOk={handleLecturerSubmit}
        onCancel={() => setLecturerModal({ visible: false, data: {} })}
        width={600}
        okText={lecturerModal.data.id ? "Update" : "Add"}
        cancelText="Cancel"
      >
        <Form form={lecturerForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Lecturer Name"
                rules={[{ required: true, message: 'Please enter lecturer name' }]}
              >
                <Input placeholder="Enter lecturer name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please enter email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phoneNumber"
                label="Phone Number"
                rules={[{ required: true, message: 'Please enter phone number' }]}
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* IOT Subject Modal */}
      <Modal
        title={iotSubjectModal.data.id ? "Edit IOT Subject" : "Add IOT Subject"}
        open={iotSubjectModal.visible}
        onOk={handleIotSubjectSubmit}
        onCancel={() => setIotSubjectModal({ visible: false, data: {} })}
        width={600}
        okText={iotSubjectModal.data.id ? "Update" : "Add"}
        cancelText="Cancel"
      >
        <Form form={iotSubjectForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="classCode"
                label="Class Code"
                rules={[{ required: true, message: 'Please enter class code' }]}
              >
                <Input placeholder="Enter class code" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="semester"
                label="Semester"
                rules={[{ required: true, message: 'Please enter semester' }]}
              >
                <Input placeholder="Enter semester" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="lecturerId"
                label="Lecturer"
                rules={[{ required: true, message: 'Please select lecturer' }]}
              >
                <Select 
                  placeholder="Select lecturer"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={lecturersList.map(lecturer => ({
                    value: lecturer.id,
                    label: lecturer.fullName || lecturer.email,
                    email: lecturer.email
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  <Option value={true}>Active</Option>
                  <Option value={false}>Inactive</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </Layout>
  );
}

// Dashboard Component
const DashboardContent = ({ semesters, students, lecturers, kits, iotSubjects }) => {
  // Calculate statistics
  const activeSemesters = semesters.filter(s => s.status === 'Active').length;
  const totalStudents = students.length;
  const totalLecturers = lecturers.length;
  const availableKits = kits.filter(k => k.status === 'AVAILABLE').length;
  const activeIotSubjects = iotSubjects.filter(s => s.status === 'Active').length;
  
  // Quick stats for charts
  const enrollmentTrend = [
    { month: 'Jan', count: 45 },
    { month: 'Feb', count: 52 },
    { month: 'Mar', count: 38 },
    { month: 'Apr', count: 61 },
    { month: 'May', count: 55 },
    { month: 'Jun', count: 48 }
  ];

  return (
    <div>
      {/* Welcome Header */}
      <motion.div 
        variants={cardVariants} 
        initial="hidden" 
        animate="visible"
        style={{ marginBottom: '24px' }}
      >
        <Card 
          style={{ 
            borderRadius: '16px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white'
          }}
        >
          <Row align="middle" gutter={24}>
            <Col xs={24} md={16}>
              <Title level={3} style={{ color: 'white', margin: 0 }}>
                Welcome back, Academic Affairs! 👋
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                Here's what's happening in your academic system today
              </Text>
            </Col>
            <Col xs={24} md={8} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '48px' }}>📚</div>
            </Col>
          </Row>
        </Card>
      </motion.div>

      {/* Main Statistics Cards */}
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={12} lg={6}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              <div style={{ color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{activeSemesters}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Active Semesters</div>
                  </div>
                  <ReadOutlined style={{ fontSize: '32px', opacity: 0.8 }} />
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
                  {semesters.length} total semesters
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                border: 'none'
              }}
            >
              <div style={{ color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalStudents}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Students</div>
                  </div>
                  <UserOutlined style={{ fontSize: '32px', opacity: 0.8 }} />
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
                  {totalStudents} total students
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                border: 'none'
              }}
            >
              <div style={{ color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{totalLecturers}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Total Lecturers</div>
                  </div>
                  <TeamOutlined style={{ fontSize: '32px', opacity: 0.8 }} />
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
                  {activeIotSubjects} active IoT subjects
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              style={{ 
                borderRadius: '16px', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                border: 'none'
              }}
            >
              <div style={{ color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{availableKits}</div>
                    <div style={{ fontSize: '14px', opacity: 0.8 }}>Available Kits</div>
                  </div>
                  <ToolOutlined style={{ fontSize: '32px', opacity: 0.8 }} />
                </div>
                <div style={{ marginTop: '16px', fontSize: '12px', opacity: 0.7 }}>
                  {kits.length} total kits
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Charts and Analytics Section */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChartOutlined style={{ color: '#667eea' }} />
                  <span>Enrollment Trends</span>
                </div>
              }
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <BarChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>Enrollment trend visualization</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    {enrollmentTrend.map(item => `${item.month}: ${item.count}`).join(' | ')}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
        
        <Col xs={24} lg={8}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PieChartOutlined style={{ color: '#f093fb' }} />
                  <span>System Overview</span>
                </div>
              }
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: '#666' }}>
                  <PieChartOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
                  <div>System distribution chart</div>
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    Students: {totalStudents} | Lecturers: {totalLecturers} | Kits: {kits.length}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ThunderboltOutlined style={{ color: '#fa8c16' }} />
                  <span>Quick Actions</span>
                </div>
              }
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Button 
                    type="primary" 
                    icon={<UserAddOutlined />} 
                    block
                    style={{ 
                      height: '80px', 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    <div>Add Student</div>
                  </Button>
                </Col>
                <Col span={12}>
                  <Button 
                    type="primary" 
                    icon={<TeamOutlined />} 
                    block
                    style={{ 
                      height: '80px', 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      border: 'none'
                    }}
                  >
                    <div>Add Lecturer</div>
                  </Button>
                </Col>

                <Col span={12}>
                  <Button 
                    type="primary" 
                    icon={<ToolOutlined />} 
                    block
                    style={{ 
                      height: '80px', 
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      border: 'none'
                    }}
                  >
                    <div>Manage Kits</div>
                  </Button>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* System Status and Performance */}
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <DashboardOutlined style={{ color: '#722ed1' }} />
                  <span>System Performance</span>
                </div>
              }
              style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress 
                      type="circle" 
                      percent={85} 
                      format={() => '85%'}
                      strokeColor="#667eea"
                      size={80}
                    />
                    <div style={{ marginTop: '16px', fontWeight: 'bold' }}>System Health</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>All systems operational</div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress 
                      type="circle" 
                      percent={92} 
                      format={() => '92%'}
                      strokeColor="#52c41a"
                      size={80}
                    />
                    <div style={{ marginTop: '16px', fontWeight: 'bold' }}>Data Accuracy</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>High quality data</div>
                  </div>
                </Col>
                <Col xs={24} sm={8}>
                  <div style={{ textAlign: 'center' }}>
                    <Progress 
                      type="circle" 
                      percent={78} 
                      format={() => '78%'}
                      strokeColor="#fa8c16"
                      size={80}
                    />
                    <div style={{ marginTop: '16px', fontWeight: 'bold' }}>User Satisfaction</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Good feedback</div>
                  </div>
                </Col>
              </Row>
            </Card>
          </motion.div>
        </Col>
      </Row>
    </div>
  );
};

// Student Enrollment Component
const StudentEnrollment = ({ semesters, setSemesters, semesterModal, setSemesterModal, semesterForm }) => {
  const [enrollmentModal, setEnrollmentModal] = useState({ visible: false, data: {} });
  const [studentModal, setStudentModal] = useState({ visible: false, data: {} });
  const [detailModal, setDetailModal] = useState({ visible: false, data: {} });
  const [enrollmentForm] = Form.useForm();
  const [studentForm] = Form.useForm();
  const [classAssignments, setClassAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classStudents, setClassStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load data when component mounts
  useEffect(() => {
    loadEnrollmentData();
  }, []);

  const loadEnrollmentData = async () => {
    setLoading(true);
    try {
      // Load class assignments - only lecturers for main table
      const allAssignments = await classAssignmentAPI.getAll();
      const lecturerAssignments = allAssignments.filter(assignment => 
        assignment.roleName === 'LECTURER' || assignment.roleName === 'TEACHER'
      );
      setClassAssignments(lecturerAssignments);

      // Load classes
      const classesData = await classesAPI.getAllClasses();
      const classOptions = classesData.map(cls => ({
        value: cls.id,
        label: `${cls.classCode} - ${cls.semester}`,
        classCode: cls.classCode,
        semester: cls.semester
      }));
      setClasses(classOptions);

      // Load lecturers
      const lecturersData = await userAPI.getLecturers();
      const lecturerOptions = lecturersData.map(lecturer => ({
        value: lecturer.id,
        label: `${lecturer.fullName} (${lecturer.email})`,
        email: lecturer.email,
        fullName: lecturer.fullName
      }));
      setLecturers(lecturerOptions);

      // Load students
      const studentsData = await userAPI.getStudents();
      const studentOptions = studentsData.map(student => ({
        value: student.id,
        label: `${student.fullName} (${student.email})`,
        email: student.email,
        fullName: student.fullName
      }));
      setStudents(studentOptions);
    } catch (error) {
      console.error('Error loading enrollment data:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load enrollment data',
        placement: 'topRight',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSubmit = async () => {
    try {
      const values = await studentForm.validateFields();
      
      const studentData = {
        classId: values.classId,
        accountId: values.accountId
      };

      await classAssignmentAPI.create(studentData);
      
      // Refresh data
      await loadEnrollmentData();
      
      notification.success({
        message: 'Success',
        description: 'Student enrolled successfully',
        placement: 'topRight',
      });

      setStudentModal({ visible: false, data: {} });
      studentForm.resetFields();
    } catch (error) {
      console.error('Error enrolling student:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to enroll student',
        placement: 'topRight',
      });
    }
  };

  const handleAddStudent = (record) => {
    // Set the classId from the record
    studentForm.setFieldsValue({
      classId: record.classId
    });
    setStudentModal({ visible: true, data: record });
  };

  const handleShowDetail = async (record) => {
    try {
      // Get all assignments for this class (including students)
      const allAssignments = await classAssignmentAPI.getAll();
      const studentsInClass = allAssignments.filter(assignment => 
        assignment.classId === record.classId && 
        assignment.roleName === 'STUDENT'
      );
      setClassStudents(studentsInClass);
      setDetailModal({ visible: true, data: record });
    } catch (error) {
      console.error('Error loading class students:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load class students',
        placement: 'topRight',
      });
    }
  };

  const handleEnrollmentSubmit = async () => {
    try {
      const values = await enrollmentForm.validateFields();
      
      const enrollmentData = {
        classId: values.classId,
        accountId: values.accountId
      };

      await classAssignmentAPI.create(enrollmentData);
      
      // Refresh data
      await loadEnrollmentData();
      
      notification.success({
        message: 'Success',
        description: 'Lecturer assigned successfully',
        placement: 'topRight',
      });

      setEnrollmentModal({ visible: false, data: {} });
      enrollmentForm.resetFields();
    } catch (error) {
      console.error('Error enrolling student:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to assign lecturer',
        placement: 'topRight',
      });
    }
  };

  const handleDeleteEnrollment = async (record) => {
    Modal.confirm({
      title: 'Delete Assignment',
      content: `Are you sure you want to delete this lecturer assignment?`,
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await classAssignmentAPI.delete(record.id);
          await loadEnrollmentData();
          notification.success({
            message: 'Success',
            description: 'Assignment deleted successfully',
            placement: 'topRight',
          });
        } catch (error) {
          console.error('Error deleting assignment:', error);
          notification.error({
            message: 'Error',
            description: 'Failed to delete assignment',
            placement: 'topRight',
          });
        }
      },
    });
  };

  const columns = [
    { title: 'Lecturer Name', dataIndex: 'accountName', key: 'accountName' },
    { title: 'Lecturer Email', dataIndex: 'accountEmail', key: 'accountEmail' },
    { 
      title: 'IoT Subject', 
      dataIndex: 'classId', 
      key: 'classId',
      render: (classId) => {
        const classInfo = classes.find(c => c.value === classId);
        return classInfo ? classInfo.label : '-';
      }
    },
    { title: 'Assignment Date', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="default" size="small" icon={<EyeOutlined />} onClick={() => handleShowDetail(record)}>
            View Students
          </Button>
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleAddStudent(record)}>
            Add Student
          </Button>
          <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteEnrollment(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card 
          title="Class Assignment" 
        extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEnrollmentModal({ visible: true, data: {} })}>
              Assign Lecturer
          </Button>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
          <Spin spinning={loading}>
        <Table
              dataSource={classAssignments}
              columns={columns}
              rowKey="id"
              pagination={{
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`
              }}
            />
          </Spin>
        </Card>
      </motion.div>

      {/* Assignment Modal */}
      <Modal
        title="Assign Lecturer to IoT Subject"
        open={enrollmentModal.visible}
        onOk={handleEnrollmentSubmit}
        onCancel={() => {
          setEnrollmentModal({ visible: false, data: {} });
          enrollmentForm.resetFields();
        }}
        width={600}
        okText="Assign"
        cancelText="Cancel"
      >
        <Form form={enrollmentForm} layout="vertical">
          <Form.Item
            name="classId"
            label="IoT Subject"
            rules={[{ required: true, message: 'Please select a class' }]}
          >
            <Select
              showSearch
              placeholder="Search and select IoT subject"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={classes}
            />
          </Form.Item>
          <Form.Item
            name="accountId"
            label="Lecturer"
            rules={[{ required: true, message: 'Please select a lecturer' }]}
          >
            <Select
              showSearch
              placeholder="Search and select lecturer"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={lecturers}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Student Modal */}
      <Modal
        title="Enroll Student to IoT Subject"
        open={studentModal.visible}
        onOk={handleStudentSubmit}
        onCancel={() => {
          setStudentModal({ visible: false, data: {} });
          studentForm.resetFields();
        }}
        width={600}
        okText="Enroll"
        cancelText="Cancel"
      >
        <Form form={studentForm} layout="vertical">
          <Form.Item
            name="classId"
            label="IoT Subject"
            rules={[{ required: true, message: 'Please select a class' }]}
          >
            <Select
              showSearch
              placeholder="Search and select IoT subject"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={classes}
              disabled={true}
            />
          </Form.Item>
          <Form.Item
            name="accountId"
            label="Student"
            rules={[{ required: true, message: 'Please select a student' }]}
          >
            <Select
              showSearch
              placeholder="Search and select student"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={students}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        title={`Students in ${detailModal.data.classId ? classes.find(c => c.value === detailModal.data.classId)?.label : 'Class'} (${classStudents.length} students)`}
        open={detailModal.visible}
        onCancel={() => {
          setDetailModal({ visible: false, data: {} });
          setClassStudents([]);
        }}
        width={800}
        footer={[
          <Button key="close" onClick={() => {
            setDetailModal({ visible: false, data: {} });
            setClassStudents([]);
          }}>
            Close
          </Button>
        ]}
      >
        <Table
          dataSource={classStudents}
          columns={[
            { title: 'Student Name', dataIndex: 'accountName', key: 'accountName' },
            { title: 'Student Email', dataIndex: 'accountEmail', key: 'accountEmail' },
            { title: 'Enrollment Date', dataIndex: 'createdAt', key: 'createdAt' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Button 
                  type="primary" 
                  danger 
                  size="small" 
                  icon={<DeleteOutlined />} 
                  onClick={() => handleDeleteEnrollment(record)}
                >
                  Remove
                  </Button>
              ),
            },
          ]}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} students`
          }}
          locale={{
            emptyText: 'No students enrolled in this class'
          }}
        />
      </Modal>
  </div>
);
};



// Student Management Component
const StudentManagement = ({ students, setStudents, studentModal, setStudentModal, studentForm, handleExportStudents, handleImportStudents, handleAddStudent, handleEditStudent, handleDeleteStudent }) => (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card 
        title="Student Management" 
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
                  handleImportStudents(file);
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
                  Import Students
                </Button>
              </Upload>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                icon={<ExportOutlined />}
                onClick={handleExportStudents}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  fontWeight: 'bold',
                  color: '#fff'
                }}
              >
                Export Students
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddStudent}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                Add Student
              </Button>
            </motion.div>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Table
          dataSource={students}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Student Code', dataIndex: 'studentCode', key: 'studentCode' },
            { title: 'Phone Number', dataIndex: 'phoneNumber', key: 'phoneNumber' },
            { title: 'Enrollment Date', dataIndex: 'createdAt', key: 'createdAt' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditStudent(record)}>
                    Edit
                  </Button>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteStudent(record)}>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
          rowKey="id"
        />
      </Card>
    </motion.div>
  </div>
);

// Lecturer Management Component
const LecturerManagement = ({ lecturers, setLecturers, lecturerModal, setLecturerModal, lecturerForm, handleExportLecturers, handleImportLecturers, handleAddLecturer, handleEditLecturer, handleDeleteLecturer }) => (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card 
        title="Lecturer Management" 
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
                  handleImportLecturers(file);
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
                  Import Lecturers
                </Button>
              </Upload>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                icon={<ExportOutlined />}
                onClick={handleExportLecturers}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                  border: 'none',
                  fontWeight: 'bold',
                  color: '#fff'
                }}
              >
                Export Lecturers
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={handleAddLecturer}
                style={{
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  fontWeight: 'bold'
                }}
              >
                Add Lecturer
              </Button>
            </motion.div>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Table
          dataSource={lecturers}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Phone Number', dataIndex: 'phoneNumber', key: 'phoneNumber' },
            { title: 'Hire Date', dataIndex: 'createdAt', key: 'createdAt' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditLecturer(record)}>
                    Edit
                  </Button>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteLecturer(record)}>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
          rowKey="id"
        />
      </Card>
    </motion.div>
  </div>
);



// Log History Component
const LogHistory = ({ logs }) => (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card title="Log History" style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <Table
          dataSource={logs}
          columns={[
            { title: 'Timestamp', dataIndex: 'timestamp', key: 'timestamp' },
            { title: 'Action', dataIndex: 'action', key: 'action' },
            { title: 'User', dataIndex: 'user', key: 'user' },
            { title: 'Details', dataIndex: 'details', key: 'details' },
          ]}
          rowKey="id"
        />
      </Card>
    </motion.div>
  </div>
);

// IOT Subjects Management Component
const IotSubjectsManagement = ({ iotSubjects, setIotSubjects, selectedSemester, setSelectedSemester, semesters, handleAddIotSubject, handleEditIotSubject, handleViewIotSubjectStudents, handleDeleteIotSubject }) => (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card 
        title="IOT Subjects Management" 
        extra={
          <Space>
            <Select
              placeholder="Select Semester"
              style={{ width: 200 }}
              value={selectedSemester}
              onChange={setSelectedSemester}
            >
              {semesters.map(semester => (
                <Option key={semester.id} value={semester.id}>
                  {semester.name}
                </Option>
              ))}
            </Select>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddIotSubject}
              style={{
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                fontWeight: 'bold'
              }}
            >
              Add IOT Subject
            </Button>
          </Space>
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Alert
          message="IOT Subjects Management"
          description="Manage IOT-related subjects for each semester. Only IOT subjects are displayed here."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          dataSource={iotSubjects}
          columns={[
            { title: 'Class Code', dataIndex: 'classCode', key: 'classCode' },
            { title: 'Semester', dataIndex: 'semester', key: 'semester' },
            { title: 'Lecturer', dataIndex: 'teacherName', key: 'teacherName' },
            { 
              title: 'Status', 
              dataIndex: 'status', 
              key: 'status',
              render: (status) => (
                <Tag color={status ? 'green' : 'red'}>
                  {status ? 'Active' : 'Inactive'}
                </Tag>
              )
            },
            { title: 'Created At', dataIndex: 'createdAt', key: 'createdAt' },
            { title: 'Updated At', dataIndex: 'updatedAt', key: 'updatedAt' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEditIotSubject(record)}>
                    Edit
                  </Button>
                  <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewIotSubjectStudents(record)}>
                    View Students
                  </Button>
                  <Button type="primary" danger size="small" icon={<DeleteOutlined />} onClick={() => handleDeleteIotSubject(record)}>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
          rowKey="id"
        />
      </Card>
    </motion.div>
  </div>
);



// Kits Management Component
const KitsManagement = ({ kits, setKits, handleExportKits, handleViewKitDetails }) => (
  <div>
    <motion.div variants={cardVariants} initial="hidden" animate="visible" whileHover="hover">
      <Card 
        title="Kits Management" 
        extra={
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
        }
        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Total Kits"
                value={kits.length}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Available"
                value={kits.filter(kit => kit.status === 'AVAILABLE').length}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="In Use"
                value={kits.filter(kit => kit.status === 'IN-USE').length}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic
                title="Damaged"
                value={kits.filter(kit => kit.status === 'DAMAGED').length}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
        
        <Table
          dataSource={kits}
          columns={[
            { title: 'Kit Name', dataIndex: 'name', key: 'name' },
            { title: 'Category', dataIndex: 'category', key: 'category' },
            { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
            { title: 'Location', dataIndex: 'location', key: 'location' },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status) => {
                const colors = {
                  'AVAILABLE': 'green',
                  'IN-USE': 'orange',
                  'DAMAGED': 'red',
                  'MAINTENANCE': 'blue'
                };
                return <Tag color={colors[status]}>{status}</Tag>;
              }
            },
            { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price}` },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button type="primary" size="small" icon={<EyeOutlined />} onClick={() => handleViewKitDetails(record)}>
                    View Details
                  </Button>
                </Space>
              ),
            },
          ]}
          rowKey="id"
        />
      </Card>
    </motion.div>
  </div>
);

export default AcademicAffairsPortal; 