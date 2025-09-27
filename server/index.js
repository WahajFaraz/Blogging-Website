import 'express-async-errors';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { xss } from 'express-xss-sanitizer';
import hpp from 'hpp';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config/config.js';
import userRoutes from './routes/user.js';
import blogRoutes from './routes/blog.js';
import mediaRoutes from './routes/media.js';

let cachedDb = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Logging
  app.use(morgan(config.server.nodeEnv === 'production' ? 'combined' : 'dev'));

  /** ---------------------- CORS FIX ------------------------- */
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://blogspace-gamma.vercel.app',
    'https://blogging-website-lyart.vercel.app',
    'https://blogspace-git-main-wahajfarazs-projects.vercel.app',
    'https://blogspace-git-develop-wahajfarazs-projects.vercel.app',
    'https://blogging-website-2jbqc17qm-wahaj-farazs-projects.vercel.app',
  ];

  const originIsAllowed = (origin) =>
    !origin ||
    allowedOrigins.includes(origin) ||
    origin.endsWith('.vercel.app');

  // Function to handle CORS origin with credentials
  const handleCorsOrigin = (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if the origin is allowed
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      // For credentialed requests, we need to return the exact origin, not true
      return callback(null, origin);
    }
    
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  };

  const corsOptions = {
    origin: handleCorsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Content-Length', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 86400, // 24 hours
    preflightContinue: false
  };

  // handle OPTIONS first
  app.options('*', cors(corsOptions));
  app.use(cors(corsOptions));

  /** --------------------------------------------------------- */

  // Root endpoint
  app.get('/', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({
      status: 'ok',
      message: 'BlogSpace API is running',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      documentation: 'https://github.com/yourusername/your-repo#readme',
      endpoints: {
        blogs: '/api/v1/blogs',
        users: '/api/v1/users',
        media: '/api/v1/media',
        health: '/api/health'
      }
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.status(200).json({ 
      status: 'ok', 
      time: new Date().toISOString(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', limiter);
  app.use('/api/v1', limiter);

  // Parsers & Security
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());
  app.use(compression());

  // Database connection middleware
  const ensureDbConnection = async (req, res, next) => {
    try {
      if (mongoose.connection.readyState !== 1) await connectToMongoDB();
      next();
    } catch (e) {
      next(e);
    }
  };
  app.use('/api', ensureDbConnection);

  // Routes
  app.use('/api/v1/blogs', blogRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/media', mediaRoutes);

  // 404
  app.use('/api/v1/*', (req, res) =>
    res.status(404).json({ message: 'API endpoint not found' })
  );

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err);
    if (res.headersSent) return next(err);
    res
      .status(err.status || 500)
      .json({ error: err.message || 'Internal Server Error' });
  });

  return app;
};

const app = createApp();

/* ---------- MongoDB connection ---------- */
const connectToMongoDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) return;
  await mongoose.connect(config.db.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  cachedDb = mongoose.connection;
  console.log('MongoDB connected');
};

/* ---------- Server ---------- */
const startServer = async () => {
  try {
    await connectToMongoDB();
    const port = config.server.port;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Server start error:', err);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') startServer();

export default app;
