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

// Global variable to cache the connection across function invocations
let cachedDb = null;

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

  // Database connection middleware
  const ensureDbConnection = async (req, res, next) => {
    try {
      if (mongoose.connection.readyState !== 1) {
        console.log('Establishing database connection...');
        await connectToMongoDB();
      }
      next();
    } catch (error) {
      console.error('Database connection error:', error);
      next(error);
    }
  };

  // Apply the middleware to all API routes
  app.use('/api', ensureDbConnection);

  // Health check endpoint with database connection check
  app.get('/', async (req, res) => {
    // Safely get connection state
    let dbState = 'unknown';
    let mongoState = 'unknown';
    let mongoConnection = null;
    let connectionError = null;
    
    try {
      // Log the MongoDB URI being used (without credentials)
      const safeUri = config.db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      console.log('MongoDB Connection Attempt:', {
        uriStartsWith: config.db.uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://',
        safeUri: safeUri,
        hasCredentials: config.db.uri.includes('@'),
        nodeEnv: process.env.NODE_ENV
      });
      
      // Get MongoDB connection state safely
      if (mongoose.connection) {
        mongoState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
        mongoConnection = {
          readyState: mongoose.connection.readyState,
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          models: mongoose.connection.models ? Object.keys(mongoose.connection.models) : []
        };
      }
      dbState = mongoState;
      
      // If not connected, try to connect
      if (mongoose.connection.readyState !== 1) {
        console.log('Attempting to establish database connection...');
        await connectToMongoDB();
        dbState = 'connected';
        console.log('Database connection established successfully');
      }
    } catch (e) {
      console.error('Error in health check:', e);
      dbState = 'connection error';
      connectionError = {
        name: e.name,
        message: e.message,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      };
    }
    
    let pingResult = 'not attempted';
    let pingError = null;

    // Log environment information
    const envInfo = {
      NODE_ENV: process.env.NODE_ENV,
      MONGODB_URI: process.env.MONGODB_URI ? '***configured***' : 'not configured',
      MONGODB_URI_STARTS_CORRECTLY: config.db.uri ? 
        (config.db.uri.startsWith('mongodb://') || config.db.uri.startsWith('mongodb+srv://')) : 
        'no uri',
      USING_CONFIG_URI: !!config.db.uri,
      CONFIG_DB_URI: config.db.uri ? '***configured***' : 'not configured',
      VERIFIED_ENV_VARS: Object.keys(process.env).filter(k => k.includes('MONGODB') || k.includes('MONGO') || k.includes('DB'))
    };
    
    // Log additional debug info
    const debugInfo = {
      configDbUri: config.db.uri ? '***configured***' : 'not configured',
      mongooseConnection: {
        readyState: mongoose.connection ? mongoose.connection.readyState : 'no connection',
        host: mongoose.connection ? mongoose.connection.host : 'no connection',
        port: mongoose.connection ? mongoose.connection.port : 'no connection',
        name: mongoose.connection ? mongoose.connection.name : 'no connection',
        models: mongoose.connection && mongoose.connection.models ? 
          Object.keys(mongoose.connection.models) : 'no models'
      },
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: process.memoryUsage()
    };
    
    console.log('Environment Info:', JSON.stringify(envInfo, null, 2));
    console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));

    // Try to connect to database if not connected
    try {
      // Check if we have a valid connection state
      if (mongoose.connection && typeof mongoose.connection.readyState !== 'undefined') {
        if (mongoose.connection.readyState !== 1) {
          console.log('Attempting to establish database connection...');
          await connectToMongoDB();
          dbState = 'connected';
          console.log('Database connection established successfully');
        }
      } else {
        console.log('Mongoose connection not properly initialized, attempting to connect...');
        await connectToMongoDB();
        dbState = 'connected';
        console.log('Database connection established successfully');
      }
    } catch (err) {
      connectionError = {
        name: err.name,
        message: err.message,
        code: err.code,
        codeName: err.codeName,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      };
      console.error('Failed to connect to database in health check:', connectionError);
      dbState = 'connection failed';
    }

    // Try to ping the database if we think we're connected
    if (mongoose.connection.readyState === 1) {
      try {
        const start = Date.now();
        await mongoose.connection.db.admin().ping();
        pingResult = `ok (${Date.now() - start}ms)`;
      } catch (err) {
        console.error('Database ping failed:', err);
        pingResult = 'failed';
        dbState = 'ping failed';
        pingError = {
          message: err.message,
          name: err.name,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        };
      }
    }

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      node: {
        version: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        pid: process.pid,
        uptime: process.uptime()
      },
      app: {
        name: 'BlogSpace API',
        version: '1.0.0',
        environment: config.server.nodeEnv,
        node_env: process.env.NODE_ENV || 'development'
      },
      database: {
        state: dbState,
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'not connected',
        port: mongoose.connection.port || 'not connected',
        models: Object.keys(mongoose.connection.models || {}),
        ping: pingResult,
        connectionError: connectionError || undefined,
        pingError: pingError ? {
          message: pingError.message,
          name: pingError.name,
          code: pingError.code,
          codeName: pingError.codeName
        } : undefined
      },
      vercel: {
        isVercel: Boolean(process.env.VERCEL || process.env.NOW_REGION),
        environment: process.env.VERCEL_ENV || 'development',
        region: process.env.VERCEL_REGION || 'local',
        url: process.env.VERCEL_URL || 'http://localhost:5001'
      },
      env: {
        MONGODB_URI: process.env.MONGODB_URI ? '***configured***' : 'not configured',
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    });
    res.set('Surrogate-Control', 'no-store');
    
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
      message: 'API endpoint not found'
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    // Log the error
    console.error('Error:', {
      message: err.message,
      name: err.name,
      stack: err.stack,
      code: err.code,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });
    
    // If headers already sent, delegate to the default Express error handler
    if (res.headersSent) {
      return next(err);
    }
    
    // Default error status and message
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let code = err.code;
    let details = {};
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      details = Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message,
        type: e.kind
      }));
    } 
    else if (err.name === 'MongoError' || err.name === 'MongoServerError') {
      // Handle MongoDB specific errors
      switch(err.code) {
        case 11000: // Duplicate key
          statusCode = 409;
          message = 'Duplicate key error';
          const key = Object.keys(err.keyPattern || {})[0];
          if (key) {
            details = { [key]: `Value '${err.keyValue[key]}' already exists` };
          }
          break;
        case 'ECONNREFUSED':
        case 'ETIMEDOUT':
          statusCode = 503;
          message = 'Database connection error';
          break;
        default:
          message = 'Database error';
      }
    }
    else if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    }
    else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }
    else if (err.name === 'UnauthorizedError') {
      statusCode = 401;
      message = 'Unauthorized';
    }
    else if (err.name === 'NotFoundError') {
      statusCode = 404;
      message = 'Resource not found';
    }
    
    // Prepare error response
    const errorResponse = {
      status: 'error',
      statusCode,
      message,
      ...(code && { code }),
      ...(Object.keys(details).length > 0 && { details })
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = err.stack;
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
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

// Create the Express app
const app = createApp();

// ... (rest of the code remains the same)
// Connect to MongoDB
const connectToMongoDB = async (options = {}) => {
  const { retry = true, maxRetries = 3, retryDelay = 2000 } = options;
  let retryCount = 0;
    
  const attemptConnection = async () => {
    try {
      if (cachedDb && mongoose.connection && typeof mongoose.connection.readyState !== 'undefined') {
        try {
          if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            console.log('Using existing database connection');
            return mongoose.connection;
          }
        } catch (pingError) {
          console.log('Cached connection is dead, creating a new one');
          cachedDb = null;
        }
      }

      console.log('Connecting to MongoDB...');
      
      // Log connection attempt (without credentials)
      const safeUri = config.db.uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
      
      console.log('MongoDB Connection Info:', {
        usingConfig: 'Hardcoded in config',
        uriStartsWith: config.db.uri.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://',
        safeUri: safeUri,
        hasCredentials: config.db.uri.includes('@')
      });

      try {
        // Create a new connection with the options from config
        console.log('Attempting to connect to MongoDB...');
        console.log('Using connection string:', config.db.uri);
        
        const connectionOptions = {
          ...config.db.options,
          serverSelectionTimeoutMS: 10000, // 10 seconds timeout
          socketTimeoutMS: 45000, // 45 seconds socket timeout
          useNewUrlParser: true,
          useUnifiedTopology: true
        };
        
        console.log('Connection options:', JSON.stringify(connectionOptions, null, 2));
        
        await mongoose.connect(config.db.uri, connectionOptions);
        
        console.log('MongoDB connected successfully');
        console.log('MongoDB Connection Details:', {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          readyState: mongoose.connection.readyState,
          models: Object.keys(mongoose.connection.models)
        });
        
        // Cache the connection
        cachedDb = mongoose.connection;
        
        return mongoose.connection;
      } catch (connectError) {
        console.error('MongoDB connection error details:', {
          name: connectError.name,
          message: connectError.message,
          code: connectError.code,
          codeName: connectError.codeName,
          error: JSON.stringify(connectError, Object.getOwnPropertyNames(connectError))
        });
        throw connectError;
      }
      
    } catch (error) {
      console.error(`MongoDB connection error (attempt ${retryCount + 1}/${maxRetries}):`, error.message);
      
      // If we should retry and haven't exceeded max retries
      if (retry && retryCount < maxRetries - 1) {
        retryCount++;
        console.log(`Retrying connection in ${retryDelay}ms... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attemptConnection();
      }
      
      throw error; // Re-throw the error if we're not retrying or have exceeded max retries
    }
  };

  // Set up event listeners (only once)
  if (!mongoose.connection._events || !mongoose.connection._events.connected) {
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected event');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected event');
      cachedDb = null;
      
      // Attempt to reconnect if we're not already in the process of reconnecting
      if (process.env.NODE_ENV === 'production') {
        console.log('Attempting to reconnect to MongoDB...');
        setTimeout(() => {
          connectToMongoDB().catch(err => {
            console.error('Failed to reconnect to MongoDB:', err);
          });
        }, 5000); // Wait 5 seconds before attempting to reconnect
      }
    });
  }

  return attemptConnection();
};

// Function to start the server
const startServer = async () => {
    // Initialize MongoDB connection with retry logic
  let dbConnection;
  try {
    dbConnection = await connectToMongoDB({
      retry: true,
      maxRetries: 5,
      retryDelay: 3000
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB after multiple retries:', error);
    // Don't exit in production, let the health check handle it
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
  try {
    console.log('Starting server...');
    
    // In production, we'll let the app start even if MongoDB is not available initially
    // The connection will be established on the first request
    if (process.env.NODE_ENV === 'development') {
      await connectToMongoDB();
      console.log('MongoDB connection established');
    } else {
      console.log('Production mode: MongoDB connection will be established on first request');
    }
    
    const port = config.server.port;
    const server = app.listen(port, () => {
      console.log(`Server running in ${config.server.nodeEnv} mode on port ${port}`);
      console.log(`API Documentation available at http://localhost:${port}/api-docs`);
      console.log(`Health check: http://localhost:${port}/`);
    });
    
    // Handle server shutdown gracefully
    const shutdown = async () => {
      console.log('Shutting down server...');
      
      // Close the server first to stop accepting new connections
      server.close(async () => {
        console.log('Server closed');
        
        // Then close MongoDB connection if it exists
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          try {
            await mongoose.connection.close(false);
            console.log('MongoDB connection closed');
          } catch (err) {
            console.error('Error closing MongoDB connection:', err);
          }
        }
        
        // Exit the process
        process.exit(0);
      });
      
      // Force exit after 10 seconds if the above takes too long
      setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };
    
    // Handle process termination
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      shutdown();
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });
    
    return server;
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (process.env.NODE_ENV !== 'test') {
  startServer().catch(error => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

// For testing purposes
export { connectToMongoDB, startServer };

export default app;