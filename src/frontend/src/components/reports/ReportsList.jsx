import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchAllReports, deleteReport } from '../../services/reportService';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [filterType, setFilterType] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await fetchAllReports();
        setReports(response.data.reports || []);
        setFilteredReports(response.data.reports || []);
      } catch (err) {
        setError('Failed to load reports. Please try again later.');
        console.error('Error loading reports:', err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  useEffect(() => {
    // Filter and sort reports whenever filter criteria change
    let result = [...reports];
    
    // Apply type filter
    if (filterType !== 'all') {
      result = result.filter(report => report.report_type === filterType);
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(report => 
        report.title.toLowerCase().includes(searchLower) || 
        (report.description && report.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];
      
      // Handle dates
      if (sortBy === 'created_at' || sortBy === 'updated_at') {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB).getTime();
      }
      
      // Handle strings
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      // Handle numbers and dates
      return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
    });
    
    setFilteredReports(result);
  }, [reports, searchTerm, sortBy, sortDirection, filterType]);

  const handleDeleteReport = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        setIsDeleting(true);
        await deleteReport(id);
        setReports(reports.filter(report => report.id !== id));
      } catch (err) {
        setError('Failed to delete report.');
        console.error('Error deleting report:', err);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getReportTypeOptions = () => {
    // Get unique report types from the reports
    const types = ['all', ...new Set(reports.map(report => report.report_type))];
    return types.filter(Boolean); // Remove any null/undefined values
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold mb-2">No Reports Found</h2>
        <p className="text-gray-600 mb-4">Start by creating your first financial report.</p>
        <Link to="/reports/new" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Create New Report
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Financial Reports</h1>
        <Link 
          to="/reports/new" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Report
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md mb-6 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Search input */}
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by type */}
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600">Type:</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
            >
              {getReportTypeOptions().map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>

          {/* Sort options */}
          <div className="flex items-center">
            <label className="mr-2 text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md py-2 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="created_at">Date Created</option>
              <option value="updated_at">Date Updated</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="ml-2 p-2 rounded-md hover:bg-gray-100"
            >
              {sortDirection === 'asc' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {filteredReports.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No reports found matching your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(report => (
            <div key={report.id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-shadow hover:shadow-lg">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <h2 className="text-lg font-semibold">{report.title}</h2>
                  <div className="inline-flex">
                    <Link 
                      to={`/reports/${report.id}/edit`}
                      className="text-gray-500 hover:text-blue-500 p-1"
                      title="Edit Report"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDeleteReport(report.id)}
                      disabled={isDeleting}
                      className="text-gray-500 hover:text-red-500 p-1"
                      title="Delete Report"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    {report.report_type || "Report"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(report.created_at)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-700 mb-4 line-clamp-3 h-16">{report.description || "No description"}</p>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    By {report.creator_name || "Unknown"}
                  </span>
                  <Link 
                    to={`/reports/${report.id}`} 
                    className="text-blue-500 hover:text-blue-700 flex items-center"
                  >
                    View Report
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsList;
