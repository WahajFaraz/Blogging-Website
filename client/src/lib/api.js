import { config } from './config';

// Helper to create API URL
const createApiUrl = (endpoint = '') => {
  const baseUrl = config.api.baseUrl;
  const version = config.api.version;
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  return `${baseUrl}/api/${version}/${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
};

// Helper to create blogs URL with query params
const getBlogsUrl = (params = {}) => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryString ? `${createApiUrl('blogs')}?${queryString}` : createApiUrl('blogs');
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  // Handle empty responses (like 204 No Content)
  if (response.status === 204) {
    return { success: true };
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    // If we can't parse JSON, it's probably a server error
    const errorText = await response.text();
    throw new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
  }
  
  if (!response.ok) {
    // Handle validation errors
    if (response.status === 400 && data.errors) {
      const validationError = new Error('Validation failed');
      validationError.status = 400;
      validationError.errors = data.errors;
      throw validationError;
    }
    
    // Handle other errors
    const errorMessage = data.message || 
                       (data.error && typeof data.error === 'string' ? data.error : 'Something went wrong');
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

// Helper function to create request options
const createOptions = (method, data = null, token = null) => {
  const options = {
    method,
    headers: {
      ...config.api.defaultHeaders,
    },
    credentials: 'include',
    mode: 'cors',
    timeout: config.api.timeout
  };
  
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  return options;
};

const api = {
  // Auth endpoints
  login: async (credentials) => {
    const response = await fetch(
      createApiUrl('users/login'),
      createOptions('POST', credentials)
    );
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(
      createApiUrl('users/register'),
      createOptions('POST', userData)
    );
    return handleResponse(response);
  },

  // Blog endpoints
  getBlogs: async (params = {}) => {
    // If params is a string (legacy support), convert it to an object
    if (typeof params === 'string') {
      const searchParams = new URLSearchParams(
        params.startsWith('?') ? params.slice(1) : params
      );
      params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    // Ensure we always have valid pagination
    const finalParams = {
      page: 1,
      limit: 10,
      ...params
    };

    const url = getBlogsUrl(finalParams);
    console.log('Fetching blogs from URL:', url);
    const response = await fetch(url, createOptions('GET'));
    return await handleResponse(response);
  },

  getBlog: async (id) => {
    const response = await fetch(
      createApiUrl(`blogs/${id}`),
      createOptions('GET')
    );
    return handleResponse(response);
  },

  createBlog: async (blogData, token) => {
    const response = await fetch(
      createApiUrl('blogs'),
      createOptions('POST', blogData, token)
    );
    return handleResponse(response);
  },

  updateBlog: async (id, blogData, token) => {
    const response = await fetch(
      createApiUrl(`blogs/${id}`),
      createOptions('PUT', blogData, token)
    );
    return handleResponse(response);
  },

  deleteBlog: async (id, token) => {
    const response = await fetch(
      createApiUrl(`blogs/${id}`),
      createOptions('DELETE', null, token)
    );
    return handleResponse(response);
  },

  likeBlog: async (id, token) => {
    const response = await fetch(
      createApiUrl(`blogs/${id}/like`),
      createOptions('POST', null, token)
    );
    return handleResponse(response);
  },

  // User endpoints
  getCurrentUser: async (token) => {
    const response = await fetch(
      createApiUrl('users/me'),
      createOptions('GET', null, token)
    );
    return handleResponse(response);
  },

  updateProfile: async (userData, token) => {
    const response = await fetch(
      createApiUrl('users/profile'),
      createOptions('PUT', userData, token)
    );
    return handleResponse(response);
  },

  // Media upload
  uploadMedia: async (formData, token) => {
    const response = await fetch(createApiUrl('media/upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: formData,
      mode: 'cors'
    });
    return handleResponse(response);
  }
};

export default api;
