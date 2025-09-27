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

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // You might want to handle token refresh or redirect to login here
    const error = new Error('Your session has expired. Please log in again.');
    error.status = 401;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    // If we can't parse JSON, it's probably a server error
    const errorText = await response.text();
    const apiError = new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
    apiError.status = response.status;
    throw apiError;
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
      'Content-Type': 'application/json',
      ...config.api.defaultHeaders,
    },
    credentials: 'include',
    mode: 'cors',
    cache: 'no-cache',
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
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
      createApiUrl('auth/login'),
      createOptions('POST', credentials)
    );
    return handleResponse(response);
  },

  register: async (userData) => {
    const response = await fetch(
      createApiUrl('auth/register'),
      createOptions('POST', userData)
    );
    return handleResponse(response);
  },
  
  logout: async (token) => {
    const response = await fetch(
      createApiUrl('auth/logout'),
      createOptions('POST', null, token)
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

  // Media uploads
  uploadImage: async (formData, token) => {
    const response = await fetch(createApiUrl('media/upload-image'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: formData,
      mode: 'cors'
    });
    return handleResponse(response);
  },
  
  uploadAvatar: async (formData, token) => {
    const response = await fetch(createApiUrl('media/upload-avatar'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: formData,
      mode: 'cors'
    });
    return handleResponse(response);
  },
  
  uploadVideo: async (formData, token) => {
    const response = await fetch(createApiUrl('media/upload-video'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      credentials: 'include',
      body: formData,
      mode: 'cors'
    });
    return handleResponse(response);
  },
  
  deleteMedia: async (publicId, token) => {
    const response = await fetch(
      createApiUrl(`media/${publicId}`),
      createOptions('DELETE', null, token)
    );
    return handleResponse(response);
  },
  
  // User interactions
  followUser: async (userId, token) => {
    const response = await fetch(
      createApiUrl(`users/follow/${userId}`),
      createOptions('POST', null, token)
    );
    return handleResponse(response);
  },
  
  unfollowUser: async (userId, token) => {
    const response = await fetch(
      createApiUrl(`users/unfollow/${userId}`),
      createOptions('POST', null, token)
    );
    return handleResponse(response);
  },
  
  getUserByUsername: async (username) => {
    const response = await fetch(
      createApiUrl(`users/${username}`),
      createOptions('GET')
    );
    return handleResponse(response);
  },
  
  // Blog comments
  addComment: async (blogId, content, token) => {
    const response = await fetch(
      createApiUrl(`blogs/${blogId}/comments`),
      createOptions('POST', { content }, token)
    );
    return handleResponse(response);
  },
  
  deleteComment: async (blogId, commentId, token) => {
    const response = await fetch(
      createApiUrl(`blogs/${blogId}/comments/${commentId}`),
      createOptions('DELETE', null, token)
    );
    return handleResponse(response);
  }
};

export default api;
