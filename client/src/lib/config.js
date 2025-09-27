const env = import.meta.env;

export const config = {
  api: {
    baseUrl: 'https://blogging-website-lyart.vercel.app',
    version: 'v1',
    timeout: 30000,
    defaultHeaders: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
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