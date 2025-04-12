const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all routes
router.use(authMiddleware.protect);

// Get all reports
router.get('/', reportController.getAllReports);

// Create a new report
router.post(
  '/',
  [
    body('title').not().isEmpty().withMessage('Report title is required'),
    body('description').optional(),
    body('reportType').not().isEmpty().withMessage('Report type is required'),
    body('content').optional()
  ],
  reportController.createReport
);

// Get a single report
router.get(
  '/:reportId',
  param('reportId').isNumeric().withMessage('Report ID must be a number'),
  reportController.getReportById
);

// Update a report
router.put(
  '/:reportId',
  [
    param('reportId').isNumeric().withMessage('Report ID must be a number'),
    body('title').optional(),
    body('description').optional(),
    body('content').optional()
  ],
  reportController.updateReport
);

// Delete a report
router.delete(
  '/:reportId',
  param('reportId').isNumeric().withMessage('Report ID must be a number'),
  reportController.deleteReport
);

// Generate a new report from existing data
router.post(
  '/generate',
  [
    body('reportType').not().isEmpty().withMessage('Report type is required'),
    body('title').not().isEmpty().withMessage('Report title is required'),
    body('description').optional(),
    body('parameters').optional()
  ],
  reportController.generateReport
);

module.exports = router;
