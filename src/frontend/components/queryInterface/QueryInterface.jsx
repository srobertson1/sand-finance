import React, { useState, useEffect } from 'react';
import QueryInput from './QueryInput';
import QueryResults from './QueryResults';
import QuerySuggestions from './QuerySuggestions';
import { submitQuery, fetchQuerySuggestions } from '../../services/queryService';

const QueryInterface = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Load query suggestions when component mounts
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const suggestedQueries = await fetchQuerySuggestions();
        setSuggestions(suggestedQueries);
      } catch (err) {
        console.error('Error loading query suggestions:', err);
      }
    };

    loadSuggestions();
  }, []);

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
  };

  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    
    try {
      const response = await submitQuery(query);
      setResults(response);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing your query');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
  };

  const handleFeedbackSubmit = (queryId, feedbackType, feedbackText) => {
    // Implementation for submitting feedback
    console.log('Feedback submitted:', { queryId, feedbackType, feedbackText });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ask Questions About Your Financial Data</h1>
      
      <QueryInput 
        query={query} 
        onQueryChange={handleQueryChange} 
        onQuerySubmit={handleQuerySubmit} 
        isLoading={loading} 
      />
      
      {!results && !loading && !error && (
        <QuerySuggestions 
          suggestions={suggestions} 
          onSuggestionClick={handleSuggestionClick} 
        />
      )}
      
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {results && (
        <QueryResults 
          results={results} 
          onFeedbackSubmit={handleFeedbackSubmit} 
        />
      )}
    </div>
  );
};

export default QueryInterface;
