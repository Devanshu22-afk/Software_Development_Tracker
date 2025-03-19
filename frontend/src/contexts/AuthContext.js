import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

// Configure axios to point to the backend API
axios.defaults.baseURL = 'http://localhost:5003';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Check for existing session
    const checkAuth = async () => {
      setIsLoading(true);
      try {
        // Check if there's user data in localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsAuthenticated(true);
          initializeSocket(parsedUser.id);
        } else {
          try {
            const response = await axios.get('/api/auth/check');
            setUser(response.data);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(response.data));
            initializeSocket(response.data.id);
          } catch (error) {
            console.error('Auth check failed:', error);
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const initializeSocket = (userId) => {
    const newSocket = io('http://localhost:5003', {
      query: { userId }
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('new_project', (project) => {
      // Handle new project notification
      console.log('New project:', project);
    });

    newSocket.on('project_updated', (project) => {
      // Handle project update notification
      console.log('Project updated:', project);
    });

    setSocket(newSocket);

    return () => newSocket.close();
  };

  const login = async (employeeId, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        employee_id: employeeId,
        password
      });
      setUser(response.data);
      setIsAuthenticated(true);
      localStorage.setItem('user', JSON.stringify(response.data));
      initializeSocket(response.data.id);
      return response.data;
    } catch (error) {
      throw error.response?.data || new Error('Login failed');
    }
  };

  const signup = async (userData) => {
    try {
      console.log('Making signup request to:', axios.defaults.baseURL + '/api/auth/signup');
      console.log('With data:', userData);
      
      const response = await axios.post('/api/auth/signup', userData);
      console.log('Signup response:', response);
      return response.data;
    } catch (error) {
      console.error('Signup error full details:', error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
        
        if (error.response.data && error.response.data.error) {
          throw new Error(error.response.data.error);
        } else {
          throw new Error(`Server error: ${error.response.status}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
        throw new Error(`Request error: ${error.message}`);
      }
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    socket,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};