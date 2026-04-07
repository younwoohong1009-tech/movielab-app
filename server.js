require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Database connection
const connectDB = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const alphabetRoutes = require('./alphabet-drop/routes/alphabet');

// Express app
const app = express();

// Database 연결
connectDB();

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 정적 파일 제공 (프론트엔드)
app.use(express.static(path.join(__dirname, 'public')));

// Alphabet Drop 정적 파일
app.use('/drop', express.static(path.join(__dirname, 'alphabet-drop', 'public')));

// 업로드 파일 제공
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/alphabet', alphabetRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MovieLAB Server Running',
    timestamp: new Date().toISOString()
  });
});

// 모든 경로는 프론트엔드로
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '서버 오류가 발생했습니다'
  });
});

// Server 시작
const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('='.repeat(60));
  console.log('🎬 MovieLAB Server Running');
  console.log('='.repeat(60));
  console.log(`🌐 Port: ${PORT}`);
  console.log(`🏥 Health: /api/health`);
  console.log(`📱 Frontend: /`);
  console.log(`💣 Alphabet Drop: /drop/drop.html`);
  console.log(`📡 Alphabet API: /api/alphabet/*`);
  console.log('='.repeat(60));
  console.log('');
});

module.exports = app;
