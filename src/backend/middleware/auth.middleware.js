const jwt = require('jsonwebtoken');
const { createDbConnection } = require('../../database/setup');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from external keys directory
dotenv.config({ path: '/home/simrob1729/keys/.env' });

// Middleware to protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Check if token exists in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token is provided
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'You are not logged in. Please log in to get access.'
    });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user still exists
    const db = createDbConnection();
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [decoded.id],
      (err, user) => {
        db.close();

        if (err || !user) {
          return res.status(401).json({
            status: 'error',
            message: 'The user belonging to this token no longer exists.'
          });
        }

        // Add user to request
        req.user = user;
        next();
      }
    );
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token. Please log in again.'
    });
  }
};

// Middleware to restrict access to certain roles
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};
