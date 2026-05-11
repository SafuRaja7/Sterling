import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { connectDB } from './config/db';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import chatRoutes from './routes/chatRoutes';
import vaAuthRoutes from './routes/vaAuthRoutes';

dotenv.config();

// Connect to database
connectDB();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://sterlingshopifymarket.online',
  'https://www.sterlingshopifymarket.online'
].filter(Boolean) as string[];

const app = express();
app.set('trust proxy', 1); // Trust Render's proxy headers
const server = http.createServer(app);

// Socket.io setup for real-time admin updates
const io = new Server(server, {
  cors: {
    origin: (origin: any, callback: any) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  },
});

// Make io accessible to routes
app.set('io', io);

// Body parser with increased limits for base64 image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Security and logging middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/va-auth', vaAuthRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' });
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);
  
  // Join admin room if user is admin
  socket.on('join_admin_room', () => {
    socket.join('admin_notifications');
    console.log(`Socket ${socket.id} joined admin_notifications`);
  });

  // User joins their own room for private support chat
  socket.on('join_user_room', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined user room: ${userId}`);
  });

  // Typing indicators
  socket.on('typing', ({ roomId, username }) => {
    socket.to(roomId).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ roomId }) => {
    socket.to(roomId).emit('user_stop_typing');
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = parseInt(String(process.env.PORT || '5000'), 10);

server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️  Port ${PORT} is busy — retrying on port ${PORT + 1}...`);
    server.close();
    server.listen(PORT + 1, () => {
      console.log(`🚀 Server running on fallback port ${PORT + 1}`);
    });
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
