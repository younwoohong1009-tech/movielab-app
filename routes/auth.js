const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 공개 라우트
router.post('/register', authController.register);
router.post('/login', authController.login);

// 보호된 라우트
router.post('/refresh', authenticate, authController.refreshToken);
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
