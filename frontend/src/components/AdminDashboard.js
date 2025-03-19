import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  Avatar,
  Chip,
  Divider,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ErrorIcon from '@mui/icons-material/Error';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';

const AdminDashboard = () => {
  const { socket, logout, user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [openEmployeeDialog, setOpenEmployeeDialog] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedEmployeeToDelete, setSelectedEmployeeToDelete] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '1',
    deadline: ''
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [openRatingDialog, setOpenRatingDialog] = useState(false);
  const [newRating, setNewRating] = useState(5);

  useEffect(() => {
    fetchProjects();
    fetchEmployees();

    if (socket) {
      socket.on('project_updated', (project) => {
        setProjects(prevProjects =>
          prevProjects.map(p => p.id === project.id ? project : p)
        );
      });
    }

    return () => {
      if (socket) {
        socket.off('project_updated');
      }
    };
  }, [socket]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      setError('Failed to fetch projects');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/api/employees');
      setEmployees(response.data);
    } catch (error) {
      setError('Failed to fetch employees');
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    setError('');
    setSuccess('');
    
    try {
      await Promise.all([fetchProjects(), fetchEmployees()]);
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

  const handleOpenSettingsDialog = () => {
    setOpenSettingsDialog(true);
  };

  const handleCloseSettingsDialog = () => {
    setOpenSettingsDialog(false);
  };

  const handleOpenProjectDialog = () => {
    setOpenProjectDialog(true);
  };

  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false);
    setFormData({
      title: '',
      description: '',
      priority: '1',
      deadline: ''
    });
  };

  const handleOpenEmployeeDialog = () => {
    setOpenEmployeeDialog(true);
  };

  const handleCloseEmployeeDialog = () => {
    setOpenEmployeeDialog(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      // Make a copy of the form data to ensure proper formatting
      const projectData = {
        ...formData,
        priority: parseInt(formData.priority, 10)
      };
      
      await axios.post('/api/projects', projectData);
      
      fetchProjects();
      handleCloseProjectDialog();
      setSuccess('Project created successfully');
    } catch (error) {
      console.error('Project creation error:', error);
      setError('Failed to create project: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateProjectStatus = async (projectId, status) => {
    try {
      await axios.put(`/api/projects/${projectId}`, { status });
      fetchProjects();
      setSuccess('Project status updated successfully');
    } catch (error) {
      setError('Failed to update project status');
    }
  };

  const handleOpenRatingDialog = (employee) => {
    setSelectedEmployee(employee);
    setNewRating(employee.rating || 5);
    setOpenRatingDialog(true);
  };

  const handleCloseRatingDialog = () => {
    setOpenRatingDialog(false);
    setSelectedEmployee(null);
  };

  const handleRatingChange = (e) => {
    setNewRating(e.target.value);
  };

  const handleSaveRating = async () => {
    try {
      if (!selectedEmployee) return;
      
      await axios.put(`/api/employees/${selectedEmployee.id}/rating`, { 
        rating: parseFloat(newRating) 
      });
      
      setEmployees(employees.map(emp => 
        emp.id === selectedEmployee.id 
          ? {...emp, rating: parseFloat(newRating)} 
          : emp
      ));
      
      setSuccess(`Rating updated for ${selectedEmployee.name}`);
      handleCloseRatingDialog();
    } catch (error) {
      console.error('Error updating rating:', error);
      setError('Failed to update employee rating');
    }
  };

  const handleFinalizeAssignment = async (projectId) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.post(`/api/projects/${projectId}/finalize-assignment`);
      
      fetchProjects();
      setSuccess(`Project successfully assigned to ${response.data.employee.name} (Rating: ${response.data.employee.rating})`);
    } catch (error) {
      console.error("Error finalizing assignment:", error);
      setError(error.response?.data?.error || "Failed to finalize assignment");
    }
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

  // Function to get color based on rating
  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'success.main';
    if (rating >= 3.5) return 'primary.main';
    if (rating >= 2.5) return 'warning.main';
    return 'error.main';
  };

  const handleOpenDeleteDialog = (employee) => {
    setSelectedEmployeeToDelete(employee);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedEmployeeToDelete(null);
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployeeToDelete) return;

    try {
      setError('');
      setSuccess('');
      
      await axios.delete(`/api/employees/${selectedEmployeeToDelete.id}`);
      
      // Update local state to remove the deleted employee
      setEmployees(employees.filter(emp => emp.id !== selectedEmployeeToDelete.id));
      
      setSuccess(`Employee "${selectedEmployeeToDelete.name}" has been removed successfully.`);
      handleCloseDeleteDialog();
    } catch (error) {
      console.error('Error deleting employee:', error);
      setError(error.response?.data?.error || 'Failed to delete employee');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* App Bar */}
      <AppBar position="static" color="primary" elevation={0}>
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AdminPanelSettingsIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Admin Dashboard</Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />
          <Tooltip title="Refresh Data">
            <IconButton 
              color="inherit" 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              sx={{ ml: 1 }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Help">
            <IconButton color="inherit" onClick={handleOpenHelpDialog} sx={{ ml: 1 }}>
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Settings">
            <IconButton color="inherit" onClick={handleOpenSettingsDialog} sx={{ ml: 1 }}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={() => { logout(); navigate('/login'); }} sx={{ ml: 1 }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                mb: 2
              }}
            >
              <Typography variant="h4" component="h1" sx={{ mb: { xs: 2, sm: 0 } }}>
                Admin Control Panel
              </Typography>
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenProjectDialog}
                  startIcon={<AddIcon />}
                  sx={{ mr: 2, borderRadius: 2 }}
                >
                  Create Project
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleOpenProjectDialog}
                  startIcon={<AddIcon />}
                  sx={{ mr: 2, borderRadius: 2 }}
                >
                  Create Task
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleOpenEmployeeDialog}
                  startIcon={<GroupIcon />}
                  sx={{ borderRadius: 2 }}
                >
                  Manage Employees
                </Button>
              </Box>
            </Box>
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
            <Card 
              sx={{ 
                borderRadius: 2, 
                mb: 4,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
              className="fade-in"
            >
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon sx={{ mr: 1 }} /> Projects Overview
                </Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="center">Priority</TableCell>
                      <TableCell align="center">Status</TableCell>
                      <TableCell>Assigned To</TableCell>
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
                          {employees.find(e => e.id === project.employee_id)?.name || 
                            <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                          }
                        </TableCell>
                        <TableCell align="center">
                          {project.status === 'pending' ? (
                            <>
                              <Button
                                size="small"
                                variant="contained"
                                color="primary"
                                onClick={() => handleFinalizeAssignment(project.id)}
                                sx={{ mr: 1, borderRadius: 2 }}
                              >
                                Finalize Assignment
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => handleUpdateProjectStatus(project.id, 'completed')}
                                disabled={true}
                                sx={{ borderRadius: 2 }}
                              >
                                Complete
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleUpdateProjectStatus(project.id, 'completed')}
                              disabled={project.status === 'completed'}
                              sx={{ borderRadius: 2 }}
                            >
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Card 
              sx={{ 
                borderRadius: 2,
                mb: 4,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
              className="fade-in"
            >
              <Box sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <GroupIcon sx={{ mr: 1 }} /> Employees
                </Typography>
              </Box>
              <Divider />
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {employees.map((employee) => (
                    <Grid item xs={12} sm={6} md={4} key={employee.id}>
                      <Card 
                        sx={{ 
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          position: 'relative',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 8, 
                            right: 8,
                            display: 'flex', 
                            gap: 1
                          }}
                        >
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenRatingDialog(employee)}
                            color="primary"
                          >
                            <StarIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDeleteDialog(employee)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <CardContent sx={{ flexGrow: 1, pt: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'primary.main', 
                                mr: 2,
                                width: 50,
                                height: 50
                              }}
                            >
                              {employee.name.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="h6" component="div">
                                {employee.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ID: {employee.employee_id}
                              </Typography>
                            </Box>
                          </Box>
                          <Divider sx={{ my: 1.5 }} />
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Role:</strong> {employee.role || 'Not specified'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Department:</strong> {employee.department || 'Not specified'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1.5 }}>
                            <Typography variant="body2" sx={{ mr: 1 }}>
                              <strong>Rating:</strong>
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <StarIcon 
                                sx={{ 
                                  color: getRatingColor(employee.rating || 0), 
                                  fontSize: 20, 
                                  mr: 0.5 
                                }} 
                              />
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontWeight: 'medium',
                                  color: getRatingColor(employee.rating || 0)
                                }}
                              >
                                {employee.rating || 'Not rated'}
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Create Project Dialog */}
      <Dialog 
        open={openProjectDialog} 
        onClose={handleCloseProjectDialog}
        PaperProps={{ sx: { borderRadius: 2 } }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Create New Project
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Box component="form" onSubmit={handleCreateProject} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              margin="normal"
              required
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              variant="outlined"
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Priority"
                  name="priority"
                  type="number"
                  value={formData.priority}
                  onChange={handleChange}
                  margin="normal"
                  inputProps={{ min: 1, max: 5 }}
                  variant="outlined"
                  helperText="1 (Low) to 5 (High)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Deadline"
                  name="deadline"
                  type="datetime-local"
                  value={formData.deadline}
                  onChange={handleChange}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseProjectDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleCreateProject} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Employees Dialog */}
      <Dialog 
        open={openEmployeeDialog} 
        onClose={handleCloseEmployeeDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Manage Employees
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              {employees.map((employee) => (
                <Grid item xs={12} sm={6} md={4} key={employee.id}>
                  <Card 
                    sx={{ 
                      borderRadius: 2,
                      height: '100%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}
                    className="card-hover"
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: employee.is_admin ? 'secondary.main' : 'primary.main',
                            mr: 2
                          }}
                        >
                          {employee.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" component="div">
                            {employee.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {employee.role}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Employee ID: {employee.employee_id}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body2" fontWeight="medium" mr={1}>
                            Rating:
                          </Typography>
                          <Chip 
                            label={employee.rating} 
                            size="small"
                            color={
                              employee.rating >= 4.5 ? 'success' :
                              employee.rating >= 3.5 ? 'primary' :
                              employee.rating >= 2.5 ? 'warning' : 'error'
                            }
                          />
                        </Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenRatingDialog(employee)}
                          sx={{ borderRadius: 2 }}
                        >
                          Edit
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEmployeeDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rating Edit Dialog */}
      <Dialog 
        open={openRatingDialog} 
        onClose={handleCloseRatingDialog}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Update Employee Rating
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedEmployee && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    mr: 2
                  }}
                >
                  {selectedEmployee.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" gutterBottom>
                  {selectedEmployee.name}
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                label="Rating"
                type="number"
                value={newRating}
                onChange={handleRatingChange}
                margin="normal"
                inputProps={{ min: 1, max: 5, step: 0.1 }}
                helperText="Enter a rating between 1.0 and 5.0"
                variant="outlined"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseRatingDialog} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSaveRating} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={openHelpDialog} onClose={handleCloseHelpDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Admin Help & Support</DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>Admin Dashboard Features</Typography>
          <Typography paragraph>
            <strong>Create Projects:</strong> Use the "Create Project" button to add new development projects.
          </Typography>
          <Typography paragraph>
            <strong>Manage Employees:</strong> View employees, their current ratings, and update these ratings as needed.
          </Typography>
          <Typography paragraph>
            <strong>Project Status:</strong> Track the status of all projects across the organization.
          </Typography>
          <Typography paragraph>
            <strong>Refresh Data:</strong> Use the refresh button to get the latest project and employee data.
          </Typography>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Admin Support</Typography>
          <Typography>
            For system administration help, contact the IT team at <Link href="mailto:admin@company.com">admin@company.com</Link>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={openSettingsDialog} onClose={handleCloseSettingsDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Admin Settings</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: 'primary.main', mr: 2 }}>
              {user?.name?.charAt(0) || 'A'}
            </Avatar>
            <Box>
              <Typography variant="h6">{user?.name || 'Administrator'}</Typography>
              <Typography variant="body2" color="text.secondary">
                Admin ID: {user?.employee_id || 'admin123'}
              </Typography>
            </Box>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>System Settings</Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                Security Settings
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                Notification Preferences
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                User Management
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                System Configuration
              </Button>
            </Grid>
          </Grid>
          <Typography variant="h6" gutterBottom>Account</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Button variant="outlined" color="primary" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                Change Password
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" color="secondary" fullWidth sx={{ justifyContent: 'flex-start', py: 1 }}>
                Edit Profile
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSettingsDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Employee Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="delete-dialog-title">Confirm Employee Removal</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1">
              Are you sure you want to remove this employee?
            </Typography>
            {selectedEmployeeToDelete && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="body1"><strong>{selectedEmployeeToDelete.name}</strong></Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {selectedEmployeeToDelete.employee_id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: {selectedEmployeeToDelete.role || 'Not specified'}
                </Typography>
              </Box>
            )}
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              This action cannot be undone.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button 
            onClick={handleDeleteEmployee} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Remove Employee
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard; 