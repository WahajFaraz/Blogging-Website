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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* --------------------------  Express App Setup -------------------------- */
const createApp = () => {
  const app = express();

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false, // Disable CSP for Vercel compatibility
    })
  );

  // Logging
  app.use(morgan(config.server.nodeEnv === 'production' ? 'dev' : 'combined'));

  // -----------  CORS  -----------
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      // in production allow only configured client
      if (origin === config.server.clientUrl) return callback(null, true);
      // allow localhost for development
      if (
        ['http://localhost:3000', 'http://localhost:5173'].includes(origin)
      ) {
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
      'Content-Length',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Length'],
    credentials: true,
    maxAge: 86400,
    optionsSuccessStatus: 200,
  };

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.header(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      res.header(
        'Access-Control-Allow-Headers',
        corsOptions.allowedHeaders.join(',')
      );
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Max-Age', '86400');
      return res.status(200).end();
    }
    next();
  });

  // Security / perf middlewares
  app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use('/api/v1', rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(mongoSanitize());
  app.use(xss());
  app.use(hpp());
  app.use(compression());

  /* -------------------------  Health Check  ------------------------- */
  app.get('/', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV || config.server.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Routes
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/blogs', blogRoutes);
  app.use('/api/v1/media', mediaRoutes);

  // Docs
  app.get('/api', (req, res) => {
    res.json({
      status: 'success',
      message: 'Welcome to BlogSpace API',
      version: '1.0.0',
      endpoints: {
        users: '/api/v1/users',
        blogs: '/api/v1/blogs',
        media: '/api/v1/media',
        health: '/',
      },
    });
  });

  // 404 + error handlers
  app.use('/api/v1/*', (req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'API endpoint not found',
      path: req.originalUrl,
    });
  });

  app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (res.headersSent) return next(err);
    const statusCode = err.statusCode || 500;
    const response = {
      status: 'error',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal Server Error'
          : err.message || 'Internal Server Error',
    };
    if (process.env.NODE_ENV !== 'production') {
      response.stack = err.stack;
      response.error = err.message;
    }
    res.status(statusCode).json(response);
  });

  app.all('*', (req, res) =>
    res.status(404).json({
      status: 'error',
      message: `Can't find ${req.originalUrl} on this server!`,
    })
  );

  return app;
};

/* ---------------------  MongoDB Connection  --------------------- */
const connectWithRetry = async (maxRetries = 5, attempt = 1) => {
  try {
    console.log(`🔌 Connecting to MongoDB (${attempt}/${maxRetries})`);
    await mongoose.connect(config.db.uri, config.db.options);
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    if (attempt >= maxRetries) return false;
    const delay = Math.min(5000 * attempt, 20000);
    console.log(`⏳ Retrying in ${delay / 1000}s...`);
    await new Promise((r) => setTimeout(r, delay));
    return connectWithRetry(maxRetries, attempt + 1);
  }
};

const app = createApp();

/* ---------------------  Server Start --------------------- */
const startServer = async () => {
  const connected = await connectWithRetry();
  if (!connected) {
    console.error('Could not connect to MongoDB');
    process.exit(1);
  }
  const PORT = process.env.PORT || config.server.port;
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${config.server.nodeEnv} on port ${PORT}`);
  });
};

// Local Dev
if (process.env.NODE_ENV !== 'production') {
  startServer();
} else {
  // Production (Vercel): connect once at cold start
  connectWithRetry().then(() =>
    console.log('✅ MongoDB ready in production')
  );
}

// Export for Vercel
export default app;
export { startServer };
