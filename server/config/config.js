import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const config = {
  server: {
    port: process.env.PORT || 5001,
    nodeEnv: process.env.NODE_ENV || 'production',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  },

  db: {
    uri: process.env.MONGODB_URI,
    options: {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      retryWrites: true,
      retryReads: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      autoIndex: process.env.NODE_ENV !== 'production',
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET,
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

  uploads: {
    maxFileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 10000000,
    directory: process.env.FILE_UPLOAD_PATH || './public/uploads',
  },

  cloudinary: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    defaultAvatar: {
      url: 'https://ui-avatars.com/api/',
      options: 'background=random&color=fff',
    },
  },

  rateLimit: {
    windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
    max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX) : 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

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
