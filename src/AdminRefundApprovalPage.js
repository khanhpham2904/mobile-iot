import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { refundAPI } from './api';

function AdminRefundApprovalPage() {
  const navigate = useNavigate();
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [approvalDialog, setApprovalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [damageAssessment, setDamageAssessment] = useState({});
  const [approvalDecision, setApprovalDecision] = useState('');

  useEffect(() => {
    fetchRefundRequests();
  }, []);

  const fetchRefundRequests = async () => {
    try {
      const data = await refundAPI.getRefundRequests();
      setRefundRequests(data.requests || []);
    } catch (error) {
      setMessage('Error fetching refund requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    try {
      await refundAPI.approveRefundRequest(selectedRequest.id, damageAssessment);
      setMessage('Refund request approved successfully!');
      fetchRefundRequests(); // Refresh the list
    } catch (error) {
      setMessage(error.message || 'Failed to approve refund request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      await refundAPI.rejectRefundRequest(selectedRequest.id, approvalDecision);
      setMessage('Refund request rejected.');
      setApprovalDialog(false);
      setSelectedRequest(null);
      setDamageAssessment({});
      setApprovalDecision('');
      fetchRefundRequests(); // Refresh the list
    } catch (error) {
      setMessage(error.message || 'Failed to reject refund request');
    }
  };

  const openApprovalDialog = (request) => {
    setSelectedRequest(request);
    setDamageAssessment({});
    setApprovalDecision('');
    setApprovalDialog(true);
  };

  const calculateRefundAmount = (request, damage) => {
    const originalAmount = request.originalAmount || 0;
    let damageFee = 0;
    
    // Calculate damage fees based on damaged components
    Object.keys(damage).forEach(componentName => {
      const component = damage[componentName];
      if (component.damaged > 0) {
        // Get component value from kit details (mock data)
        const componentValue = component.value || 50000; // Default 50k VND
        damageFee += component.damaged * componentValue;
      }
    });

    // Check if return is late
    const returnDate = new Date(request.refundDate);
    const dueDate = new Date(request.dueDate || new Date());
    const isLate = returnDate > dueDate;
    
    let latePenalty = 0;
    if (isLate) {
      const daysLate = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
      latePenalty = daysLate * 10000; // 10k VND per day late
    }

    const totalRefund = originalAmount - damageFee - latePenalty;
    return Math.max(0, totalRefund); // Don't charge more than original amount
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <Typography>Loading refund requests...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Refund Request Management</Typography>
        <Button variant="outlined" onClick={() => navigate('/admin')}>
          Back to Admin Portal
        </Button>
      </Box>

      {message && (
        <Alert sx={{ mb: 2 }} severity={message.includes('approved') || message.includes('success') ? 'success' : 'error'}>
          {message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Pending Refund Requests</Typography>
          
          {refundRequests.length === 0 ? (
            <Typography>No refund requests found.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Refund Reason</TableCell>
                    <TableCell>Requested Date</TableCell>
                    <TableCell>Original Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {refundRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.userEmail}</TableCell>
                      <TableCell>
                        <Chip label={request.userRole} color="primary" size="small" />
                      </TableCell>
                      <TableCell>{request.refundReason}</TableCell>
                      <TableCell>{new Date(request.requestDate).toLocaleDateString()}</TableCell>
                      <TableCell>{request.originalAmount?.toLocaleString()} VND</TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          color={getStatusColor(request.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => openApprovalDialog(request)}
                          >
                            Review
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={approvalDialog} onClose={() => setApprovalDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Review Refund Request</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Request Details</Typography>
                  <Typography><strong>User:</strong> {selectedRequest.userEmail}</Typography>
                  <Typography><strong>Role:</strong> {selectedRequest.userRole}</Typography>
                  <Typography><strong>Reason:</strong> {selectedRequest.refundReason}</Typography>
                  <Typography><strong>Requested Date:</strong> {new Date(selectedRequest.requestDate).toLocaleDateString()}</Typography>
                  <Typography><strong>Original Amount:</strong> {selectedRequest.originalAmount?.toLocaleString()} VND</Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Damage Assessment</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Assess any damaged components and their quantities
                  </Typography>
                  
                  {/* Mock kit components for damage assessment */}
                  {['Arduino Board', 'Sensors', 'Cables', 'Battery'].map((component) => (
                    <Box key={component} sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">{component}</Typography>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          label="Damaged Qty"
                          type="number"
                          value={damageAssessment[component]?.damaged || 0}
                          onChange={(e) => setDamageAssessment(prev => ({
                            ...prev,
                            [component]: {
                              ...prev[component],
                              damaged: parseInt(e.target.value) || 0,
                              value: 50000 // Mock component value
                            }
                          }))}
                          sx={{ width: 120 }}
                        />
                        <TextField
                          size="small"
                          label="Value (VND)"
                          value={damageAssessment[component]?.value || 50000}
                          onChange={(e) => setDamageAssessment(prev => ({
                            ...prev,
                            [component]: {
                              ...prev[component],
                              value: parseInt(e.target.value) || 0
                            }
                          }))}
                          sx={{ width: 120 }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="h6" gutterBottom>Refund Calculation</Typography>
                <Typography><strong>Original Amount:</strong> {selectedRequest.originalAmount?.toLocaleString()} VND</Typography>
                <Typography><strong>Damage Fee:</strong> {Object.values(damageAssessment).reduce((sum, comp) => sum + (comp.damaged * comp.value), 0).toLocaleString()} VND</Typography>
                <Typography><strong>Late Penalty:</strong> 0 VND</Typography>
                <Typography variant="h6" color="primary">
                  <strong>Total Refund:</strong> {calculateRefundAmount(selectedRequest, damageAssessment).toLocaleString()} VND
                </Typography>
              </Box>

            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleReject} 
            color="error" 
            variant="outlined"
          >
            Reject
          </Button>
          <Button 
            onClick={handleApprove} 
            color="success" 
            variant="contained"
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminRefundApprovalPage; 