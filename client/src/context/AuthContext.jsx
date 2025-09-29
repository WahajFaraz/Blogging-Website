import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../lib/config";
import { createApiUrl } from "../lib/urlUtils";
import api from "../lib/api";

const AuthContext = createContext(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const userData = await fetchUserProfile(token);
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };
    
    loadUser();
  }, [token]);

  const fetchUserProfile = async (token) => {
    if (!token) return null;
    
    try {
      const user = await api.getCurrentUser(token);
      return user;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        localStorage.removeItem('token');
      }
      throw error;
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.login({ email, password });
      const { token, user } = response.data || response;
      
      if (!token) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', token);
      
      if (!user) {
        const userData = await fetchUserProfile(token);
        setUser(userData);
      } else {
        setUser(user);
      }
      
      setToken(token);
      setError(null);
      return user || response.user;
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const isFormData = userData instanceof FormData;
      
      if (isFormData) {
        const formDataObj = {};
        userData.forEach((value, key) => {
          formDataObj[key] = value;
        });
        await api.register(formDataObj);
      } else {
        await api.register(userData);
      }
      
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please log in to continue.' 
        } 
      });
      
      return { success: true };
    } catch (error) {
      let errorMessage = 'Signup failed';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data) {
        const { data } = error.response;
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(err => err.msg || err.error).join(', ');
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Network error. Please try again.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      try {
        await api.logout(token);
      } catch (error) {
      }
      
      setUser(null);
      setToken(null);
      setError(null);
      localStorage.removeItem('token');
      navigate('/');
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      navigate('/');
    }
  };
  
  const clearError = () => {
    setError(null);
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const isFormData = updates instanceof FormData;
      let response;
      
      if (isFormData) {
        response = await fetch(createApiUrl('users/profile'), {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          },
          body: updates
        });
      } else {
        response = await api.updateProfile(updates, token);
        setUser(response.user || response);
        setError(null);
        return { success: true };
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Profile update failed';
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map(err => err.msg || err.error).join(', ');
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setUser(data.user || data);
      setError(null);
      return { success: true };
    } catch (error) {
      const errorMessage = error.message.includes('Failed to fetch')
        ? 'Network error. Please check your connection.'
        : error.message || 'Profile update failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = !!user && !!token;

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    signup,
    logout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};