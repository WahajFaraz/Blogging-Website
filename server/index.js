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

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const createApp = () => {
  const app = express();

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disable CSP for Vercel compatibility
  }));

  // Logging
  if (config.server.nodeEnv === 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Configure CORS with explicit headers and preflight caching
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // In development, allow localhost origins
      if (config.server.nodeEnv === 'production') {
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173'
        ];
        
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
      }
      
      // In production, only allow the configured client URL
      if (origin === config.server.clientUrl) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-Content-Range',
      'Set-Cookie',
      'Content-Length'
    ],
    exposedHeaders: [
      'Content-Range',
      'X-Content-Range',
      'Content-Length'
    ],
    credentials: true,
    maxAge: 86400, // Cache preflight request for 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 200 // Changed from 204 to 200 for better Vercel compatibility
  };
  
  // Apply CORS with the options
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions)); // Enable pre-flight for all routes
  
  // Handle preflight for all routes - improved for Vercel
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    next();
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again in 15 minutes!'
  });

  // Apply rate limiting to API routes
  app.use('/api', limiter);
  app.use('/api/v1', limiter);

  // Body parser, reading data from body into req.body
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Compress all responses
  app.use(compression());

  // Health check endpoint
  app.get('/', (req, res) => {
    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: config.server.nodeEnv,
      version: process.env.npm_package_version || '1.0.0'
    };
    
    // Set cache headers
    res.set('Cache-Control', 'no-store');
    
    // Return status
    res.status(200).json(status);
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      status: 'success',
      message: 'Welcome to BlogSpace API',
      version: '1.0.0',
      endpoints: {
        users: '/api/v1/users',
        blogs: '/api/v1/blogs',
        media: '/api/v1/media',
        health: '/'
      }
    });
  });

  // 404 handler for API routes
  app.use('/api/v1/*', (req, res) => {
    res.status(404).json({ 
      status: 'error',
      message: 'API endpoint not found',
      path: req.originalUrl,
      availableEndpoints: ['/api/v1/users', '/api/v1/blogs', '/api/v1/media']
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Error:', err);
    
    // If headers already sent, delegate to the default Express error handler
    if (res.headersSent) {
      return next(err);
    }
    
    const statusCode = err.statusCode || 500;
    const response = {
      status: 'error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && { 
        stack: err.stack,
        error: err.message 
      })
    };
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      response.message = 'Validation Error';
      response.errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json(response);
    }
    
    if (err.name === 'CastError') {
      response.message = 'Invalid ID format';
      return res.status(400).json(response);
    }
    
    // For Vercel, ensure we don't send stack traces in production
    if (process.env.NODE_ENV === 'production') {
      delete response.stack;
    }
    
    res.status(statusCode).json(response);
  });

  // 404 handler for all other routes
  app.all('*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: `Can't find ${req.originalUrl} on this server!`
    });
  });

  return app;
};

// Connect to MongoDB with retry logic
const connectWithRetry = async (maxRetries = 3, attempt = 1) => {
  try {
    console.log(`Attempting to connect to MongoDB (${attempt}/${maxRetries})...`);
    await mongoose.connect(config.db.uri, config.db.options);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    
    if (attempt >= maxRetries) {
      console.error('Max retries reached. Could not connect to MongoDB.');
      return false;
    }
    
    const delay = 5000;
    console.log(`Retrying connection in ${delay/1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(maxRetries, attempt + 1);
  }
};

const app = createApp();

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = config.server.port;
  
  const startServer = async () => {
    try {
      await connectWithRetry();
      app.listen(PORT, () => {
        console.log(`Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
      });
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    }
  };
  
  startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
} else {
  // For production (Vercel serverless functions)
  (async () => {
    try {
      await connectWithRetry();
      console.log('Connected to MongoDB in production');
    } catch (error) {
      console.error('Failed to connect to MongoDB in production:', error);
      process.exit(1);
    }
  })();
}

// Export the Express app for Vercel
export default app;