import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import QueryInterface from './components/queryInterface/QueryInterface';
import ReportsList from './components/reports/ReportsList';
import ReportDetail from './components/reports/ReportDetail';
import CreateReport from './components/reports/CreateReport';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { isAuthenticated } from './services/authService';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="query" element={<QueryInterface />} />
          <Route path="reports" element={<ReportsList />} />
          <Route path="reports/:reportId" element={<ReportDetail />} />
          <Route path="reports/new" element={<CreateReport />} />
        </Route>
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

export default App;
