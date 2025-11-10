// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from './models/User.js';
import Log from './models/Log.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const DATABASE_URL = process.env.DATABASE_URL;

// Helper: sign token
function signToken(user) {
  return jwt.sign({ id: user.id || user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

// Auth middleware
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Missing token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Check if MongoDB is connected
function checkMongoConnection() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

// Connect to MongoDB
async function start() {
  try {
    // Try to connect to MongoDB first
    if (!DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL not set in .env file');
      console.error('❌ Please set DATABASE_URL in backend/.env');
      process.exit(1);
    }

    try {
      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(DATABASE_URL, {
        serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      });
      console.log('✅ Connected to MongoDB');
      
      // Start server only after MongoDB is connected
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ API listening on http://0.0.0.0:${PORT}`);
        console.log(`✅ Server is ready to accept requests`);
      });
    } catch (dbErr) {
      console.error('❌ Failed to connect to MongoDB:', dbErr.message);
      console.error('');
      console.error('💡 Solutions:');
      console.error('   1. Make sure MongoDB is installed and running');
      console.error('   2. For Windows: Run "net start MongoDB"');
      console.error('   3. Or use MongoDB Atlas (cloud): Update DATABASE_URL in .env');
      console.error('   4. Check your DATABASE_URL format in backend/.env');
      console.error('');
      console.error('Current DATABASE_URL:', DATABASE_URL);
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  // Check MongoDB connection
  if (!checkMongoConnection()) {
    console.error('Register attempt failed: MongoDB not connected');
    return res.status(503).json({ message: 'Database connection error. Please check if MongoDB is running.' });
  }

  try {
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(400).json({ message: 'User exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password_hash: passwordHash });
    console.log('✅ User registered:', email);
    const token = signToken({ id: user._id, email: user.email });
    res.json({ user: { id: user._id, email: user.email }, token });
  } catch (err) {
    console.error('register error', err);
    if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
      return res.status(503).json({ message: 'Database error. Please check MongoDB connection.' });
    }
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Unknown error') });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

  // Check MongoDB connection
  if (!checkMongoConnection()) {
    console.error('Login attempt failed: MongoDB not connected');
    return res.status(503).json({ message: 'Database connection error. Please check if MongoDB is running.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      console.log('Login failed: Invalid password for email:', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    console.log('✅ User logged in:', email);
    const token = signToken({ id: user._id, email: user.email });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    console.error('login error', err);
    if (err.name === 'MongoServerError' || err.name === 'MongoNetworkError') {
      return res.status(503).json({ message: 'Database error. Please check MongoDB connection.' });
    }
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Unknown error') });
  }
});

// Forgot Password - Request reset
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ message: 'Email required' });

  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.json({ message: 'If the email exists, a password reset link has been sent.' });
    }

    // Generate reset token (simple implementation - in production, use crypto.randomBytes)
    const resetToken = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await User.findByIdAndUpdate(user._id, {
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // In production, send email with reset link
    // For now, return the token (remove this in production!)
    console.log('Password reset token for', email, ':', resetToken);
    
    res.json({ 
      message: 'If the email exists, a password reset link has been sent.',
      resetToken: resetToken // Remove this in production - only for development
    });
  } catch (err) {
    console.error('forgot-password error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password - Set new password
app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: 'Token and new password (min 8 chars) required' });
  }

  try {
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ 
      _id: decoded.id,
      reset_token: token,
      reset_token_expiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(user._id, {
      password_hash: passwordHash,
      reset_token: null,
      reset_token_expiry: null
    });

    res.json({ message: 'Password reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('reset-password error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Optional: get current user
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('email created_at').lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ id: user._id, email: user.email, created_at: user.created_at });
  } catch (err) {
    console.error('/api/me error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET logs
app.get('/api/logs', authMiddleware, async (req, res) => {
  const { start, end } = req.query;
  try {
    const q = { user_id: req.user.id };
    if (start) q.date = { ...(q.date || {}), $gte: new Date(start) };
    if (end) q.date = { ...(q.date || {}), $lte: new Date(end) };
    const result = await Log.find(q).sort({ date: -1 }).lean();
    // format dates to YYYY-MM-DD strings and ensure numbers
    const out = result.map(r => ({ id: r._id, date: r.date.toISOString().slice(0,10), hours: Number(r.hours), project: r.project, notes: r.notes, created_at: r.created_at, updated_at: r.updated_at }));
    res.json(out);
  } catch (err) {
    console.error('get logs error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST add log
app.post('/api/logs', authMiddleware, async (req, res) => {
  const { date, hours, project = 'General', notes = '' } = req.body || {};
  if (!date || typeof hours !== 'number') return res.status(400).json({ message: 'date and hours required' });

  try {
    const doc = await Log.create({ user_id: req.user.id, date: new Date(date), hours, project, notes });
    res.status(201).json({ id: doc._id, date: doc.date.toISOString().slice(0,10), hours: Number(doc.hours), project: doc.project, notes: doc.notes, created_at: doc.created_at, updated_at: doc.updated_at });
  } catch (err) {
    console.error('post log error', err);
    res.status(500).json({ message: 'Server error: ' + (err.message || 'Unknown error') });
  }
});

// PUT update log
app.put('/api/logs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const updates = req.body || {};
  if (!id) return res.status(400).json({ message: 'id required' });

  const set = {};
  if (updates.date) set.date = new Date(updates.date);
  if (typeof updates.hours === 'number') set.hours = updates.hours;
  if (updates.project) set.project = updates.project;
  if (typeof updates.notes !== 'undefined') set.notes = updates.notes;
  if (!Object.keys(set).length) return res.status(400).json({ message: 'No updatable fields provided' });

  set.updated_at = new Date();
  try {
    const r = await Log.findOneAndUpdate({ _id: id, user_id: req.user.id }, { $set: set }, { new: true }).lean();
    if (!r) return res.status(404).json({ message: 'Not found or not allowed' });
    res.json({ id: r._id, date: r.date.toISOString().slice(0,10), hours: Number(r.hours), project: r.project, notes: r.notes, created_at: r.created_at, updated_at: r.updated_at });
  } catch (err) {
    console.error('put log error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE log
app.delete('/api/logs/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const r = await Log.deleteOne({ _id: id, user_id: req.user.id });
    if (r.deletedCount === 0) return res.status(404).json({ message: 'Not found or not allowed' });
    res.status(204).send();
  } catch (err) {
    console.error('delete log error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forecast: use provided history OR fetch last N logs for user
app.post('/api/forecast', authMiddleware, async (req, res) => {
  const bodyHistory = Array.isArray(req.body?.history) ? req.body.history : null;
  const horizon = Number(req.body?.horizon) || 7;

  try {
    let history = bodyHistory;
    if (!history) {
      const r = await Log.find({ user_id: req.user.id }).sort({ date: 1 }).limit(90).select('date hours').lean();
      history = r.map((x) => ({ date: x.date.toISOString().slice(0,10), hours: Number(x.hours) }));
    }

    const lastDate = history.length ? new Date(history[history.length - 1].date) : new Date();
    const lastHours = history.length ? Number(history[history.length - 1].hours) || 1 : 1;

    const preds = Array.from({ length: Math.max(1, Math.min(90, horizon)) }).map((_, i) => {
      const d = new Date(lastDate);
      d.setDate(d.getDate() + i + 1);
      const hours = Math.max(0, lastHours + Math.sin(i / 3) * 0.5);
      return {
        date: d.toISOString().slice(0, 10),
        hours: Number(hours.toFixed(2)),
        lower: Number((hours * 0.8).toFixed(2)),
        upper: Number((hours * 1.2).toFixed(2))
      };
    });

    res.json({ historyCount: history.length, predictions: preds });
  } catch (err) {
    console.error('forecast error', err);
    res.status(500).json({ message: 'Server error' });
  }
});

start();
