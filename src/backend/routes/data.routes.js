const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const dataController = require('../controllers/data.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all routes
router.use(authMiddleware.protect);

// Get all sheets metadata
router.get('/sheets', dataController.getAllSheets);

// Get a single sheet metadata
router.get('/sheets/:sheetId', dataController.getSheetById);

// Add a new sheet
router.post(
  '/sheets',
  [
    body('sheetId').not().isEmpty().withMessage('Google Sheet ID is required'),
    body('name').not().isEmpty().withMessage('Sheet name is required'),
    body('description').optional()
  ],
  dataController.addSheet
);

// Update sheet metadata
router.put(
  '/sheets/:sheetId',
  [
    param('sheetId').not().isEmpty().withMessage('Sheet ID is required'),
    body('name').optional(),
    body('description').optional(),
    body('accessLevel').optional()
  ],
  dataController.updateSheet
);

// Delete a sheet
router.delete(
  '/sheets/:sheetId',
  param('sheetId').not().isEmpty().withMessage('Sheet ID is required'),
  dataController.deleteSheet
);

// Sync data from Google Sheet
router.post(
  '/sheets/:sheetId/sync',
  param('sheetId').not().isEmpty().withMessage('Sheet ID is required'),
  dataController.syncSheet
);

// Get column metadata for a sheet
router.get(
  '/sheets/:sheetId/columns',
  param('sheetId').not().isEmpty().withMessage('Sheet ID is required'),
  dataController.getSheetColumns
);

// Update column metadata
router.put(
  '/columns/:columnId',
  [
    param('columnId').isNumeric().withMessage('Column ID must be a number'),
    body('displayName').optional(),
    body('dataType').optional(),
    body('description').optional()
  ],
  dataController.updateColumn
);

// Get sheet data
router.get(
  '/sheets/:sheetId/data',
  [
    param('sheetId').not().isEmpty().withMessage('Sheet ID is required'),
    body('range').optional(),
    body('limit').optional().isNumeric().withMessage('Limit must be a number')
  ],
  dataController.getSheetData
);

module.exports = router;
