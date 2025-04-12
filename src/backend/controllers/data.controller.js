const { validationResult } = require('express-validator');
const sheetsService = require('../services/sheets.service');

// Get all sheets metadata
const getAllSheets = async (req, res) => {
  try {
    const sheets = await sheetsService.getAllSheetsMetadata();
    res.status(200).json({
      status: 'success',
      data: {
        sheets
      }
    });
  } catch (error) {
    console.error('Error fetching sheets metadata:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sheets metadata'
    });
  }
};

// Get a sheet by ID
const getSheetById = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const sheet = await sheetsService.getSheetById(sheetId);
    
    if (!sheet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sheet not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        sheet
      }
    });
  } catch (error) {
    console.error('Error fetching sheet by ID:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sheet'
    });
  }
};

// Add a new sheet
const addSheet = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { sheetId, name, description = '', accessLevel = 'read' } = req.body;
    
    // Check if the sheet exists in Google Sheets first
    try {
      await sheetsService.getSheetMetadata(sheetId);
    } catch (error) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid Google Sheet ID or sheet not accessible'
      });
    }
    
    // Save the sheet metadata
    const sheetMetadata = await sheetsService.saveSheetMetadata(
      sheetId,
      name,
      description,
      accessLevel
    );
    
    res.status(201).json({
      status: 'success',
      data: {
        sheet: sheetMetadata
      }
    });
  } catch (error) {
    console.error('Error adding sheet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add sheet'
    });
  }
};

// Update sheet metadata
const updateSheet = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { sheetId } = req.params;
    const { name, description, accessLevel } = req.body;
    
    // Check if sheet exists
    const existingSheet = await sheetsService.getSheetById(sheetId);
    if (!existingSheet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sheet not found'
      });
    }
    
    // Prepare update data
    const updateData = {
      name: name || existingSheet.name,
      description: description !== undefined ? description : existingSheet.description,
      accessLevel: accessLevel || existingSheet.access_level
    };
    
    // Update the sheet
    const updatedSheet = await sheetsService.saveSheetMetadata(
      sheetId,
      updateData.name,
      updateData.description,
      updateData.accessLevel
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        sheet: updatedSheet
      }
    });
  } catch (error) {
    console.error('Error updating sheet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update sheet'
    });
  }
};

// Delete a sheet
const deleteSheet = async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    // Check if sheet exists
    const existingSheet = await sheetsService.getSheetById(sheetId);
    if (!existingSheet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sheet not found'
      });
    }
    
    // Delete the sheet
    await sheetsService.deleteSheet(sheetId);
    
    res.status(200).json({
      status: 'success',
      message: 'Sheet deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting sheet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete sheet'
    });
  }
};

// Sync sheet with database
const syncSheet = async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    // Check if sheet exists
    const existingSheet = await sheetsService.getSheetById(sheetId);
    if (!existingSheet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sheet not found'
      });
    }
    
    // Sync the sheet
    const syncResult = await sheetsService.syncSheetWithDatabase(sheetId);
    
    res.status(200).json({
      status: 'success',
      data: {
        sheet: syncResult
      }
    });
  } catch (error) {
    console.error('Error syncing sheet:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to sync sheet'
    });
  }
};

// Get columns for a sheet
const getSheetColumns = async (req, res) => {
  try {
    const { sheetId } = req.params;
    
    // Check if sheet exists
    const existingSheet = await sheetsService.getSheetById(sheetId);
    if (!existingSheet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sheet not found'
      });
    }
    
    // Get columns
    const columns = await sheetsService.getColumnMetadata(sheetId);
    
    res.status(200).json({
      status: 'success',
      data: {
        columns
      }
    });
  } catch (error) {
    console.error('Error fetching sheet columns:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch columns'
    });
  }
};

// Update column metadata
const updateColumn = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { columnId } = req.params;
    const { displayName, dataType, description } = req.body;
    
    // Update the column
    const updatedColumn = await sheetsService.updateColumnMetadata(
      columnId,
      { displayName, dataType, description }
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        column: updatedColumn
      }
    });
  } catch (error) {
    console.error('Error updating column:', error);
    
    if (error.message === 'Column not found') {
      return res.status(404).json({
        status: 'fail',
        message: 'Column not found'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to update column'
    });
  }
};

// Get sheet data
const getSheetData = async (req, res) => {
  try {
    const { sheetId } = req.params;
    const { range } = req.query;
    
    // Check if sheet exists
    const existingSheet = await sheetsService.getSheetById(sheetId);
    if (!existingSheet) {
      return res.status(404).json({
        status: 'fail',
        message: 'Sheet not found'
      });
    }
    
    // Get data
    const data = await sheetsService.getSheetData(sheetId, range);
    
    // Format data with headers
    const formattedData = data.length > 1 
      ? formatSheetData(data) 
      : { headers: data[0] || [], rows: [] };
    
    res.status(200).json({
      status: 'success',
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch sheet data'
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
  getAllSheets,
  getSheetById,
  addSheet,
  updateSheet,
  deleteSheet,
  syncSheet,
  getSheetColumns,
  updateColumn,
  getSheetData
};