const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Register a new user
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('name').not().isEmpty().withMessage('Name is required')
  ],
  authController.register
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').not().isEmpty().withMessage('Password is required')
  ],
  authController.login
);

// Google OAuth routes
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleCallback);

// Get current user profile
router.get('/me', authMiddleware.protect, authController.getCurrentUser);

// Update user profile
router.put(
  '/me',
  authMiddleware.protect,
  [
    body('name').optional(),
    body('email').optional().isEmail().withMessage('Please provide a valid email')
  ],
  authController.updateProfile
);

// Change password
router.put(
  '/change-password',
  authMiddleware.protect,
  [
    body('currentPassword').not().isEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  authController.changePassword
);

module.exports = router;
