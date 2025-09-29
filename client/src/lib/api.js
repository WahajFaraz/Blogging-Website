import { config } from './config';

const createApiUrl = (endpoint = '') => {
  const baseUrl = config.api.baseUrl;
  const version = config.api.version;
  const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
  return `${baseUrl}/api/${version}/${cleanEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
};

const getBlogsUrl = (params = {}) => {
  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  
  return queryString ? `${createApiUrl('blogs')}?${queryString}` : createApiUrl('blogs');
};

const handleResponse = async (response) => {
  if (response.status === 204) {
    return { success: true };
  }

  if (response.status === 401) {
    const error = new Error('Your session has expired. Please log in again.');
    error.status = 401;
    throw error;
  }

  let data;
  try {
    data = await response.json();
  } catch (err) {
    const errorText = await response.text();
    const apiError = new Error(`Server error: ${response.status} - ${errorText || 'Unknown error'}`);
    apiError.status = response.status;
    throw apiError;
  }
  
  if (!response.ok) {
    if (response.status === 400 && data.errors) {
      const validationError = new Error('Validation failed');
      validationError.status = 400;
      validationError.errors = data.errors;
      throw validationError;
    }
    
    const errorMessage = data.message || 
                       (data.error && typeof data.error === 'string' ? data.error : 'Something went wrong');
    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

const createOptions = (method, data = null, token = null) => {
  const options = {
    method,
    headers: {
      ...config.api.defaultHeaders,
    },
    credentials: 'include',
    mode: 'cors'
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data) {
    if (data instanceof FormData) {
      delete options.headers['Content-Type'];
      options.body = data;
    } else {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  return options;
};

const api = {
  login: async (credentials) => {
    try {
      const response = await fetch(
        createApiUrl('users/login'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        }
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Login failed');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await fetch(createApiUrl('users/signup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Registration failed');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },
  
  logout: async (token) => {
    try {
      const response = await fetch(
        createApiUrl('users/logout'),
        createOptions('POST', null, token)
      );
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Logout failed');
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  getBlogs: async (params = {}, token = null) => {
    if (typeof params === 'string') {
      const searchParams = new URLSearchParams(
        params.startsWith('?') ? params.slice(1) : params
      );
      params = {};
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    const finalParams = {
      page: 1,
      limit: 100,
      ...params
    };

    const url = getBlogsUrl(finalParams);
    
    const options = createOptions('GET', null, token);
    
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    
    const response = await fetch(url, options);
    const data = await handleResponse(response);
    return data;
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
