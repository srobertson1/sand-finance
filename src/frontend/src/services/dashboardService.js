import api from './api';

// Fetch dashboard data
export const fetchDashboardData = async () => {
  try {
    // In a real implementation, this would be a single API call
    // For now, we'll collect data from different endpoints
    
    // Get recent reports
    const reportsResponse = await api.get('/reports?limit=3');
    const recentReports = reportsResponse.data.data.reports || [];
    
    // Get query history
    const queryHistoryResponse = await api.get('/query/history?limit=5');
    const queryHistory = queryHistoryResponse.data.data.queries || [];
    
    // Get available data sources
    const sheetsResponse = await api.get('/data/sheets');
    const sheets = sheetsResponse.data.data.sheets || [];
    
    // For the metrics and insights, in a real app we would have specific endpoints
    // For now, we'll return dummy data
    const metrics = [
      { id: 1, name: 'Total Revenue', value: '$124,500', change: '+12%', trend: 'up' },
      { id: 2, name: 'Expenses', value: '$67,200', change: '+5%', trend: 'up' },
      { id: 3, name: 'Profit Margin', value: '45.8%', change: '+3.2%', trend: 'up' },
      { id: 4, name: 'Cash Flow', value: '$32,700', change: '-2%', trend: 'down' }
    ];
    
    const insights = [
      { id: 1, text: 'Revenue growth has increased by 12% compared to previous month' },
      { id: 2, text: 'Marketing expenses have exceeded the monthly budget by 7%' },
      { id: 3, text: 'Customer acquisition cost has decreased by 15% this quarter' }
    ];
    
    return {
      metrics,
      insights,
      recentReports,
      queryHistory,
      sheets,
      reportCount: recentReports.length,
      queryCount: queryHistory.length
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    // Return empty data on error
    return {
      metrics: [],
      insights: [],
      recentReports: [],
      queryHistory: [],
      sheets: [],
      reportCount: 0,
      queryCount: 0
    };
  }
};

export default {
  fetchDashboardData
};