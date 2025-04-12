const { google } = require('googleapis');
const { createDbConnection } = require('../../database/setup');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from external keys directory
dotenv.config({ path: '/home/simrob1729/keys/.env' });

// Initialize Google Sheets API
const initSheetsApi = async () => {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
};

// Get sheet data from Google Sheets
const getSheetData = async (sheetId, range = '') => {
  try {
    const sheets = await initSheetsApi();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range || 'A1:Z1000', // Default range if not specified
    });

    return response.data.values;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
};

// Get sheet metadata from Google Sheets
const getSheetMetadata = async (sheetId) => {
  try {
    const sheets = await initSheetsApi();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: 'properties,sheets.properties'
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching sheet metadata:', error);
    throw error;
  }
};

// Save sheet metadata to database
const saveSheetMetadata = async (sheetId, name, description = '', accessLevel = 'read') => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();

    // Check if sheet already exists
    db.get('SELECT * FROM sheet_metadata WHERE sheet_id = ?', [sheetId], (err, row) => {
      if (err) {
        db.close();
        return reject(err);
      }

      if (row) {
        // Update existing sheet
        db.run(
          'UPDATE sheet_metadata SET name = ?, description = ?, access_level = ?, updated_at = CURRENT_TIMESTAMP WHERE sheet_id = ?',
          [name, description, accessLevel, sheetId],
          function(err) {
            db.close();
            if (err) return reject(err);
            resolve({ id: row.id, sheetId, name, description, accessLevel });
          }
        );
      } else {
        // Insert new sheet
        db.run(
          'INSERT INTO sheet_metadata (sheet_id, name, description, access_level) VALUES (?, ?, ?, ?)',
          [sheetId, name, description, accessLevel],
          function(err) {
            db.close();
            if (err) return reject(err);
            resolve({ id: this.lastID, sheetId, name, description, accessLevel });
          }
        );
      }
    });
  });
};

// Save column metadata to database
const saveColumnMetadata = async (sheetId, columns) => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();

    db.serialize(() => {
      // Begin transaction
      db.run('BEGIN TRANSACTION');

      // For each column, insert or update metadata
      const promises = columns.map(column => {
        return new Promise((resolveColumn, rejectColumn) => {
          const { columnName, displayName, dataType, description } = column;

          // Check if column already exists
          db.get(
            'SELECT * FROM column_metadata WHERE sheet_id = ? AND column_name = ?',
            [sheetId, columnName],
            (err, row) => {
              if (err) return rejectColumn(err);

              if (row) {
                // Update existing column
                db.run(
                  'UPDATE column_metadata SET display_name = ?, data_type = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                  [displayName, dataType, description, row.id],
                  (err) => {
                    if (err) return rejectColumn(err);
                    resolveColumn({ id: row.id, ...column });
                  }
                );
              } else {
                // Insert new column
                db.run(
                  'INSERT INTO column_metadata (sheet_id, column_name, display_name, data_type, description) VALUES (?, ?, ?, ?, ?)',
                  [sheetId, columnName, displayName, dataType, description],
                  function(err) {
                    if (err) return rejectColumn(err);
                    resolveColumn({ id: this.lastID, ...column });
                  }
                );
              }
            }
          );
        });
      });

      // Wait for all columns to be processed
      Promise.all(promises)
        .then(results => {
          // Commit transaction
          db.run('COMMIT', (err) => {
            db.close();
            if (err) return reject(err);
            resolve(results);
          });
        })
        .catch(err => {
          // Rollback on error
          db.run('ROLLBACK', () => {
            db.close();
            reject(err);
          });
        });
    });
  });
};

// Get all sheets metadata from database
const getAllSheetsMetadata = async () => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();
    db.all('SELECT * FROM sheet_metadata ORDER BY updated_at DESC', [], (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

// Get sheet by ID from database
const getSheetById = async (sheetId) => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();
    db.get('SELECT * FROM sheet_metadata WHERE sheet_id = ?', [sheetId], (err, row) => {
      db.close();
      if (err) return reject(err);
      if (!row) return resolve(null);
      resolve(row);
    });
  });
};

// Sync sheet data with database
const syncSheetWithDatabase = async (sheetId) => {
  try {
    // Get sheet metadata from Google
    const sheetMetadata = await getSheetMetadata(sheetId);
    const sheetName = sheetMetadata.properties.title;

    // Get header row to determine columns
    const data = await getSheetData(sheetId, 'A1:Z1');
    const headerRow = data[0];

    // Get sample data row to infer data types
    let dataTypes = [];
    if (data.length > 1) {
      const sampleRow = data[1];
      dataTypes = sampleRow.map(item => {
        if (!isNaN(Number(item))) return 'number';
        if (/^\d{4}-\d{2}-\d{2}/.test(item)) return 'date';
        return 'string';
      });
    } else {
      // Default to string if no data row available
      dataTypes = headerRow.map(() => 'string');
    }

    // Prepare column metadata
    const columnMetadata = headerRow.map((col, index) => ({
      columnName: col,
      displayName: col,
      dataType: dataTypes[index] || 'string',
      description: ''
    }));

    // Update the last_synced timestamp
    const db = createDbConnection();
    db.run(
      'UPDATE sheet_metadata SET last_synced = CURRENT_TIMESTAMP WHERE sheet_id = ?',
      [sheetId],
      (err) => {
        db.close();
        if (err) console.error('Error updating last_synced timestamp:', err);
      }
    );

    // Save column metadata
    await saveColumnMetadata(sheetId, columnMetadata);

    return { 
      sheetId, 
      name: sheetName, 
      columns: columnMetadata, 
      rowCount: data.length - 1 // Exclude header row
    };
  } catch (error) {
    console.error('Error syncing sheet with database:', error);
    throw error;
  }
};

// Get column metadata for a sheet
const getColumnMetadata = async (sheetId) => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();
    db.all(
      'SELECT * FROM column_metadata WHERE sheet_id = ? ORDER BY id',
      [sheetId],
      (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      }
    );
  });
};

// Update column metadata
const updateColumnMetadata = async (columnId, updates) => {
  const { displayName, dataType, description } = updates;
  const updateFields = [];
  const updateValues = [];

  if (displayName !== undefined) {
    updateFields.push('display_name = ?');
    updateValues.push(displayName);
  }

  if (dataType !== undefined) {
    updateFields.push('data_type = ?');
    updateValues.push(dataType);
  }

  if (description !== undefined) {
    updateFields.push('description = ?');
    updateValues.push(description);
  }

  if (updateFields.length === 0) {
    throw new Error('No fields to update');
  }

  // Add timestamp and column ID
  updateFields.push('updated_at = CURRENT_TIMESTAMP');
  updateValues.push(columnId);

  return new Promise((resolve, reject) => {
    const db = createDbConnection();
    const query = `UPDATE column_metadata SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, updateValues, function(err) {
      if (err) {
        db.close();
        return reject(err);
      }

      if (this.changes === 0) {
        db.close();
        return reject(new Error('Column not found'));
      }

      // Get the updated column
      db.get('SELECT * FROM column_metadata WHERE id = ?', [columnId], (err, row) => {
        db.close();
        if (err) return reject(err);
        if (!row) return reject(new Error('Column not found after update'));
        resolve(row);
      });
    });
  });
};

// Delete a sheet and its related metadata
const deleteSheet = async (sheetId) => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();

    db.serialize(() => {
      // Begin transaction
      db.run('BEGIN TRANSACTION');

      // Delete column metadata first (foreign key constraint)
      db.run('DELETE FROM column_metadata WHERE sheet_id = ?', [sheetId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          db.close();
          return reject(err);
        }

        // Then delete the sheet metadata
        db.run('DELETE FROM sheet_metadata WHERE sheet_id = ?', [sheetId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            return reject(err);
          }

          // Commit transaction
          db.run('COMMIT', (err) => {
            db.close();
            if (err) return reject(err);
            resolve({ success: true, deletedRows: this.changes });
          });
        });
      });
    });
  });
};

module.exports = {
  getSheetData,
  getSheetMetadata,
  saveSheetMetadata,
  saveColumnMetadata,
  getAllSheetsMetadata,
  getSheetById,
  syncSheetWithDatabase,
  getColumnMetadata,
  updateColumnMetadata,
  deleteSheet
};
