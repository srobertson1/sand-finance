import React from 'react';
import { Link } from 'react-router-dom';

const RecentReportsPanel = ({ reports = [] }) => {
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Reports</h2>
        <Link to="/reports" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-10 w-10 mx-auto text-gray-400 mb-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="text-gray-500 mb-2">No reports yet</p>
          <Link 
            to="/reports/new" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Create New Report
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {reports.map(report => (
            <li key={report.id} className="py-3">
              <Link to={`/reports/${report.id}`} className="block hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                <div className="flex justify-between">
                  <div>
                    <h3 className="text-base font-medium text-gray-900">{report.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{report.description?.substring(0, 60) || "No description"}</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {report.report_type || "Report"}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(report.created_at)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentReportsPanel;