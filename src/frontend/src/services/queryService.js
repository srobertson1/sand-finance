import api from './api';

// Submit a natural language query
export const submitQuery = async (query) => {
  try {
    const response = await api.post('/query', { query });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Get query history
export const getQueryHistory = async () => {
  try {
    const response = await api.get('/query/history');
    return response.data.data.queries;
  } catch (error) {
    throw error;
  }
};

// Get a specific query result by ID
export const getQueryById = async (queryId) => {
  try {
    const response = await api.get(`/query/${queryId}`);
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

// Submit feedback for a query result
export const submitFeedback = async (queryId, feedbackType, feedbackText = '') => {
  try {
    const response = await api.post(`/query/${queryId}/feedback`, {
      feedbackType,
      feedbackText
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get suggested queries based on available data
export const fetchQuerySuggestions = async () => {
  try {
    const response = await api.get('/query/suggestions');
    return response.data.data.suggestions;
  } catch (error) {
    console.error('Error fetching query suggestions:', error);
    return []; // Return empty array on error
  }
};

export default {
  submitQuery,
  getQueryHistory,
  getQueryById,
  submitFeedback,
  fetchQuerySuggestions
};