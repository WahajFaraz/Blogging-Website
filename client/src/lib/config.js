const env = import.meta.env;

// Helper to get the correct base URL
const getBaseUrl = () => {
  // In production, use the production URL
  if (env.MODE === 'production') {
    return 'https://blogging-website-lyart.vercel.app';
  }
  // In development, use the local server or the one specified in .env
  return env.VITE_API_BASE_URL || 'http://localhost:5001';
};

export const config = {
  api: {
    baseUrl: getBaseUrl().replace(/\/+$/, ''),
    version: 'v1',
    timeout: 30000,
    defaultHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    // Add CORS specific settings
    cors: {
      credentials: 'include',
      mode: 'cors',
      cache: 'default'
    }
  },
  
  app: {
    name: env.VITE_APP_NAME || 'BlogSpace',
    env: env.MODE || 'production',
    version: env.VITE_APP_VERSION || '1.0.0',
  },
  
  features: {
    analytics: env.VITE_ENABLE_ANALYTICS === 'true',
    debug: env.VITE_ENABLE_DEBUG === 'true' || env.MODE === 'development',
  },
  
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
  }
};

export const API_BASE_URL = config.api.baseUrl;