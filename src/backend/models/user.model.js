const { createDbConnection } = require('../../database/setup');
const bcrypt = require('bcrypt');

/**
 * User model for database interactions
 */
class User {
  // Create a new user
  static async create(userData) {
    const { email, password, name, role = 'user' } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const db = createDbConnection();
      
      db.run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, role],
        function(err) {
          if (err) {
            db.close();
            return reject(err);
          }
          
          // Return the created user without password
          db.get(
            'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
            [this.lastID],
            (err, user) => {
              db.close();
              if (err) return reject(err);
              resolve(user);
            }
          );
        }
      );
    });
  }
  
  // Find user by ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      const db = createDbConnection();
      
      db.get(
        'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
        [id],
        (err, user) => {
          db.close();
          if (err) return reject(err);
          resolve(user);
        }
      );
    });
  }
  
  // Find user by email (including password for authentication)
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      const db = createDbConnection();
      
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, user) => {
          db.close();
          if (err) return reject(err);
          resolve(user);
        }
      );
    });
  }
  
  // Update user profile
  static async update(id, updates) {
    const { name, email, role } = updates;
    
    const updateFields = [];
    const updateValues = [];
    
    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
    }
    
    if (role !== undefined) {
      updateFields.push('role = ?');
      updateValues.push(role);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Add updated_at timestamp and user ID
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    return new Promise((resolve, reject) => {
      const db = createDbConnection();
      
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
      
      db.run(query, updateValues, function(err) {
        if (err) {
          db.close();
          return reject(err);
        }
        
        // Get the updated user
        db.get(
          'SELECT id, email, name, role, created_at, updated_at FROM users WHERE id = ?',
          [id],
          (err, user) => {
            db.close();
            if (err) return reject(err);
            resolve(user);
          }
        );
      });
    });
  }
  
  // Change password
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return new Promise((resolve, reject) => {
      const db = createDbConnection();
      
      db.run(
        'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [hashedPassword, id],
        function(err) {
          db.close();
          if (err) return reject(err);
          resolve({ success: true, changes: this.changes });
        }
      );
    });
  }
  
  // Delete user
  static async delete(id) {
    return new Promise((resolve, reject) => {
      const db = createDbConnection();
      
      db.run(
        'DELETE FROM users WHERE id = ?',
        [id],
        function(err) {
          db.close();
          if (err) return reject(err);
          resolve({ success: true, deleted: this.changes > 0 });
        }
      );
    });
  }
}

module.exports = User;