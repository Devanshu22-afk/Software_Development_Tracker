import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Badge,
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  AppBar,
  Toolbar,
  Link
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import StarIcon from '@mui/icons-material/Star';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openNotificationDialog, setOpenNotificationDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [notificationAlert, setNotificationAlert] = useState(false);
  const [newNotification, setNewNotification] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Define callback functions before useEffect
  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get(`/api/projects?employee_id=${user?.id}`);
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to fetch projects');
    }
  }, [user]);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await axios.get(`/api/notifications?employee_id=${user?.id}`);
      const newNotifications = response.data;
      
      // Check if we have new notifications
      if (newNotifications.length > notifications.length) {
        setNotificationAlert(true);
        setNewNotification(newNotifications[0]);
      }
      
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user, notifications.length]);

  useEffect(() => {
    if (user) {
      // Initial fetch
      fetchProjects();
      fetchNotifications();

      // Poll for new notifications and projects every 10 seconds
      const notificationInterval = setInterval(() => {
        fetchNotifications();
        fetchProjects(); // Also refresh projects regularly
      }, 5000); // Reduced to 5 seconds for more responsive updates

      return () => clearInterval(notificationInterval);
    }
  }, [user, fetchProjects, fetchNotifications]);

  const handleUpdateStatus = async (projectId, status) => {
    try {
      await axios.put(`/api/projects/${projectId}`, { status });
      fetchProjects();
      setSuccess('Project status updated successfully');
      setOpenProjectDialog(false);
    } catch (error) {
      console.error('Error updating project status:', error);
      setError('Failed to update project status');
    }
  };

  const handleOpenProjectDialog = (project) => {
    setSelectedProject(project);
    setOpenProjectDialog(true);
  };

  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false);
    setSelectedProject(null);
  };

  const handleOpenNotificationDialog = () => {
    setOpenNotificationDialog(true);
    setNotificationAlert(false);
  };

  const handleCloseNotificationDialog = () => {
    setOpenNotificationDialog(false);
  };

  const handleNotificationResponse = async (notificationId, response) => {
    try {
      // Clear previous success/error messages
      setError('');
      setSuccess('');
      
      const result = await axios.put(`/api/notifications/${notificationId}/respond`, { response });
      
      // Don't remove the notification immediately after accepting
      // Only update the status in the UI
      setNotifications(prevNotifications => 
        prevNotifications.map(n => 
          n.id === notificationId 
            ? {...n, status: response} 
            : n
        )
      );
      
      if (response === 'accept') {
        setSuccess('Project accepted. It will be assigned based on employee ratings.');
      } else {
        // If rejected, we can remove from the list
        setNotifications(prevNotifications => 
          prevNotifications.filter(n => n.id !== notificationId)
        );
        setSuccess('Project rejected successfully.');
      }
      
      // Refresh projects in case it was assigned to this employee
      fetchProjects();
      
    } catch (error) {
      console.error('Error responding to notification:', error);
      setError(`Failed to respond to the notification: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCloseAlert = () => {
    setNotificationAlert(false);
    setNewNotification(null);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setError('');
    setSuccess('');
    
    try {
      await Promise.all([fetchProjects(), fetchNotifications()]);
      setSuccess('Data refreshed successfully');
    } catch (error) {
      setError('Failed to refresh data');
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenHelpDialog = () => {
    setOpenHelpDialog(true);
  };

  const handleCloseHelpDialog = () => {
    setOpenHelpDialog(false);
  };

  const handleOpenProfileDialog = () => {
    setOpenProfileDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setOpenProfileDialog(false);
  };

  // Function to get the status icon
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircleIcon fontSize="small" />;
      case 'in_progress':
        return <ScheduleIcon fontSize="small" />;
      case 'blocked':
        return <ErrorIcon fontSize="small" />;
      default:
        return <ScheduleIcon fontSize="small" />;
    }
  };

  // Function to get color based on priority
  const getPriorityColor = (priority) => {
    switch(parseInt(priority)) {
      case 5: return '#f44336'; // High priority - red
      case 4: return '#ff9800'; // Orange
      case 3: return '#ffeb3b'; // Yellow
      case 2: return '#4caf50'; // Green
      default: return '#2196f3'; // Blue
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* App Bar */}
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Employee Dashboard</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh Data">
            <IconButton 
              color="inherit" 
              onClick={handleManualRefresh} 
              sx={{ mx: 1 }}
              disabled={isRefreshing}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleOpenNotificationDialog}>
              <Badge badgeContent={notifications.length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Tooltip title="Help">
            <IconButton color="inherit" onClick={handleOpenHelpDialog} sx={{ ml: 1 }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Profile">
            <IconButton color="inherit" onClick={handleOpenProfileDialog} sx={{ ml: 1 }}>
              <AccountCircleIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 1 }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                justifyContent: 'space-between',
                bgcolor: 'white',
                borderRadius: 2,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
              className="fade-in"
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                <Avatar 
                  sx={{ 
                    width: 56, 
                    height: 56, 
                    bgcolor: 'primary.main',
                    mr: 2
                  }}
                >
                  {user?.name?.charAt(0) || 'E'}
                </Avatar>
                <Box>
                  <Typography variant="h5" component="div">
                    Welcome, {user?.name || 'Employee'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                    <StarIcon sx={{ fontSize: 18, color: 'warning.main', mr: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">
                      Rating: {user?.rating || '4.5'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  icon={<BusinessCenterIcon />} 
                  label={`${projects.length} Active Projects`} 
                  color="primary" 
                  variant="outlined"
                />
              </Box>
            </Paper>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            </Grid>
          )}

          {success && (
            <Grid item xs={12}>
              <Alert severity="success" sx={{ borderRadius: 2 }}>{success}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Paper 
              sx={{ borderRadius: 2, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }} 
              elevation={0}
            >
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">My Projects</Typography>
              </Box>
              <Divider />
              {projects.length > 0 ? (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell align="center">Priority</TableCell>
                        <TableCell align="center">Status</TableCell>
                        <TableCell>Deadline</TableCell>
                        <TableCell align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id} hover>
                          <TableCell sx={{ fontWeight: 'medium' }}>{project.title}</TableCell>
                          <TableCell>{project.description}</TableCell>
                          <TableCell align="center">
                            <Box 
                              sx={{ 
                                width: 30, 
                                height: 30, 
                                borderRadius: '50%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                bgcolor: getPriorityColor(project.priority),
                                color: 'white',
                                fontWeight: 'bold',
                                mx: 'auto'
                              }}
                            >
                              {project.priority}
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              icon={getStatusIcon(project.status)}
                              label={project.status.replace('_', ' ')} 
                              color={
                                project.status === 'completed' ? 'success' : 
                                project.status === 'in_progress' ? 'primary' : 
                                project.status === 'blocked' ? 'error' : 'default'
                              }
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {project.deadline ? 
                              new Date(project.deadline).toLocaleString() : 
                              'No deadline'
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOpenProjectDialog(project)}
                              color={project.status === 'blocked' ? 'warning' : 'primary'}
                              sx={{ borderRadius: 2 }}
                            >
                              Update
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary">
                    No projects assigned yet
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Project Status Dialog */}
      <Dialog 
        open={openProjectDialog} 
        onClose={handleCloseProjectDialog}
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Update Project Status
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedProject && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="h6" gutterBottom>
                {selectedProject.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedProject.description}
              </Typography>
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" fontWeight="medium">
                  Current Status:
                </Typography>
                <Chip 
                  icon={getStatusIcon(selectedProject.status)}
                  label={selectedProject.status.replace('_', ' ')} 
                  color={
                    selectedProject.status === 'completed' ? 'success' : 
                    selectedProject.status === 'in_progress' ? 'primary' : 
                    selectedProject.status === 'blocked' ? 'error' : 'default'
                  }
                  variant="outlined"
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleCloseProjectDialog}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleUpdateStatus(selectedProject?.id, 'completed')}
            variant="contained"
            color="success"
            disabled={selectedProject?.status === 'completed'}
            sx={{ ml: 1 }}
          >
            Mark as Completed
          </Button>
          <Button
            onClick={() => handleUpdateStatus(selectedProject?.id, 'blocked')}
            variant="contained"
            color="error"
            disabled={selectedProject?.status === 'blocked'}
            sx={{ ml: 1 }}
          >
            Mark as Blocked
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Notifications Dialog */}
      <Dialog 
        open={openNotificationDialog} 
        onClose={handleCloseNotificationDialog} 
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Notifications
        </DialogTitle>
        <DialogContent>
          {notifications.length > 0 ? (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {notifications.map((notification) => (
                  <Grid item xs={12} key={notification.id}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        borderRadius: 2,
                        borderColor: notification.status === 'accept' ? 'success.main' : 'grey.300',
                        bgcolor: notification.status === 'accept' ? 'success.50' : 'white'
                      }}
                    >
                      <CardContent>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={8}>
                            <Typography variant="h6" component="div">
                              {notification.project_title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {notification.project_description}
                            </Typography>
                            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                              <PriorityHighIcon 
                                fontSize="small" 
                                sx={{ color: getPriorityColor(notification.project_priority), mr: 0.5 }} 
                              />
                              <Typography variant="body2" color="text.secondary">
                                Priority: {notification.project_priority}
                              </Typography>
                              <Chip 
                                label={notification.status} 
                                color={notification.status === 'accept' ? 'success' : 'default'}
                                size="small"
                                sx={{ ml: 2 }}
                              />
                            </Box>
                          </Grid>
                          <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                            {notification.status === 'pending' ? (
                              <Box>
                                <Button
                                  variant="contained"
                                  color="success"
                                  size="small"
                                  onClick={() => handleNotificationResponse(notification.id, 'accept')}
                                  sx={{ mr: 1, borderRadius: 2 }}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="contained"
                                  color="error"
                                  size="small"
                                  onClick={() => handleNotificationResponse(notification.id, 'reject')}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Reject
                                </Button>
                              </Box>
                            ) : notification.status === 'accept' ? (
                              <Typography variant="body2" color="text.secondary">
                                You've accepted this task. Waiting for assignment.
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No action needed
                              </Typography>
                            )}
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No new notifications
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseNotificationDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* New Notification Alert */}
      <Snackbar
        open={notificationAlert}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        message={newNotification ? `New project available: ${newNotification.project_title}` : "New notification"}
        action={
          <Button color="secondary" size="small" onClick={handleOpenNotificationDialog}>
            VIEW
          </Button>
        }
        sx={{ borderRadius: 2 }}
      />

      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onClose={handleCloseHelpDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Help & Support</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>How to use the dashboard</Typography>
          <Typography paragraph>
            <strong>View Projects:</strong> All your assigned projects are listed in the My Projects section.
          </Typography>
          <Typography paragraph>
            <strong>Update Status:</strong> Click on any project to update its status to "in progress", "blocked", or "completed".
          </Typography>
          <Typography paragraph>
            <strong>Notifications:</strong> The bell icon shows new project assignments and important updates.
          </Typography>
          <Typography paragraph>
            <strong>Refresh Data:</strong> Use the refresh button in the top bar to get the latest updates.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Need more help?</Typography>
          <Typography>
            Contact the IT support team at <Link href="mailto:support@company.com">support@company.com</Link> or call extension 1234.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={openProfileDialog} onClose={handleCloseProfileDialog} maxWidth="sm" fullWidth>
        <DialogTitle>User Profile</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mr: 2 }}>
              {user?.name?.charAt(0) || 'E'}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.name || 'Employee'}</Typography>
              <Typography variant="body2" color="text.secondary">
                Employee ID: {user?.employee_id || 'N/A'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                <StarIcon sx={{ fontSize: 18, color: 'warning.main', mr: 0.5 }} />
                <Typography variant="body2">
                  Rating: {user?.rating || '4.5'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>Account Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Email</Typography>
              <Typography variant="body1">{user?.email || 'example@company.com'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Department</Typography>
              <Typography variant="body1">{user?.department || 'Development'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Role</Typography>
              <Typography variant="body1">{user?.role || 'Software Developer'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Joined</Typography>
              <Typography variant="body1">{user?.join_date || 'January 2023'}</Typography>
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button variant="outlined" color="primary" sx={{ mr: 1 }}>
              Change Password
            </Button>
            <Button variant="outlined">
              Edit Profile
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProfileDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeDashboard; 