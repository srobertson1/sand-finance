const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { createDbConnection } = require('../../database/setup');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from external keys directory
dotenv.config({ path: '/home/simrob1729/keys/.env' });

// Create Google OAuth client
const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

// Register a new user
exports.register = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const { name, email, password } = req.body;

  try {
    const db = createDbConnection();

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({
          status: 'error',
          message: 'Database error'
        });
      }

      if (user) {
        db.close();
        return res.status(400).json({
          status: 'error',
          message: 'Email already in use'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create new user
      db.run(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'user'],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({
              status: 'error',
              message: 'Could not create user'
            });
          }

          // Generate token
          const token = generateToken(this.lastID);

          db.close();
          res.status(201).json({
            status: 'success',
            token,
            user: {
              id: this.lastID,
              name,
              email,
              role: 'user'
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Login user
exports.login = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;

  try {
    const db = createDbConnection();

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({
          status: 'error',
          message: 'Database error'
        });
      }

      if (!user) {
        db.close();
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Check if password is correct
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        db.close();
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken(user.id);

      db.close();
      res.status(200).json({
        status: 'success',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Google OAuth authentication
exports.googleAuth = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/userinfo.email']
  });
  res.redirect(authUrl);
};

// Google OAuth callback
exports.googleCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    });

    const { data } = await oauth2.userinfo.get();

    // Check if user exists in the database
    const db = createDbConnection();

    db.get('SELECT * FROM users WHERE email = ?', [data.email], (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({
          status: 'error',
          message: 'Database error'
        });
      }

      if (user) {
        // User exists, generate token
        const token = generateToken(user.id);

        db.close();
        // Redirect to frontend with token
        return res.redirect(`${process.env.FRONTEND_URL}/auth/google-callback?token=${token}`);
      }

      // User doesn't exist, create new user
      db.run(
        'INSERT INTO users (name, email, role) VALUES (?, ?, ?)',
        [data.name, data.email, 'user'],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({
              status: 'error',
              message: 'Could not create user'
            });
          }

          // Generate token
          const token = generateToken(this.lastID);

          db.close();
          // Redirect to frontend with token
          return res.redirect(`${process.env.FRONTEND_URL}/auth/google-callback?token=${token}`);
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get current user profile
exports.getCurrentUser = (req, res) => {
  // Remove password from user object
  const { password, ...user } = req.user;

  res.status(200).json({
    status: 'success',
    user
  });
};

// Update user profile
exports.updateProfile = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const { name, email } = req.body;
  const updateFields = [];
  const updateValues = [];

  // Add fields to update
  if (name) {
    updateFields.push('name = ?');
    updateValues.push(name);
  }

  if (email) {
    updateFields.push('email = ?');
    updateValues.push(email);
  }

  // Add current timestamp
  updateFields.push('updated_at = CURRENT_TIMESTAMP');

  // Add user ID for WHERE clause
  updateValues.push(req.user.id);

  if (updateFields.length === 1) {
    // Only updated_at would be changed, so no actual changes
    return res.status(400).json({
      status: 'error',
      message: 'No fields to update'
    });
  }

  try {
    const db = createDbConnection();

    // Check if email is already in use by another user
    if (email && email !== req.user.email) {
      db.get('SELECT * FROM users WHERE email = ? AND id != ?', [email, req.user.id], (err, user) => {
        if (err) {
          db.close();
          return res.status(500).json({
            status: 'error',
            message: 'Database error'
          });
        }

        if (user) {
          db.close();
          return res.status(400).json({
            status: 'error',
            message: 'Email already in use'
          });
        }

        // Update user profile
        updateUser();
      });
    } else {
      // Update user profile
      updateUser();
    }

    function updateUser() {
      const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

      db.run(updateQuery, updateValues, function(err) {
        if (err) {
          db.close();
          return res.status(500).json({
            status: 'error',
            message: 'Could not update profile'
          });
        }

        // Get updated user data
        db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, user) => {
          db.close();

          if (err || !user) {
            return res.status(500).json({
              status: 'error',
              message: 'Could not retrieve updated profile'
            });
          }

          // Remove password from user object
          const { password, ...userData } = user;

          res.status(200).json({
            status: 'success',
            user: userData
          });
        });
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      errors: errors.array()
    });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    const db = createDbConnection();

    // Get current user with password
    db.get('SELECT * FROM users WHERE id = ?', [req.user.id], async (err, user) => {
      if (err) {
        db.close();
        return res.status(500).json({
          status: 'error',
          message: 'Database error'
        });
      }

      if (!user) {
        db.close();
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      // Check if current password is correct
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        db.close();
        return res.status(401).json({
          status: 'error',
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update password
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, req.user.id],
        function(err) {
          db.close();

          if (err) {
            return res.status(500).json({
              status: 'error',
              message: 'Could not update password'
            });
          }

          res.status(200).json({
            status: 'success',
            message: 'Password updated successfully'
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
