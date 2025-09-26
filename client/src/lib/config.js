const env = import.meta.env;

export const config = {
  api: {
    baseUrl: (env.VITE_API_BASE_URL || 'https://blogging-website-lyart.vercel.app').replace(/\/+$/, ''),
    version: 'v1',
    timeout: 30000,
    defaultHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  },
  
  app: {
    name: env.VITE_APP_NAME || 'BlogSpace',
    env: env.VITE_APP_ENV || 'development',
    version: env.VITE_APP_VERSION || '1.0.0',
  },
  
  features: {
    analytics: env.VITE_ENABLE_ANALYTICS === 'true',
    debug: env.VITE_ENABLE_DEBUG === 'true',
  },
  
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000,
  }
};

export const API_BASE_URL = config.api.baseUrl;