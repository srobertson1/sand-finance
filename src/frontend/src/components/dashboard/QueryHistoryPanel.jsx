import React from 'react';
import { Link } from 'react-router-dom';

const QueryHistoryPanel = ({ queryHistory = [] }) => {
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (success) => {
    return success 
      ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Success</span>
      : <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recent Queries</h2>
        <Link to="/query/history" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          View All
        </Link>
      </div>

      {queryHistory.length === 0 ? (
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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
          <p className="text-gray-500 mb-2">No queries yet</p>
          <Link 
            to="/query" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Ask a Question
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {queryHistory.map(query => (
            <li key={query.id} className="py-3">
              <Link to={`/query/${query.id}`} className="block hover:bg-gray-50 -mx-3 px-3 py-2 rounded-lg transition-colors">
                <div className="flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {query.query_text}
                    </p>
                    {getStatusBadge(query.success)}
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{formatDate(query.executed_at)}</span>
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

export default QueryHistoryPanel;