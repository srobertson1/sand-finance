import React, { useState, useEffect } from 'react';
import MetricsPanel from './MetricsPanel';
import InsightsPanel from './InsightsPanel';
import RecentReportsPanel from './RecentReportsPanel';
import QueryHistoryPanel from './QueryHistoryPanel';
import { fetchDashboardData } from '../../services/dashboardService';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    metrics: [],
    insights: [],
    recentReports: [],
    queryHistory: []
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Dashboard...</h2>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Financial Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <MetricsPanel metrics={dashboardData.metrics} />
        <InsightsPanel insights={dashboardData.insights} />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentReportsPanel reports={dashboardData.recentReports} />
        <QueryHistoryPanel queryHistory={dashboardData.queryHistory} />
      </div>
    </div>
  );
};

export default Dashboard;
