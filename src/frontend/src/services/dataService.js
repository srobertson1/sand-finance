import api from './api';

// Fetch all data sheets
export const fetchAllSheets = async () => {
  try {
    const response = await api.get('/data/sheets');
    return response.data.data.sheets;
  } catch (error) {
    throw error;
  }
};

// Fetch a single sheet by ID
export const fetchSheetById = async (sheetId) => {
  try {
    const response = await api.get(`/data/sheets/${sheetId}`);
    return response.data.data.sheet;
  } catch (error) {
    throw error;
  }
};

// Add a new sheet
export const addSheet = async (sheetData) => {
  try {
    const response = await api.post('/data/sheets', sheetData);
    return response.data.data.sheet;
  } catch (error) {
    throw error;
  }
};

// Update sheet metadata
export const updateSheet = async (sheetId, sheetData) => {
  try {
    const response = await api.put(`/data/sheets/${sheetId}`, sheetData);
    return response.data.data.sheet;
  } catch (error) {
    throw error;
  }
};

// Delete a sheet
export const deleteSheet = async (sheetId) => {
  try {
    const response = await api.delete(`/data/sheets/${sheetId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Sync a sheet with the database
export const syncSheet = async (sheetId) => {
  try {
    const response = await api.post(`/data/sheets/${sheetId}/sync`);
    return response.data.data.sheet;
  } catch (error) {
    throw error;
  }
};

// Get columns for a sheet
export const getSheetColumns = async (sheetId) => {
  try {
    const response = await api.get(`/data/sheets/${sheetId}/columns`);
    return response.data.data.columns;
  } catch (error) {
    throw error;
  }
};

// Update column metadata
export const updateColumn = async (columnId, columnData) => {
  try {
    const response = await api.put(`/data/columns/${columnId}`, columnData);
    return response.data.data.column;
  } catch (error) {
    throw error;
  }
};

// Get sheet data
export const getSheetData = async (sheetId, range = '') => {
  try {
    const response = await api.get(`/data/sheets/${sheetId}/data`, {
      params: { range }
    });
    return response.data.data;
  } catch (error) {
    throw error;
  }
};

export default {
  fetchAllSheets,
  fetchSheetById,
  addSheet,
  updateSheet,
  deleteSheet,
  syncSheet,
  getSheetColumns,
  updateColumn,
  getSheetData
};