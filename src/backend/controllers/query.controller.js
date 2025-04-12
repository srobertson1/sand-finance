const { validationResult } = require('express-validator');
const { createDbConnection } = require('../../database/setup');
const llmService = require('../services/llm.service');
const sheetsService = require('../services/sheets.service');

// Submit a natural language query
const submitQuery = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { query } = req.body;
    const userId = req.user.id; // From auth middleware
    
    // Get available sheets and columns for context
    const availableSheets = await sheetsService.getAllSheetsMetadata();
    
    // Build available columns by sheet
    const availableColumns = {};
    for (const sheet of availableSheets) {
      const columns = await sheetsService.getColumnMetadata(sheet.sheet_id);
      availableColumns[sheet.sheet_id] = columns;
    }
    
    // Interpret the query using LLM
    const interpretation = await llmService.interpretQuery(query, {
      availableSheets,
      availableColumns
    });
    
    // Save query to history
    const queryId = await saveQueryToHistory(userId, query, interpretation);
    
    // If the LLM couldn't determine a target sheet or needs clarification
    if (!interpretation.targetSheet || interpretation.needsClarification) {
      return res.status(200).json({
        status: 'success',
        data: {
          queryId,
          interpretation,
          needsClarification: true,
          clarificationQuestion: interpretation.clarificationQuestion || 'Which sheet would you like to query?'
        }
      });
    }
    
    // Fetch data from the identified sheet
    const sheetData = await fetchSheetDataForQuery(interpretation);
    
    // Generate insights based on the data
    let insights = null;
    if (sheetData.rows.length > 0) {
      const sheetMetadata = availableSheets.find(s => s.sheet_id === interpretation.targetSheet);
      const columnMetadata = availableColumns[interpretation.targetSheet];
      
      insights = await llmService.generateInsights(sheetData.rows, {
        sheetName: sheetMetadata?.name || 'Unknown sheet',
        columns: columnMetadata
      });
    }
    
    // Update query history with success status
    await updateQueryStatus(queryId, true);
    
    res.status(200).json({
      status: 'success',
      data: {
        queryId,
        interpretation,
        data: sheetData,
        insights
      }
    });
  } catch (error) {
    console.error('Error processing query:', error);
    
    // Try to save query with error if we're handling a user with ID
    if (req.user && req.user.id) {
      try {
        const queryId = await saveQueryToHistory(
          req.user.id,
          req.body.query,
          null,
          false,
          error.message
        );
      } catch (saveErr) {
        console.error('Error saving failed query to history:', saveErr);
      }
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to process query',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

// Helper function to save query to history
const saveQueryToHistory = async (userId, queryText, processedQuery = null, success = null, errorMessage = null) => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();
    
    // Convert processed query to string if it's an object
    let processedQueryStr = processedQuery;
    if (processedQuery && typeof processedQuery === 'object') {
      processedQueryStr = JSON.stringify(processedQuery);
    }
    
    db.run(
      'INSERT INTO query_history (user_id, query_text, processed_query, success, error_message) VALUES (?, ?, ?, ?, ?)',
      [userId, queryText, processedQueryStr, success, errorMessage],
      function(err) {
        db.close();
        if (err) return reject(err);
        resolve(this.lastID);
      }
    );
  });
};

// Helper function to update query status
const updateQueryStatus = async (queryId, success, errorMessage = null) => {
  return new Promise((resolve, reject) => {
    const db = createDbConnection();
    
    db.run(
      'UPDATE query_history SET success = ?, error_message = ? WHERE id = ?',
      [success, errorMessage, queryId],
      function(err) {
        db.close();
        if (err) return reject(err);
        resolve(this.changes > 0);
      }
    );
  });
};

// Helper function to fetch sheet data for a query
const fetchSheetDataForQuery = async (interpretation) => {
  // Get sheet data
  const data = await sheetsService.getSheetData(interpretation.targetSheet);
  
  // Format data with headers
  const formattedData = data.length > 0 
    ? formatSheetData(data) 
    : { headers: [], rows: [] };
  
  // Apply filters if specified in the interpretation
  let filteredRows = formattedData.rows;
  
  if (interpretation.filters && interpretation.filters.length > 0) {
    filteredRows = formattedData.rows.filter(row => {
      return interpretation.filters.every(filter => {
        // Simple implementation of basic filters
        // Can be expanded for more complex filtering logic
        const { column, operator, value } = filter;
        
        if (!row[column]) return false;
        
        switch (operator) {
          case 'equals':
            return row[column] == value;
          case 'contains':
            return String(row[column]).toLowerCase().includes(String(value).toLowerCase());
          case 'greater_than':
            return Number(row[column]) > Number(value);
          case 'less_than':
            return Number(row[column]) < Number(value);
          case 'not_equals':
            return row[column] != value;
          default:
            return true;
        }
      });
    });
  }
  
  // Apply sorting if specified
  if (interpretation.sorting) {
    const { column, direction } = interpretation.sorting;
    
    filteredRows.sort((a, b) => {
      // Handle numeric sorting
      if (!isNaN(Number(a[column])) && !isNaN(Number(b[column]))) {
        return direction === 'asc' 
          ? Number(a[column]) - Number(b[column])
          : Number(b[column]) - Number(a[column]);
      }
      
      // Handle string sorting
      const aVal = String(a[column] || '').toLowerCase();
      const bVal = String(b[column] || '').toLowerCase();
      
      return direction === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    });
  }
  
  // Apply aggregation if specified
  let aggregatedData = filteredRows;
  
  if (interpretation.aggregation) {
    const { function: aggFunction, column } = interpretation.aggregation;
    
    switch (aggFunction) {
      case 'sum':
        const sum = filteredRows.reduce((acc, row) => acc + Number(row[column] || 0), 0);
        aggregatedData = [{ [column]: sum, aggregation: `Sum of ${column}` }];
        break;
      case 'average':
        const avg = filteredRows.length 
          ? filteredRows.reduce((acc, row) => acc + Number(row[column] || 0), 0) / filteredRows.length
          : 0;
        aggregatedData = [{ [column]: avg, aggregation: `Average of ${column}` }];
        break;
      case 'count':
        aggregatedData = [{ count: filteredRows.length, aggregation: 'Count' }];
        break;
      case 'min':
        const min = filteredRows.length 
          ? Math.min(...filteredRows.map(row => Number(row[column] || 0)))
          : 0;
        aggregatedData = [{ [column]: min, aggregation: `Minimum of ${column}` }];
        break;
      case 'max':
        const max = filteredRows.length 
          ? Math.max(...filteredRows.map(row => Number(row[column] || 0)))
          : 0;
        aggregatedData = [{ [column]: max, aggregation: `Maximum of ${column}` }];
        break;
      default:
        // No aggregation
        break;
    }
  }
  
  return {
    headers: formattedData.headers,
    rows: aggregatedData,
    totalCount: formattedData.rows.length,
    filteredCount: filteredRows.length
  };
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

// Get query history for a user
const getQueryHistory = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    
    const db = createDbConnection();
    
    db.all(
      'SELECT * FROM query_history WHERE user_id = ? ORDER BY executed_at DESC LIMIT 50',
      [userId],
      (err, queries) => {
        db.close();
        
        if (err) {
          console.error('Error fetching query history:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch query history'
          });
        }
        
        res.status(200).json({
          status: 'success',
          data: {
            queries
          }
        });
      }
    );
  } catch (error) {
    console.error('Error fetching query history:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch query history'
    });
  }
};

// Get a specific query by ID
const getQueryById = async (req, res) => {
  try {
    const { queryId } = req.params;
    const userId = req.user.id; // From auth middleware
    
    const db = createDbConnection();
    
    db.get(
      'SELECT * FROM query_history WHERE id = ? AND user_id = ?',
      [queryId, userId],
      async (err, query) => {
        db.close();
        
        if (err) {
          console.error('Error fetching query:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to fetch query'
          });
        }
        
        if (!query) {
          return res.status(404).json({
            status: 'fail',
            message: 'Query not found'
          });
        }
        
        // Parse processed query if it's a string
        try {
          if (query.processed_query && typeof query.processed_query === 'string') {
            query.processed_query = JSON.parse(query.processed_query);
          }
        } catch (parseErr) {
          console.error('Error parsing processed query:', parseErr);
        }
        
        // Re-execute the query to get latest data
        let data = null;
        let insights = null;
        
        if (query.processed_query && query.processed_query.targetSheet) {
          try {
            // Fetch data from the identified sheet
            data = await fetchSheetDataForQuery(query.processed_query);
            
            // Generate insights if we have data
            if (data.rows.length > 0) {
              // Get available sheets and columns for context
              const availableSheets = await sheetsService.getAllSheetsMetadata();
              const sheetMetadata = availableSheets.find(
                s => s.sheet_id === query.processed_query.targetSheet
              );
              
              const columnMetadata = await sheetsService.getColumnMetadata(
                query.processed_query.targetSheet
              );
              
              insights = await llmService.generateInsights(data.rows, {
                sheetName: sheetMetadata?.name || 'Unknown sheet',
                columns: columnMetadata
              });
            }
          } catch (execErr) {
            console.error('Error re-executing query:', execErr);
          }
        }
        
        res.status(200).json({
          status: 'success',
          data: {
            query,
            data,
            insights
          }
        });
      }
    );
  } catch (error) {
    console.error('Error fetching query:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch query'
    });
  }
};

// Submit feedback for a query
const submitFeedback = async (req, res) => {
  // Validate request data
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'fail',
      errors: errors.array()
    });
  }
  
  try {
    const { queryId } = req.params;
    const { feedbackType, feedbackText } = req.body;
    const userId = req.user.id; // From auth middleware
    
    // Save feedback to database
    const db = createDbConnection();
    
    db.run(
      'INSERT INTO user_feedback (query_id, user_id, feedback_type, feedback_text) VALUES (?, ?, ?, ?)',
      [queryId, userId, feedbackType, feedbackText],
      async function(err) {
        db.close();
        
        if (err) {
          console.error('Error saving feedback:', err);
          return res.status(500).json({
            status: 'error',
            message: 'Failed to save feedback'
          });
        }
        
        // Use the LLM service to learn from this feedback
        try {
          await llmService.learnFromFeedback(queryId, feedbackType, feedbackText);
        } catch (learnErr) {
          console.error('Error learning from feedback:', learnErr);
          // Continue even if learning fails
        }
        
        res.status(201).json({
          status: 'success',
          data: {
            feedbackId: this.lastID,
            message: 'Feedback submitted successfully'
          }
        });
      }
    );
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit feedback'
    });
  }
};

// Get query suggestions
const getQuerySuggestions = async (req, res) => {
  try {
    // Get available sheets and columns for context
    const availableSheets = await sheetsService.getAllSheetsMetadata();
    
    // Build available columns by sheet
    const availableColumns = {};
    for (const sheet of availableSheets) {
      const columns = await sheetsService.getColumnMetadata(sheet.sheet_id);
      availableColumns[sheet.sheet_id] = columns;
    }
    
    // Generate suggestions from LLM
    const suggestions = await llmService.getSuggestedQueries(
      availableSheets,
      availableColumns
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('Error getting query suggestions:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get query suggestions'
    });
  }
};

module.exports = {
  submitQuery,
  getQueryHistory,
  getQueryById,
  submitFeedback,
  getQuerySuggestions
};