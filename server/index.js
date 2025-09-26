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

// Enhanced MongoDB connection with better error handling and logging
const connectWithRetry = async (maxRetries = 5, attempt = 1) => {
  try {
    console.log(`🔌 Attempting to connect to MongoDB (${attempt}/${maxRetries})...`);
    
    // Log the MongoDB URI (masking credentials for security)
    const maskedUri = config.db.uri.replace(/(mongodb\+srv:\/\/)([^:]+):([^@]+)@/, 
      (match, protocol, username) => `${protocol}${username}:*****@`);
    console.log(`🔗 Connecting to: ${maskedUri}`);
    
    // Set up event listeners for connection events
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('♻️  MongoDB reconnected');
    });

    // Connect to MongoDB
    await mongoose.connect(config.db.uri, config.db.options);
    
    // Verify the connection
    await mongoose.connection.db.admin().ping();
    console.log('✅ MongoDB connection verified');
    
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    if (attempt >= maxRetries) {
      console.error(`❌ Max retries (${maxRetries}) reached. Could not connect to MongoDB.`);
      console.error('Please check your MongoDB connection string and network settings.');
      console.error('Current NODE_ENV:', process.env.NODE_ENV);
      
      // Log environment variables (excluding sensitive data)
      console.log('Environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        MONGODB_URI: process.env.MONGODB_URI ? '***MONGODB_URI is set***' : 'MONGODB_URI is not set',
        NODE_VERSION: process.version,
        PLATFORM: process.platform,
        ARCH: process.arch,
      });
      
      return false;
    }
    
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 16000);
    console.log(`⏳ Retrying connection in ${delay/1000} seconds...`);
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return connectWithRetry(maxRetries, attempt + 1);
  }
};

const app = createApp();

// Unified server startup for both development and production
const startServer = async () => {
  try {
    // Connect to MongoDB first
    console.log(' Starting server initialization...');
    console.log(` Environment: ${config.server.nodeEnv}`);
    
    const isConnected = await connectWithRetry();
    
    if (!isConnected) {
      console.error(' Critical: Failed to connect to MongoDB after multiple attempts');
      console.error('Please check the following:');
      console.error('1. MongoDB connection string is correct');
      console.error('2. Network connectivity to MongoDB');
      console.error('3. MongoDB server is running and accessible');
      console.error('4. Firewall rules allow connections to MongoDB port (usually 27017)');
      process.exit(1);
    }
    
    // Get the appropriate port
    const PORT = process.env.PORT || config.server.port;
    
    // Start the HTTP server
    const server = app.listen(PORT, () => {
      console.log(` Server running in ${config.server.nodeEnv} mode on port ${PORT}`);
      console.log(` Server URL: http://localhost:${PORT}`);
      console.log(` ${new Date().toISOString()}`);
      console.log(` Process ID: ${process.pid}`);
      console.log(` Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      // Handle specific listen errors with friendly messages
      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`Port ${PORT} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

    // Handle process termination
    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received: closing HTTP server`);
      
      // Close the server first
      server.close(async (err) => {
        if (err) {
          console.error('Error closing server:', err);
          process.exit(1);
        }
        
        // Then close the database connection
        try {
          await mongoose.connection.close(false);
          console.log('MongoDB connection closed');
          process.exit(0);
        } catch (dbError) {
          console.error('Error closing database connection:', dbError);
          process.exit(1);
        }
      });
    };

    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
  } catch (error) {
    console.error(' Critical error during server startup:', error);
    process.exit(1);
  }
};

// Check if this file is being run directly (not required with ES modules)
const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url);

// Start the server if this file is run directly
if (isDirectRun) {
  startServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}

// Export the Express app and startServer for Vercel
export { app, startServer };

// Default export for Vercel
export default app;