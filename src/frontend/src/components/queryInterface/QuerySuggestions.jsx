import React from 'react';

const QuerySuggestions = ({ suggestions, onSuggestionClick }) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium mb-3">Suggested Queries</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="text-left p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            onClick={() => onSuggestionClick(suggestion)}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5 text-blue-500" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-sm text-gray-800">{suggestion}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuerySuggestions;