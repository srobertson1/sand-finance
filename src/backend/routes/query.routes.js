const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const queryController = require('../controllers/query.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all routes
router.use(authMiddleware.protect);

// Submit a natural language query
router.post(
  '/',
  [
    body('query').not().isEmpty().withMessage('Query text is required')
  ],
  queryController.submitQuery
);

// Get query history for the current user
router.get('/history', queryController.getQueryHistory);

// Get a specific query result by ID
router.get(
  '/:queryId',
  queryController.getQueryById
);

// Submit feedback for a query result
router.post(
  '/:queryId/feedback',
  [
    body('feedbackType').isIn(['helpful', 'not_helpful', 'incorrect']).withMessage('Invalid feedback type'),
    body('feedbackText').optional()
  ],
  queryController.submitFeedback
);

// Get suggested queries based on sheets metadata
router.get('/suggestions', queryController.getQuerySuggestions);

module.exports = router;
