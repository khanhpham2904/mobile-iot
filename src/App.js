import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import AdminPortal from './AdminPortal';
import LeaderPortal from './LeaderPortal';
import LecturerPortal from './LecturerPortal';
import MemberPortal from './MemberPortal';
import AcademicAffairsPortal from './AcademicAffairsPortal';
import RentalRequestPage from './RentalRequestPage';
import AdminRentalApprovalPage from './AdminRentalApprovalPage';
import AdminRefundApprovalPage from './AdminRefundApprovalPage';
import TopUpPage from './TopUpPage';
import PenaltyPaymentPage from './PenaltyPaymentPage';
import QRInfoPage from './QRInfoPage';
import { motion } from 'framer-motion';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import { authAPI, borrowingGroupAPI } from './api';

function Home({ onLogin, user }) {
  const [error, setError] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ email: '', password: '' });
  const [registerCredentials, setRegisterCredentials] = useState({ email: '', password: '' });
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    if (user) {
      switch (user.role.toLowerCase()) {
        case 'admin':
          navigate('/admin');
          break;
        case 'leader':
          navigate('/leader'); // Leader role loads LeaderPortal
          break;
        case 'lecturer':
          navigate('/lecturer');
          break;
        case 'member':
          navigate('/member'); // Student role loads MemberPortal
          break;
        case 'academic':
          navigate('/academic');
          break;
        default:
          break;
      }
    }
  }, [user, navigate]);

  const handleLogin = async () => {
    try {
      setError('');
      // Use real API login
      await authAPI.login(loginCredentials.email, loginCredentials.password);
      
      // Get user profile after successful login
      const profileResponse = await authAPI.getProfile();
      const userProfile = profileResponse.data;
      
      // Map backend role to frontend role
      const roleMapping = {
        'ADMIN': 'admin',
        'STUDENT': 'member', // Student role loads MemberPortal
        'LECTURER': 'lecturer',
        'LEADER': 'leader',   // Leader role loads LeaderPortal
        'ACADEMIC': 'academic' // Academic role loads AcademicAffairsPortal
      };
      
      const mappedRole = roleMapping[userProfile.role] || 'member';
      
      // Check borrowing group role for STUDENT to determine if they are leader
      let finalRole = mappedRole;
      let borrowingGroupInfo = null;
      
      if (mappedRole === 'member' || mappedRole === 'student') {
        try {
          // Get user's borrowing groups
          const borrowingGroups = await borrowingGroupAPI.getByAccountId(userProfile.id);
          console.log('User borrowing groups:', borrowingGroups);
          
          if (borrowingGroups && borrowingGroups.length > 0) {
            // Find if user has LEADER role
            const leaderGroup = borrowingGroups.find(bg => bg.roles === 'LEADER');
            if (leaderGroup) {
              finalRole = 'leader';
              borrowingGroupInfo = {
                groupId: leaderGroup.studentGroupId,
                role: 'LEADER'
              };
              console.log('User is a LEADER in group:', borrowingGroupInfo);
            } else {
              // User is a member
              const memberGroup = borrowingGroups.find(bg => bg.roles === 'MEMBER');
              if (memberGroup) {
                borrowingGroupInfo = {
                  groupId: memberGroup.studentGroupId,
                  role: 'MEMBER'
                };
                console.log('User is a MEMBER in group:', borrowingGroupInfo);
              }
            }
          }
        } catch (error) {
          console.error('Error checking borrowing group role:', error);
          // Continue with default role
        }
      }
      
      const authenticatedUser = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.fullName || userProfile.email,
        role: finalRole,
        avatarUrl: userProfile.avatarUrl,
        phone: userProfile.phone,
        studentCode: userProfile.studentCode,
        borrowingGroupInfo: borrowingGroupInfo
      };
      
      console.log('Final authenticated user:', authenticatedUser);
      
      onLogin(authenticatedUser);
      
      // Navigate to appropriate portal based on final role
      switch (finalRole) {
        case 'admin':
          navigate('/admin');
          break;
        case 'leader':
          navigate('/leader');
          break;
        case 'lecturer':
          navigate('/lecturer');
          break;
        case 'member':
        case 'student':
          navigate('/member'); // Student role loads MemberPortal
          break;
        case 'academic':
          navigate('/academic'); // Academic role loads AcademicAffairsPortal
          break;
        default:
          navigate('/member');
          break;
      }
    } catch (error) {
      setError('Login failed: ' + error.message);
    }
  };


  const handleRegister = async () => {
    try {
      setError('');
      // Use real API registration
      await authAPI.register(registerCredentials.email, registerCredentials.password);
      
      // After successful registration, automatically log in
      await authAPI.login(registerCredentials.email, registerCredentials.password);
      
      // Get user profile after successful login
      const profileResponse = await authAPI.getProfile();
      const userProfile = profileResponse.data;
      
      // Map backend role to frontend role
      const roleMapping = {
        'ADMIN': 'admin',
        'STUDENT': 'member', // Student role loads MemberPortal
        'LECTURER': 'lecturer',
        'LEADER': 'leader',   // Leader role loads LeaderPortal
        'ACADEMIC': 'academic' // Academic role loads AcademicAffairsPortal
      };
      
      const mappedRole = roleMapping[userProfile.role] || 'member';
      
      const authenticatedUser = {
        id: userProfile.id,
        email: userProfile.email,
        name: userProfile.fullName || userProfile.email,
        role: mappedRole,
        avatarUrl: userProfile.avatarUrl,
        phone: userProfile.phone,
        studentCode: userProfile.studentCode
      };
      
      onLogin(authenticatedUser);
      
      // Navigate to appropriate portal based on role
      switch (authenticatedUser.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'leader':
          navigate('/leader');
          break;
        case 'lecturer':
          navigate('/lecturer');
          break;
        case 'member':
          navigate('/member'); // Student role loads MemberPortal
          break;
        case 'academic':
          navigate('/academic'); // Academic role loads AcademicAffairsPortal
          break;
        default:
          break;
      }
    } catch (error) {
      setError('Registration failed: ' + error.message);
    }
  };

  const handleBackToLogin = () => {
    setShowRegisterForm(false);
    setLoginCredentials({ email: '', password: '' });
    setRegisterCredentials({ email: '', password: '' });
    setError('');
  };

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 2
    }}>
      <Container maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Card sx={{ 
            borderRadius: 4, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" component="h1" gutterBottom sx={{ 
                  fontWeight: 'bold',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  IoT Kit Rental System
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Welcome to the IoT Kit Rental Management System
                </Typography>
              </Box>

              {!showRegisterForm ? (
                <Box>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      Login
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Enter your credentials to access the IoT Kit Rental System
                    </Typography>
                  </Box>
                  
                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                  
                  <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                    <TextField
                      fullWidth
                      label="Email"
                      value={loginCredentials.email}
                      onChange={(e) => setLoginCredentials({...loginCredentials, email: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={loginCredentials.password}
                      onChange={(e) => setLoginCredentials({...loginCredentials, password: e.target.value})}
                      sx={{ mb: 3 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleLogin}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: 2,
                          fontWeight: 'bold',
                          py: 1.5,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          }
                        }}
                      >
                        Login
                      </Button>
                      <Button
                        variant="text"
                        fullWidth
                        onClick={() => setShowRegisterForm(true)}
                        sx={{ borderRadius: 2 }}
                      >
                        New User? Register Here
                      </Button>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
                      Register New Account
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Create a new student account to access the IoT Kit Rental System
                    </Typography>
                  </Box>
                  
                  {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                  
                  <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={registerCredentials.email}
                      onChange={(e) => setRegisterCredentials({...registerCredentials, email: e.target.value})}
                      sx={{ mb: 2 }}
                    />
                    <TextField
                      fullWidth
                      label="Password"
                      type="password"
                      value={registerCredentials.password}
                      onChange={(e) => setRegisterCredentials({...registerCredentials, password: e.target.value})}
                      sx={{ mb: 3 }}
                    />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleRegister}
                        sx={{
                          background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
                          borderRadius: 2,
                          fontWeight: 'bold',
                          py: 1.5,
                          '&:hover': {
                            background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                          }
                        }}
                      >
                        Register
                      </Button>
                      <Button
                        variant="text"
                        fullWidth
                        onClick={handleBackToLogin}
                        sx={{ borderRadius: 2 }}
                      >
                        Back to Login
                      </Button>
                    </Box>
                  </Box>
              </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </Box>
  );
}

// LecturerPortal component moved to separate file: src/LecturerPortal.js
// MemberPortal component moved to separate file: src/MemberPortal.js

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/" element={<Home onLogin={handleLogin} user={user} />} />
      <Route path="/admin" element={<AdminPortal user={user} onLogout={handleLogout} />} />
      <Route path="/leader" element={<LeaderPortal user={user} onLogout={handleLogout} />} />
      <Route path="/lecturer" element={<LecturerPortal user={user} onLogout={handleLogout} />} />
      <Route path="/member" element={<MemberPortal user={user} onLogout={handleLogout} />} />
      <Route path="/academic" element={<AcademicAffairsPortal user={user} onLogout={handleLogout} />} />
      <Route path="/rental-request" element={<RentalRequestPage user={user} onLogout={handleLogout} />} />
      <Route path="/admin/rental-approval" element={<AdminRentalApprovalPage user={user} onLogout={handleLogout} />} />
      <Route path="/admin/refund-approval" element={<AdminRefundApprovalPage user={user} onLogout={handleLogout} />} />
      <Route path="/top-up" element={<TopUpPage user={user} onLogout={handleLogout} />} />
      <Route path="/penalty-payment" element={<PenaltyPaymentPage user={user} onLogout={handleLogout} />} />
      <Route path="/qr-info" element={<QRInfoPage user={user} onLogout={handleLogout} />} />
    </Routes>
  );
}

function AppWithRouter() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWithRouter; 