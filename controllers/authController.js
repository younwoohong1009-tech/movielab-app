const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// 회원가입
exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // 사용자 생성
    const user = new User({ email, password, name });
    await user.save();

    // 토큰 생성
    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 로그인
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 사용자 조회
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 마지막 로그인 업데이트
    user.lastLogin = new Date();
    await user.save();

    // 토큰 생성
    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 토큰 갱신
exports.refreshToken = async (req, res) => {
  try {
    const user = req.user; // 미들웨어에서 설정
    const token = generateToken(user._id);
    
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 현재 사용자 정보
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 로그아웃 (클라이언트에서 토큰 삭제)
exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};
