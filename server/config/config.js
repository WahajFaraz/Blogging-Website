import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'production',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  db: {
    // Always use environment variable in production for security
    uri: process.env.MONGODB_URI || "mongodb+srv://0wahaj0:pLf2JP41NTxNGQiH@cluster0.j9dlacs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
    options: {
      // Timeout settings
      serverSelectionTimeoutMS: 10000,  // Timeout for server selection (10 seconds)
      socketTimeoutMS: 45000,           // Socket timeout (45 seconds)
      connectTimeoutMS: 10000,          // Connection timeout (10 seconds)
      
      // Connection pool settings
      maxPoolSize: 10,                  // Maximum number of connections in the pool
      minPoolSize: 1,                   // Minimum number of connections in the pool
      maxIdleTimeMS: 30000,             // Close idle connections after 30s
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // MongoDB driver settings
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Auto-indexing (disabled in production)
      autoIndex: process.env.NODE_ENV !== 'production',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: process.env.JWT_EXPIRE || '30d',
    cookieExpire: process.env.JWT_COOKIE_EXPIRE || 30,
  },

  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    },
    from: {
      name: 'BlogSpace',
      email: process.env.SMTP_EMAIL || 'noreply@blogspace.com',
    },
  },

  // File Uploads
  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 10000000, // 10MB
    directory: process.env.FILE_UPLOAD_PATH || './public/uploads',
  },

  // Cloudinary Configuration
  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    defaultAvatar: {
      url: 'https://ui-avatars.com/api/',
      options: 'background=random&color=fff',
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100, // limit each IP to 100 requests per windowMs
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Validate required configuration
const requiredConfigs = [
  { key: 'jwt.secret', value: config.jwt.secret },
  { key: 'cloudinary.cloud_name', value: config.cloudinary.cloud_name },
  { key: 'cloudinary.api_key', value: config.cloudinary.api_key },
  { key: 'cloudinary.api_secret', value: config.cloudinary.api_secret },
];

if (process.env.NODE_ENV === 'production') {
  requiredConfigs.forEach(({ key, value }) => {
    if (!value) {
      throw new Error(`Missing required config: ${key}`);
    }
  });
}

export default config;
