import React, { useState } from 'react';
import DataTable from './DataTable';
import InsightsPanel from './InsightsPanel';

const QueryResults = ({ results, onFeedbackSubmit }) => {
  const [feedbackType, setFeedbackType] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  if (!results) return null;

  const { queryId, interpretation, data, insights } = results;

  const handleFeedbackSubmit = () => {
    if (!feedbackType) return;
    onFeedbackSubmit(queryId, feedbackType, feedbackText);
    setFeedbackSubmitted(true);
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-medium text-blue-800 mb-2">Query Interpretation</h2>
        <p className="text-blue-700">{interpretation.interpretation}</p>
        {interpretation.confidenceScore && (
          <div className="mt-2 text-sm text-blue-600">
            Confidence: {Math.round(interpretation.confidenceScore * 100)}%
          </div>
        )}
      </div>

      {data && data.rows && data.rows.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <DataTable data={data} />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-gray-500">No data found matching your query</div>
        </div>
      )}

      {insights && (
        <InsightsPanel insights={insights} />
      )}

      {!feedbackSubmitted ? (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3">Was this result helpful?</h3>
          <div className="flex space-x-3 mb-4">
            <button
              onClick={() => setFeedbackType('helpful')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                feedbackType === 'helpful'
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Yes, helpful
            </button>
            <button
              onClick={() => setFeedbackType('not_helpful')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                feedbackType === 'not_helpful'
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Not quite right
            </button>
            <button
              onClick={() => setFeedbackType('incorrect')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                feedbackType === 'incorrect'
                  ? 'bg-red-100 text-red-800 border border-red-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Incorrect
            </button>
          </div>

          {feedbackType && feedbackType !== 'helpful' && (
            <div className="mb-4">
              <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
                How can we improve this result?
              </label>
              <textarea
                id="feedback"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Please tell us what was wrong or what you were expecting..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
              />
            </div>
          )}

          <button
            onClick={handleFeedbackSubmit}
            disabled={!feedbackType}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              !feedbackType
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Submit Feedback
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          Thank you for your feedback! It helps us improve our system.
        </div>
      )}
    </div>
  );
};

export default QueryResults;