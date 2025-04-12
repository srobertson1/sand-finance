import React, { useState } from 'react';

const DataTable = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  if (!data || !data.rows || !data.headers) {
    return <div>No data available</div>;
  }
  
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedRows = data.rows.slice(startIndex, startIndex + rowsPerPage);
  const totalPages = Math.ceil(data.rows.length / rowsPerPage);
  
  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      // Format numbers with commas and 2 decimal places if needed
      return isNaN(value) ? '-' : new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(value);
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      // Format dates
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }
    return String(value);
  };
  
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {data.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedRows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {data.headers.map((header, cellIndex) => (
                  <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatValue(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Show query result meta info */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center">
        <div>
          Showing {paginatedRows.length} of {data.rows.length} results
          {data.totalCount && data.filteredCount && data.totalCount !== data.filteredCount && (
            <span> (filtered from {data.totalCount} total records)</span>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-2 py-1 rounded ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-2 py-1 rounded ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataTable;