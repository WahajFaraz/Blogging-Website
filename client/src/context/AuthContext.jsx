import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { config } from "../lib/config";
import { createApiUrl } from "../lib/urlUtils";
const { api } = config;

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
    if (token) {
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const clearError = () => {
    setError(null);
  };

  const fetchUserProfile = async () => {
    if (!token) {
      console.log('No token available for profile fetch');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching user profile with token:', token.substring(0, 10) + '...');
      
      const response = await fetch(`${api.baseUrl}/api/${api.version}/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include'
      });

      console.log('Profile response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile fetch error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        
        if (response.status === 401) {
          console.log('Unauthorized - logging out');
          logout();
          return;
        }
        
        let errorMessage = 'Failed to fetch profile';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const userData = await response.json();
      console.log('Profile data received:', userData);
      setUser(userData);
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Network error while fetching profile');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${api.baseUrl}/api/${api.version}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
        mode: 'cors'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const { token: authToken, user } = data;
      
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setUser(user);
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.message.includes('Failed to fetch') 
        ? 'Network error. Please check your connection.' 
        : error.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const isFormData = userData instanceof FormData;
      
      const response = await fetch(`${api.baseUrl}/api/${api.version}/users/signup`, {
        method: 'POST',
        headers: isFormData ? {} : {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: isFormData ? userData : JSON.stringify(userData)
      });

      const data = await response.json();

      if (response.ok) {
        setError(null);
        navigate('/login', { 
          state: { 
            message: 'Account created successfully! Please log in to continue.' 
          } 
        });
        return { success: true };
      } else {
        let errorMessage = 'Signup failed';
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.map(err => err.msg || err.error).join(', ');
        } else if (data.error) {
          errorMessage = data.error;
        } else if (data.message) {
          errorMessage = data.message;
        }
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const currentToken = token || localStorage.getItem('token');
      
      try {
        // Call server-side logout with the full path
        const response = await fetch(`${api.baseUrl}/api/${api.version}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Authorization': currentToken ? `Bearer ${currentToken}` : '',
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error('Logout failed:', errorText);
        }
      } catch (error) {
        console.error('Error during logout request:', error);
        // Continue with local logout even if server logout fails
      } finally {
        // Clear local state
        setUser(null);
        setToken(null);
        setError(null);
        localStorage.removeItem('token');
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      // Ensure we still clear local state and navigate
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      navigate('/');
    }
  };

  const updateProfile = async (updates) => {
    try {
      setLoading(true);
      setError(null);
      
      const isFormData = updates instanceof FormData;
      
      const response = await fetch(createApiUrl('users/profile'), {
        method: 'PUT',
        headers: isFormData ? {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        } : {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include',
        body: isFormData ? updates : JSON.stringify(updates)
      });

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
      setUser(data.user || data); // Handle both formats: { user } or direct user object
      setError(null);
      return { success: true };
    } catch (error) {
      console.error('Profile update error:', error);
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