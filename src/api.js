              const API_BASE_URL = 'http://localhost:8080';

// Helper function to get JWT token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    // Try to parse error response as JSON first
    try {
      const errorJson = await response.json();
      // Extract error message from common response structures
      const errorMessage = errorJson.message || errorJson.error || errorJson.details || JSON.stringify(errorJson);
      throw new Error(errorMessage);
    } catch (jsonError) {
      // If JSON parsing fails, fall back to text
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }
  }
  // Try to parse JSON based on content-type; fallback to text if not JSON
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (e) {
      // Fallback: read as text and try to parse, otherwise return raw text
      const text = await response.text().catch(() => '');
      try {
        return JSON.parse(text);
      } catch {
        return { raw: text };
      }
    }
  } else {
    const text = await response.text().catch(() => '');
    try {
      return JSON.parse(text);
    } catch {
      return { raw: text };
    }
  }
};

const extractArrayFromPayload = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const candidateKeys = ['data', 'content', 'records', 'items', 'result', 'list'];

    for (const key of candidateKeys) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        const extracted = extractArrayFromPayload(payload[key]);
        if (Array.isArray(extracted)) {
          return extracted;
        }
      }
    }
  }

  return Array.isArray(payload) ? payload : [];
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  // Merge headers properly
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers || {})
  };
  
  const config = {
    ...options,
    headers: mergedHeaders
  };

  console.log('Making API request:', {
    method: config.method || 'GET',
    url: url,
    headers: config.headers,
    body: config.body
  });

  try {
    const response = await fetch(url, config);
    return await handleResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Login failed');
      }
      
      const token = await response.text();
      localStorage.setItem('authToken', token);
      return token;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  register: async (username, password, studentCode = null, roles = 'STUDENT', phoneNumber = null, fullName = null) => {
    try {
      const requestData = {
        username,
        password,
        roles: roles.toUpperCase()
      };
      
      // Only add studentCode if provided and role is STUDENT
      if (studentCode && roles.toUpperCase() === 'STUDENT') {
        requestData.studentCode = studentCode;
      }
      
      // Add phoneNumber if provided
      if (phoneNumber) {
        requestData.phoneNumber = phoneNumber;
      }
      
      // Add fullName if provided
      if (fullName) {
        requestData.fullName = fullName;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Registration failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  getProfile: async () => {
    return apiRequest('/api/me/profile');
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Update user failed');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update user failed:', error);
      throw error;
    }
  },

  updateProfile: async (profileData) => {
    return apiRequest('/api/me/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  isAuthenticated: () => {
    return !!getAuthToken();
  }
};

// User Management API
export const userAPI = {
  getUsers: async () => {
    return apiRequest('/api/admin/users');
  },

  getAllAccounts: async (page = 0, size = 10) => {
    return apiRequest(`/api/admin/accounts?page=${page}&size=${size}`);
  },

  createUser: async (userData) => {
    return apiRequest('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  createSingleStudent: async (studentData) => {
    // Map FE data to BE RegisterRequest format
    // Note: username in BE is actually email
    console.log('Creating student with data:', studentData);
    
    if (!studentData.email) {
      throw new Error('Email is required');
    }
    
    const requestData = {
      username: studentData.email,  // username is email in RegisterRequest
      password: studentData.password || '1',
      studentCode: studentData.studentCode,
      roles: 'STUDENT',
      phoneNumber: studentData.phoneNumber,
      fullName: studentData.name
    };
    
    console.log('Request data:', requestData);
    
    return apiRequest('/api/aas/create-single-student', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  createSingleLecturer: async (lecturerData) => {
    // Map FE data to BE RegisterRequest format
    // Note: username in BE is actually email
    console.log('Creating lecturer with data:', lecturerData);
    
    if (!lecturerData.email) {
      throw new Error('Email is required');
    }
    
    const requestData = {
      username: lecturerData.email,  // username is email in RegisterRequest
      password: lecturerData.password || '1',
      studentCode: lecturerData.studentCode || '',
      roles: 'LECTURER',
      phoneNumber: lecturerData.phoneNumber,
      fullName: lecturerData.name
    };
    
    console.log('Request data:', requestData);
    
    return apiRequest('/api/aas/create-single-lecturer', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  },

  updateUser: async (id, userData) => {
    return apiRequest(`/api/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  deleteUser: async (id) => {
    return apiRequest(`/api/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  getLecturers: async () => {
    try {
      const response = await apiRequest('/api/classes/getListLecturers');
      if (response && Array.isArray(response)) {
        return response.map(lecturer => ({
          value: lecturer.email,
          label: lecturer.fullName || lecturer.email,
          email: lecturer.email,
          fullName: lecturer.fullName,
          id: lecturer.id,
          phone: lecturer.phone,
          createdAt: lecturer.createdAt,
          status: lecturer.isActive ? 'ACTIVE' : 'INACTIVE'
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch lecturers:', error);
      return [];
    }
  },

  getStudents: async () => {
    try {
      const response = await apiRequest('/api/getAllStudent');
      console.log('Students response:', response);
      
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map(student => ({
          id: student.id,
          email: student.email,
          fullName: student.fullName || student.email,
          studentCode: student.studentCode,
          phoneNumber: student.phone,
          createdAt: student.createdAt, // Backend trả về createdAt
          status: student.isActive ? 'ACTIVE' : 'INACTIVE'
        }));
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch students:', error);
      return [];
    }
  },
};

// Group Management API
export const groupAPI = {
  getAllGroups: async () => {
    return apiRequest('/api/student-groups/getAll');
  },

  getGroupById: async (id) => {
    return apiRequest(`/api/student-groups/getById/${id}`);
  },

  createGroup: async (groupData) => {
    return apiRequest('/api/student-groups/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  updateGroup: async (id, groupData) => {
    return apiRequest(`/api/student-groups/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
    });
  },

  deleteGroup: async (id) => {
    return apiRequest(`/api/student-groups/delete/${id}`, {
      method: 'DELETE',
    });
  },

  createGroupWithRandomStudents: async (groupName, lecturerEmail, studentIds) => {
    try {
      // Create group with lecturer
      const groupData = {
        groupName: groupName,
        lecturerEmail: lecturerEmail,
        studentIds: studentIds,
        status: true
      };
      
      return apiRequest('/api/student-groups/create', {
        method: 'POST',
        body: JSON.stringify(groupData),
      });
    } catch (error) {
      console.error('Failed to create group with random students:', error);
      throw error;
    }
  },
};

// IOT Subjects (Classes) API
export const classesAPI = {
  getAllClasses: async () => {
    return apiRequest('/api/classes/get_All');
  },

  getClassById: async (id) => {
    return apiRequest(`/api/classes/getbyId/${id}`);
  },

  getListLecturers: async () => {
    return apiRequest('/api/classes/getListLecturers');
  },

  createClass: async (classData, teacherId) => {
    return apiRequest(`/api/classes/post/${teacherId}`, {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },

  updateClass: async (id, classData) => {
    return apiRequest(`/api/classes/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(classData),
    });
  },

  deleteClass: async (id) => {
    return apiRequest(`/api/classes/delete/${id}`, {
      method: 'DELETE',
    });
  },
};

// Kit Management API
export const kitAPI = {
  getAllKits: async () => {
    return apiRequest('/api/kits/');
  },

  getKitById: async (kitId) => {
    return apiRequest(`/api/kits/${kitId}`);
  },

  createKit: async (kitData) => {
    return apiRequest('/api/kits/create', {
      method: 'POST',
      body: JSON.stringify(kitData),
    });
  },

  createSingleKit: async (kitData) => {
    return apiRequest('/api/kits/create-single', {
      method: 'POST',
      body: JSON.stringify(kitData),
    });
  },

  addSingleComponent: async (componentData) => {
    return apiRequest('/api/kits/add-one', {
      method: 'POST',
      body: JSON.stringify(componentData),
    });
  },

  addMultipleComponents: async (componentsData) => {
    return apiRequest('/api/kits/add-many', {
      method: 'POST',
      body: JSON.stringify(componentsData),
    });
  },

  updateKit: async (kitId, kitData) => {
    return apiRequest(`/api/kits/${kitId}`, {
      method: 'PUT',
      body: JSON.stringify(kitData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  getStudentKits: async () => {
    console.log('===== Calling getStudentKits API =====');
    try {
      const result = await apiRequest('/api/kits/student');
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

// Kit Component API
export const kitComponentAPI = {
  createComponent: async (componentData) => {
    return apiRequest('/api/kitComponent', {
      method: 'POST',
      body: JSON.stringify(componentData),
    });
  },

  getComponentById: async (id) => {
    return apiRequest(`/api/kitComponent?id=${id}`);
  },

  getAllComponents: async () => {
    return apiRequest('/api/kitComponent/all');
  },

  updateComponent: async (id, componentData) => {
    return apiRequest(`/api/kitComponent?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(componentData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  deleteComponent: async (id) => {
    return apiRequest(`/api/kitComponent?id=${id}`, {
      method: 'DELETE',
    });
  }
};


// Wallet API
export const walletAPI = {
  getMyWallet: async () => {
    return apiRequest('/api/wallet/myWallet');
  },
  
  getWallet: async () => {
    const response = await apiRequest('/api/wallet/myWallet');
    return { wallet: response };
  },
  
  topUp: async (amount, description) => {
    return apiRequest('/api/wallet-transactions/top-up', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
        description: description
      }),
    });
  },
  
  deduct: async (amount, description) => {
    // Simulate deducting from wallet
    // In real implementation, this would call an API to deduct the amount
    console.log('Deducting:', amount, description);
    return { success: true };
  }
};

// Wallet Transaction API
export const walletTransactionAPI = {
  getAll: async () => {
    const response = await apiRequest('/api/wallet-transactions/getAll');
    return response.data || [];
  },
  
  getHistory: async () => {
    const response = await apiRequest('/api/wallet-transactions/history');
    return response.data || [];
  }
};

// Payment API (VNPay)
export const paymentAPI = {
  createPayment: async (amount, orderInfo, bankCode = null) => {
    return apiRequest('/api/payment/create-payment', {
      method: 'POST',
      body: JSON.stringify({
        amount: amount,
        orderInfo: orderInfo,
        bankCode: bankCode
      }),
    });
  },

  updateTransaction: async (transactionId, status, amount = null) => {
    const url = `/api/payment/update-transaction?transactionId=${transactionId}&status=${status}${amount ? `&amount=${amount}` : ''}`;
    return apiRequest(url, {
      method: 'POST',
    });
  }
};

// Penalty Policies API
export const penaltyPoliciesAPI = {
  getAll: async () => {
    return apiRequest('/api/penalty-policies/getAll');
  },

  getById: async (id) => {
    return apiRequest(`/api/penalty-policies/getById/${id}`);
  },

  create: async (policyData) => {
    return apiRequest('/api/penalty-policies/create', {
      method: 'POST',
      body: JSON.stringify(policyData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, policyData) => {
    return apiRequest(`/api/penalty-policies/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(policyData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/penalty-policies/delete/${id}`, {
      method: 'DELETE',
    });
  }
};

// Penalties API
export const penaltiesAPI = {
  getAll: async () => {
    return apiRequest('/api/penalties/getAll');
  },

  getUnresolved: async () => {
    return apiRequest('/api/penalties/getAllByResolved-F');
  },

  getPenByAccount: async () => {
    return apiRequest('/api/penalties/getPenByAccount');
  },

  getById: async (id) => {
    return apiRequest(`/api/penalties/${id}`);
  },

  create: async (penaltyData) => {
    return apiRequest('/api/penalties/create', {
      method: 'POST',
      body: JSON.stringify(penaltyData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, penaltyData) => {
    return apiRequest(`/api/penalties/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(penaltyData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/penalties/delete/${id}`, {
      method: 'DELETE',
    });
  },
  confirmPenaltyPayment: async (penaltyId) => {
    return apiRequest(`/api/penalties/confirm-payment/${penaltyId}`, {
      method: 'POST'
    });
  }
};

// Penalty Details API
export const penaltyDetailAPI = {
  getAll: async () => {
    return apiRequest('/api/penalty-details');
  },

  getById: async (id) => {
    return apiRequest(`/api/penalty-details/${id}`);
  },

  create: async (detailData) => {
    return apiRequest('/api/penalty-details/create', {
      method: 'POST',
      body: JSON.stringify(detailData),
    });
  },

  createMultiple: async (detailsData) => {
    return apiRequest('/api/penalty-details/create-multiple', {
      method: 'POST',
      body: JSON.stringify(detailsData),
    });
  },

  findByPenaltyId: async (penaltyId) => {
    return apiRequest(`/api/penalty-details/penalty/${penaltyId}`);
  },

  findByPoliciesId: async (policiesId) => {
    return apiRequest(`/api/penalty-details/policies/${policiesId}`);
  }
};

// Damage Report API
export const damageReportAPI = {
  getAll: async () => {
    return apiRequest('/api/reports/damage');
  },

  getById: async (id) => {
    return apiRequest(`/api/reports/damage/${id}`);
  },

  create: async (reportData) => {
    return apiRequest('/api/reports/damage/create', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  },

  update: async (id, reportData) => {
    return apiRequest(`/api/reports/damage/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/reports/damage/${id}`, {
      method: 'DELETE',
    });
  },

  getByAccountId: async (accountId) => {
    return apiRequest(`/api/reports/damage/account/${accountId}`);
  },

  getByKitId: async (kitId) => {
    return apiRequest(`/api/reports/damage/kit/${kitId}`);
  },

  getByBorrowRequestId: async (borrowRequestId) => {
    return apiRequest(`/api/reports/damage/borrow-request/${borrowRequestId}`);
  },

  getByStatus: async (status) => {
    return apiRequest(`/api/reports/damage/status/${status}`);
  }
};

// Excel Import API
export const excelImportAPI = {
  importAccounts: async (file, role) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', role);
    
    return apiRequest('/api/excel/import', {
      method: 'POST',
      body: formData,
    });
  },

  importAccountsBase64: async (fileContent, role, fileName) => {
    return apiRequest('/api/excel/import-base64', {
      method: 'POST',
      body: JSON.stringify({
        fileContent,
        role,
        fileName
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};

// Student Group API
export const studentGroupAPI = {
  getAll: async () => {
    return apiRequest('/api/student-groups/getAll');
  },

  getById: async (id) => {
    return apiRequest(`/api/student-groups/getById/${id}`);
  },

  create: async (groupData) => {
    return apiRequest('/api/student-groups/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, groupData) => {
    return apiRequest(`/api/student-groups/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(groupData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/student-groups/delete/${id}`, {
      method: 'DELETE',
    });
  }
};

// Borrowing Group API
export const borrowingGroupAPI = {
  getAll: async () => {
    return apiRequest('/api/borrowing-groups');
  },

  getById: async (id) => {
    return apiRequest(`/api/borrowing-groups/${id}`);
  },

  create: async (borrowingGroupData) => {
    return apiRequest('/api/borrowing-groups', {
      method: 'POST',
      body: JSON.stringify(borrowingGroupData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, borrowingGroupData) => {
    return apiRequest(`/api/borrowing-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(borrowingGroupData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/borrowing-groups/${id}`, {
      method: 'DELETE',
    });
  },

  getByStudentGroupId: async (studentGroupId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}`);
  },

  getByAccountId: async (accountId) => {
    return apiRequest(`/api/borrowing-groups/account/${accountId}`);
  },

  getByStudentGroupAndAccount: async (studentGroupId, accountId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}/account/${accountId}`);
  },

  addMemberToGroup: async (borrowingGroupData) => {
    console.log('===== Calling addMemberToGroup API =====');
    console.log('Request data:', borrowingGroupData);
    try {
      const result = await apiRequest('/api/borrowing-groups/add-member', {
        method: 'POST',
        body: JSON.stringify(borrowingGroupData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  removeMemberFromGroup: async (studentGroupId, accountId) => {
    console.log('===== Calling removeMemberFromGroup API =====');
    console.log('studentGroupId:', studentGroupId);
    console.log('accountId:', accountId);
    try {
      const result = await apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}/account/${accountId}`, {
        method: 'DELETE',
      });
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  promoteToLeader: async (borrowingGroupData) => {
    console.log('===== Calling promoteToLeader API =====');
    console.log('Request data:', borrowingGroupData);
    try {
      const result = await apiRequest('/api/borrowing-groups/promote-leader', {
        method: 'PUT',
        body: JSON.stringify(borrowingGroupData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  demoteToMember: async (borrowingGroupData) => {
    console.log('===== Calling demoteToMember API =====');
    console.log('Request data:', borrowingGroupData);
    try {
      const result = await apiRequest('/api/borrowing-groups/demote-member', {
        method: 'PUT',
        body: JSON.stringify(borrowingGroupData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('API Response received:', result);
      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  countByStudentGroupId: async (studentGroupId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}/count`);
  },

  getByStudentGroupIdWithDetails: async (studentGroupId) => {
    return apiRequest(`/api/borrowing-groups/student-group/${studentGroupId}/details`);
  }
};

// Class Assignment API
export const classAssignmentAPI = {
  getAll: async () => {
    return apiRequest('/api/class-assignments');
  },

  getById: async (id) => {
    return apiRequest(`/api/class-assignments/${id}`);
  },

  create: async (assignmentData) => {
    return apiRequest('/api/class-assignments', {
      method: 'POST',
      body: JSON.stringify(assignmentData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  update: async (id, assignmentData) => {
    return apiRequest(`/api/class-assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(assignmentData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  delete: async (id) => {
    return apiRequest(`/api/class-assignments/${id}`, {
      method: 'DELETE',
    });
  }
};

// Borrowing Requests API
export const borrowingRequestAPI = {
  getAll: async () => {
    const response = await apiRequest('/api/borrowing-requests');
    return response.data || [];
  },

  getApproved: async () => {
    const response = await apiRequest('/api/borrowing-requests/getAPPROVED');
    return response.data || [];
  },

  getByStatuses: async (statuses) => {
    const statusParams = statuses.map(s => `statuses=${encodeURIComponent(s)}`).join('&');
    const response = await apiRequest(`/api/borrowing-requests/by-statuses?${statusParams}`);
    return response.data || [];
  },

  getById: async (id) => {
    const response = await apiRequest(`/api/borrowing-requests/get_by/${id}`);
    return response.data;
  },

  getByUser: async (userId) => {
    const response = await apiRequest(`/api/borrowing-requests/user/${userId}`);
    const payload = response?.data ?? response;
    const extracted = extractArrayFromPayload(payload);
    return Array.isArray(extracted) ? extracted : [];
  },

  create: async (requestData) => {
    const response = await apiRequest('/api/borrowing-requests/post', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    return response.data;
  },

  createComponentRequest: async (componentRequestData) => {
    const response = await apiRequest('/api/borrowing-requests/component', {
      method: 'POST',
      body: JSON.stringify(componentRequestData),
    });
    return response.data;
  },

  update: async (id, requestData) => {
    const response = await apiRequest(`/api/borrowing-requests/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(requestData),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  delete: async (id) => {
    return apiRequest(`/api/borrowing-requests/delete/${id}`, {
      method: 'DELETE',
    });
  },

  getRequestComponents: async (requestId) => {
    const response = await apiRequest(`/api/request-kit-components/by-request/${requestId}`);
    return response.data || [];
  }
};

// Refund API
export const refundAPI = {
  // submitRefundRequest: async (refundData) => {
  //   return apiRequest('/api/refunds/request', {
  //     method: 'POST',
  //     body: JSON.stringify(refundData),
  //   });
  // },
  // getRefundRequests: async () => {
  //   return apiRequest('/api/admin/refund-requests');
  // },
  // approveRefundRequest: async (id, damageAssessment) => {
  //   return apiRequest(`/api/admin/refund-requests/${id}/approve`, {
  //     method: 'POST',
  //     body: JSON.stringify({ damageAssessment }),
  //   });
  // },
  // rejectRefundRequest: async (id, reason) => {
  //   return apiRequest(`/api/admin/refund-requests/${id}/reject`, {
  //     method: 'POST',
  //     body: JSON.stringify({ reason }),
  //   });
  // },
  // Use mocks for testing
};

// Notification API
export const notificationAPI = {
  getMyNotifications: async () => {
    const response = await apiRequest('/api/notifications/user');
    return response.data || response;
  },

  getRoleNotifications: async () => {
    const response = await apiRequest('/api/notifications/role');
    return response.data || response;
  },

  create: async (payload) => {
    return apiRequest('/api/notifications/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  createNotifications: async (payloads) => {
    return apiRequest('/api/notifications/create-notifications', {
      method: 'POST',
      body: JSON.stringify(payloads),
    });
  },
};

// Student Import API
export const studentAPI = {
  // importStudents: async (studentsData) => {
  //   return apiRequest('/api/students/import', {
  //     method: 'POST',
  //     body: JSON.stringify({ students: studentsData }),
  //   });
  // },
  // Use mocks for testing
};

// Academic Affairs API
export const academicAPI = {
  // Semesters
  // getSemesters: async () => {
  //   return apiRequest('/api/academic/semesters');
  // },
  // createSemester: async (semesterData) => {
  //   return apiRequest('/api/academic/semesters', {
  //     method: 'POST',
  //     body: JSON.stringify(semesterData),
  //   });
  // },
  // updateSemester: async (id, semesterData) => {
  //   return apiRequest(`/api/academic/semesters/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(semesterData),
  //   });
  // },
  // deleteSemester: async (id) => {
  //   return apiRequest(`/api/academic/semesters/${id}`, {
  //     method: 'DELETE',
  //   });
  // },
  // Classes
  // getClasses: async (semesterId) => {
  //   if (semesterId) {
  //     return apiRequest(`/api/academic/semesters/${semesterId}/classes`);
  //   } else {
  //     return apiRequest('/api/academic/classes');
  //   }
  // },
  // createClass: async (semesterId, classData) => {
  //   return apiRequest(`/api/academic/semesters/${semesterId}/classes`, {
  //     method: 'POST',
  //     body: JSON.stringify(classData),
  //   });
  // },
  // updateClass: async (id, classData) => {
  //   return apiRequest(`/api/academic/classes/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(classData),
  //   });
  // },
  // deleteClass: async (id) => {
  //   return apiRequest(`/api/academic/classes/${id}`, {
  //     method: 'DELETE',
  //   });
  // },
  // Students
  // getStudents: async () => {
  //   return apiRequest('/api/academic/students');
  // },
  // createStudent: async (studentData) => {
  //   return apiRequest('/api/academic/students', {
  //     method: 'POST',
  //     body: JSON.stringify(studentData),
  //   });
  // },
  // updateStudent: async (id, studentData) => {
  //   return apiRequest(`/api/academic/students/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(studentData),
  //   });
  // },
  // deleteStudent: async (id) => {
  //   return apiRequest(`/api/academic/students/${id}`, {
  //     method: 'DELETE',
  //   });
  // },
  // Lecturers
  createAccount: async (accountData) => {
    try {
      const requestData = {
        username: accountData.email,
        password: accountData.password || 'default123',
        studentCode: accountData.studentCode || '',
        roles: accountData.role,
        phoneNumber: accountData.phone || '',
        fullName: accountData.fullName
      };
      
      return apiRequest('/api/aas/create-single-lecturer', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  },
  // createLecturer: async (lecturerData) => {
  //   return apiRequest('/api/academic/lecturers', {
  //     method: 'POST',
  //     body: JSON.stringify(lecturerData),
  //   });
  // },
  // updateLecturer: async (id, lecturerData) => {
  //   return apiRequest(`/api/academic/lecturers/${id}`, {
  //     method: 'PUT',
  //     body: JSON.stringify(lecturerData),
  //   });
  // },
  // deleteLecturer: async (id) => {
  //   return apiRequest(`/api/academic/lecturers/${id}`, {
  //     method: 'DELETE',
  //   });
  // },
  // Enrollments
  // getEnrollments: async () => {
  //   return apiRequest('/api/academic/enrollments');
  // },
  // createEnrollment: async (enrollmentData) => {
  //   return apiRequest('/api/academic/enrollments', {
  //     method: 'POST',
  //     body: JSON.stringify(enrollmentData),
  //   });
  // },
  // deleteEnrollment: async (id) => {
  //   return apiRequest(`/api/academic/enrollments/${id}`, {
  //     method: 'DELETE',
  //   });
  // },
  // Assignments
  // getAssignments: async () => {
  //   return apiRequest('/api/academic/assignments');
  // },
  // createAssignment: async (assignmentData) => {
  //   return apiRequest('/api/academic/assignments', {
  //     method: 'POST',
  //     body: JSON.stringify(assignmentData),
  //   });
  // },
  // deleteAssignment: async (id) => {
  //   return apiRequest(`/api/academic/assignments/${id}`, {
  //     method: 'DELETE',
  //   });
  // },
  // Logs
  // getLogs: async () => {
  //   return apiRequest('/api/academic/logs');
  // },
  // Use mocks for testing
};

// QR Code API
export const qrCodeAPI = {
  /**
   * Decode QR code from Base64 image
   * @param {string} base64QRCode - Base64 encoded QR code image
   * @returns {Promise<string>} Decoded text from QR code
   */
  decode: async (base64QRCode) => {
    const response = await apiRequest('/api/qr-code/decode', {
      method: 'POST',
      body: JSON.stringify({ base64QRCode }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  /**
   * Decode QR code from Base64 image (GET method)
   * @param {string} base64QRCode - Base64 encoded QR code image
   * @returns {Promise<string>} Decoded text from QR code
   */
  decodeGet: async (base64QRCode) => {
    const encodedParam = encodeURIComponent(base64QRCode);
    const response = await apiRequest(`/api/qr-code/decode?base64QRCode=${encodedParam}`, {
      method: 'GET',
    });
    return response.data;
  },

  /**
   * Parse QR code plain text and extract structured information
   * @param {string} qrText - Plain text from QR code
   * @returns {Promise<Object>} Parsed information with type and data fields
   */
  parse: async (qrText) => {
    const response = await apiRequest('/api/qr-code/parse', {
      method: 'POST',
      body: JSON.stringify({ qrText }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  },

  /**
   * Parse QR code plain text (GET method)
   * @param {string} qrText - Plain text from QR code
   * @returns {Promise<Object>} Parsed information with type and data fields
   */
  parseGet: async (qrText) => {
    const encodedParam = encodeURIComponent(qrText);
    const response = await apiRequest(`/api/qr-code/parse?qrText=${encodedParam}`, {
      method: 'GET',
    });
    return response.data;
  },
}; 