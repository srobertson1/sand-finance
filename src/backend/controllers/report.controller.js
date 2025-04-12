const { validationResult } = require('express-validator');
const { createDbConnection } = require('../../database/setup');
const llmService = require('../services/llm.service');
const sheetsService = require('../services/sheets.service');

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const db = createDbConnection();
    
    // Admin users can see all reports, regular users only see their own
    const query = req.user.role === 'admin' 
      ? 'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id ORDER BY r.created_at DESC'
      : 'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id WHERE r.created_by = ? ORDER BY r.created_at DESC';
    
    const params = req.user.role === 'admin' ? [] : [userId];
    
    db.all(query, params, (err, reports) => {
      db.close();
      
      if (err) {
        console.error('Error fetching reports:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to fetch reports'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          reports
        }
      });
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reports'
    });
  }
};

// Create a new report
const createReport = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { title, description = '', reportType, content = '' } = req.body;
    const userId = req.user.id;
    
    const db = createDbConnection();
    
    db.run(
      'INSERT INTO reports (title, description, report_type, content, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description, reportType, content, userId],
      function(err) {
        if (err) {
          db.close();
          console.error('Error creating report:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to create report'
          });
        }
        
        const reportId = this.lastID;
        
        // Get the created report
        db.get(
          'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?',
          [reportId],
          (err, report) => {
            db.close();
            
            if (err) {
              console.error('Error fetching created report:', err);
              return res.status(500).json({
                status: 'error',
                message: 'Report created but failed to fetch details'
              });
            }
            
            res.status(201).json({
              status: 'success',
              data: {
                report
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create report'
    });
  }
};

// Get a single report by ID
const getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    
    const db = createDbConnection();
    
    // Query to get report with creator info
    const query = req.user.role === 'admin'
      ? 'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?'
      : 'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ? AND (r.created_by = ? OR r.is_public = 1)';
    
    const params = req.user.role === 'admin' ? [reportId] : [reportId, userId];
    
    db.get(query, params, (err, report) => {
      db.close();
      
      if (err) {
        console.error('Error fetching report:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to fetch report'
        });
      }
      
      if (!report) {
        return res.status(404).json({
          status: 'fail',
          message: 'Report not found or access denied'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: {
          report
        }
      });
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch report'
    });
  }
};

// Update a report
const updateReport = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { reportId } = req.params;
    const { title, description, content } = req.body;
    const userId = req.user.id;
    
    // Check if report exists and user has access
    const db = createDbConnection();
    
    db.get(
      'SELECT * FROM reports WHERE id = ?',
      [reportId],
      (err, report) => {
        if (err) {
          db.close();
          console.error('Error checking report access:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to check report access'
          });
        }
        
        if (!report) {
          db.close();
          return res.status(404).json({
            status: 'fail',
            message: 'Report not found'
          });
        }
        
        // Check if user is allowed to update
        if (report.created_by !== userId && req.user.role !== 'admin') {
          db.close();
          return res.status(403).json({
            status: 'fail',
            message: 'You do not have permission to update this report'
          });
        }
        
        // Prepare update data
        const updateFields = [];
        const updateValues = [];
        
        if (title !== undefined) {
          updateFields.push('title = ?');
          updateValues.push(title);
        }
        
        if (description !== undefined) {
          updateFields.push('description = ?');
          updateValues.push(description);
        }
        
        if (content !== undefined) {
          updateFields.push('content = ?');
          updateValues.push(content);
        }
        
        if (updateFields.length === 0) {
          db.close();
          return res.status(400).json({
            status: 'fail',
            message: 'No fields to update'
          });
        }
        
        // Add updated_at timestamp and report ID
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(reportId);
        
        // Update the report
        const query = `UPDATE reports SET ${updateFields.join(', ')} WHERE id = ?`;
        
        db.run(query, updateValues, function(err) {
          if (err) {
            db.close();
            console.error('Error updating report:', err);
            return res.status(500).json({
              status: 'error',
              message: 'Failed to update report'
            });
          }
          
          // Get the updated report
          db.get(
            'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?',
            [reportId],
            (err, updatedReport) => {
              db.close();
              
              if (err) {
                console.error('Error fetching updated report:', err);
                return res.status(500).json({
                  status: 'error',
                  message: 'Report updated but failed to fetch details'
                });
              }
              
              res.status(200).json({
                status: 'success',
                data: {
                  report: updatedReport
                }
              });
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update report'
    });
  }
};

// Delete a report
const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user.id;
    
    const db = createDbConnection();
    
    // Check if report exists and user has access
    db.get(
      'SELECT * FROM reports WHERE id = ?',
      [reportId],
      (err, report) => {
        if (err) {
          db.close();
          console.error('Error checking report access:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to check report access'
          });
        }
        
        if (!report) {
          db.close();
          return res.status(404).json({
            status: 'fail',
            message: 'Report not found'
          });
        }
        
        // Check if user is allowed to delete
        if (report.created_by !== userId && req.user.role !== 'admin') {
          db.close();
          return res.status(403).json({
            status: 'fail',
            message: 'You do not have permission to delete this report'
          });
        }
        
        // Delete the report
        db.run(
          'DELETE FROM reports WHERE id = ?',
          [reportId],
          function(err) {
            db.close();
            
            if (err) {
              console.error('Error deleting report:', err);
              return res.status(500).json({
                status: 'error',
                message: 'Failed to delete report'
              });
            }
            
            res.status(200).json({
              status: 'success',
              message: 'Report deleted successfully'
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete report'
    });
  }
};

// Generate a report using LLM and financial data
const generateReport = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { reportType, title, description = '', parameters = {} } = req.body;
    const userId = req.user.id;
    
    // Get data for the report
    let reportData = [];
    
    // If target sheets are specified, fetch the data
    if (parameters.sheets && parameters.sheets.length > 0) {
      for (const sheetId of parameters.sheets) {
        try {
          // Fetch the sheet data
          const data = await sheetsService.getSheetData(sheetId);
          
          // Format data
          if (data.length > 0) {
            const formattedData = formatSheetData(data);
            reportData.push({
              sheetId,
              data: formattedData.rows
            });
          }
        } catch (sheetErr) {
          console.error(`Error fetching data for sheet ${sheetId}:`, sheetErr);
        }
      }
    }
    
    // Generate the report content using LLM
    const reportContent = await llmService.generateReport(
      reportType,
      reportData,
      parameters
    );
    
    // Save the report to the database
    const db = createDbConnection();
    
    db.run(
      'INSERT INTO reports (title, description, report_type, content, created_by) VALUES (?, ?, ?, ?, ?)',
      [title, description, reportType, reportContent, userId],
      function(err) {
        if (err) {
          db.close();
          console.error('Error saving generated report:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Report generated but failed to save'
          });
        }
        
        const reportId = this.lastID;
        
        // Get the created report
        db.get(
          'SELECT r.*, u.name as creator_name FROM reports r LEFT JOIN users u ON r.created_by = u.id WHERE r.id = ?',
          [reportId],
          (err, report) => {
            db.close();
            
            if (err) {
              console.error('Error fetching created report:', err);
              return res.status(500).json({
                status: 'error',
                message: 'Report created but failed to fetch details'
              });
            }
            
            res.status(201).json({
              status: 'success',
              data: {
                report
              }
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate report',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

// Helper function to format sheet data
const formatSheetData = (data) => {
  const headers = data[0] || [];
  const rows = [];
  
  // Convert rows to objects with column names as keys
  for (let i = 1; i < data.length; i++) {
    const row = {};
    data[i].forEach((cell, index) => {
      if (index < headers.length) {
        row[headers[index]] = cell;
      }
    });
    rows.push(row);
  }
  
  return { headers, rows };
};

module.exports = {
  getAllReports,
  createReport,
  getReportById,
  updateReport,
  deleteReport,
  generateReport
};