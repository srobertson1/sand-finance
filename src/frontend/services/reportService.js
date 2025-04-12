import api from './api';

// Fetch all reports
export const fetchAllReports = async () => {
  try {
    const response = await api.get('/reports');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch a single report by ID
export const fetchReportById = async (reportId) => {
  try {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Create a new report
export const createReport = async (reportData) => {
  try {
    const response = await api.post('/reports', reportData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update an existing report
export const updateReport = async (reportId, reportData) => {
  try {
    const response = await api.put(`/reports/${reportId}`, reportData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a report
export const deleteReport = async (reportId) => {
  try {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Generate a new report from existing data
export const generateReport = async (reportParams) => {
  try {
    const response = await api.post('/reports/generate', reportParams);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export default {
  fetchAllReports,
  fetchReportById,
  createReport,
  updateReport,
  deleteReport,
  generateReport
};