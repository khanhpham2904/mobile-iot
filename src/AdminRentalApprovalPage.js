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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Divider
} from '@mui/material';
import { borrowingRequestAPI, notificationAPI } from './api';

function AdminRentalApprovalPage() {
  const [rentalRequests, setRentalRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchRentalRequests();
  }, []);

  const fetchRentalRequests = async () => {
    try {
      console.log('Fetching rental requests...');
      console.log('Auth token:', localStorage.getItem('authToken'));
      const data = await borrowingRequestAPI.getAll();
      console.log('Fetched rental requests:', data);
      setRentalRequests(data || []);
    } catch (error) {
      console.error('Error fetching rental requests:', error);
      console.error('Error details:', error.message);
      setMessage('Error fetching rental requests: ' + error.message);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const request = rentalRequests.find(req => req.id === requestId);
      // Update the borrowing request status to approved
      await borrowingRequestAPI.update(requestId, { status: 'APPROVED' });
      setMessage('Rental request approved successfully!');
      fetchRentalRequests();
      // Send notification to user
      if (request?.requestedBy?.id) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_SUCCESS',
              title: 'Yêu cầu thuê kit được chấp nhận',
              message: `Yêu cầu thuê kit ${request?.kit?.kitName || ''} của bạn đã được admin phê duyệt.`,
              userId: request.requestedBy.id
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending approval notification:', notifyError);
        }
      }
    } catch (error) {
      setMessage(error.message || 'Error approving request');
    }
  };

  const handleReject = async (requestId, reason) => {
    try {
      const request = rentalRequests.find(req => req.id === requestId);
      // Update the borrowing request status to rejected
      await borrowingRequestAPI.update(requestId, { status: 'REJECTED', reason: reason });
      setMessage('Rental request rejected successfully!');
      fetchRentalRequests();
      // Send notification to user
      if (request?.requestedBy?.id) {
        try {
          await notificationAPI.createNotifications([
            {
              subType: 'RENTAL_REJECTED',
              title: 'Yêu cầu thuê kit bị từ chối',
              message: `Yêu cầu thuê kit ${request?.kit?.kitName || ''} của bạn đã bị admin từ chối.`,
              userId: request.requestedBy.id
            }
          ]);
        } catch (notifyError) {
          console.error('Error sending rejection notification:', notifyError);
        }
      }
    } catch (error) {
      setMessage(error.message || 'Error rejecting request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      case 'BORROWED': return 'info';
      case 'RETURNED': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Rental Request Management</Typography>
      
      {message && (
        <Alert sx={{ mb: 2, width: '100%', maxWidth: 1200 }} severity="info">
          {message}
        </Alert>
      )}

      <Card sx={{ maxWidth: 1200, width: '100%' }}>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Kit</TableCell>
                  <TableCell>Request Type</TableCell>
                  <TableCell>Deposit Amount</TableCell>
                  <TableCell>Expected Return Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rentalRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>#{request.id.substring(0, 8)}...</TableCell>
                    <TableCell>
                      <Typography variant="body2">{request.requestedBy?.fullName || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {request.requestedBy?.email || 'N/A'}
                      </Typography>
                    </TableCell>
                    <TableCell>{request.kit?.kitName || 'N/A'}</TableCell>
                    <TableCell>{request.requestType || 'N/A'}</TableCell>
                    <TableCell>{request.depositAmount ? request.depositAmount.toLocaleString() : '0'} VND</TableCell>
                    <TableCell>{request.expectReturnDate ? formatDate(request.expectReturnDate) : 'N/A'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.status || 'PENDING'} 
                        color={getStatusColor(request.status)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedRequest(request);
                            setDetailDialog(true);
                          }}
                        >
                          View
                        </Button>
                        {request.status === 'PENDING' && (
                          <>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleApprove(request.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleReject(request.id, 'Request rejected by admin')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog} onClose={() => setDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Rental Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>User Information</Typography>
                  <Typography><strong>Name:</strong> {selectedRequest.requestedBy?.fullName || 'N/A'}</Typography>
                  <Typography><strong>Email:</strong> {selectedRequest.requestedBy?.email || 'N/A'}</Typography>
                  <Typography><strong>Phone:</strong> {selectedRequest.requestedBy?.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>Kit Information</Typography>
                  <Typography><strong>Kit Name:</strong> {selectedRequest.kit?.kitName || 'N/A'}</Typography>
                  <Typography><strong>Kit Type:</strong> {selectedRequest.kit?.type || 'N/A'}</Typography>
                  <Typography><strong>Kit Amount:</strong> {selectedRequest.kit?.amount ? selectedRequest.kit.amount.toLocaleString() : '0'} VND</Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>Request Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography><strong>Reason:</strong></Typography>
                  <Typography variant="body2" sx={{ pl: 2, mb: 1 }}>
                    {selectedRequest.reason || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Request Type:</strong> {selectedRequest.requestType || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Expected Return Date:</strong> {selectedRequest.expectReturnDate ? formatDate(selectedRequest.expectReturnDate) : 'N/A'}</Typography>
                </Grid>
                {selectedRequest.actualReturnDate && (
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Actual Return Date:</strong> {formatDate(selectedRequest.actualReturnDate)}</Typography>
                  </Grid>
                )}
                {selectedRequest.approvedDate && (
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Approved Date:</strong> {formatDate(selectedRequest.approvedDate)}</Typography>
                  </Grid>
                )}
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" gutterBottom>Financial Information</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Deposit Amount:</strong> {selectedRequest.depositAmount ? selectedRequest.depositAmount.toLocaleString() : '0'} VND</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Status:</strong> 
                    <Chip 
                      label={selectedRequest.status || 'PENDING'} 
                      color={getStatusColor(selectedRequest.status)} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
              </Grid>

              {selectedRequest.note && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>Additional Notes</Typography>
                  <Typography variant="body2">{selectedRequest.note}</Typography>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)}>Close</Button>
          {selectedRequest && selectedRequest.status === 'PENDING' && (
            <>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  handleApprove(selectedRequest.id);
                  setDetailDialog(false);
                }}
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  handleReject(selectedRequest.id, 'Request rejected by admin');
                  setDetailDialog(false);
                }}
              >
                Reject
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminRentalApprovalPage; 