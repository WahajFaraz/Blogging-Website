import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const tokenBlacklist = new Set();

export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ error: 'Token has been invalidated' });
    }
    

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      if (!decoded.userId) {
        return res.status(401).json({ error: 'Invalid token: Missing user ID' });
      }
      
      const user = await User.findById(decoded.userId).select('-password').lean();
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      req.user = user;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token.' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired.' });
      }
      throw jwtError;
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error during authentication.',
      details: process.env.NODE_ENV === 'production' ? error.message : undefined
    });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    next();
  }
};

const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    res.status(500).json({ error: 'Server error.' });
  }
};

export { auth, optionalAuth, adminAuth };