import React from 'react';
import ReactMarkdown from 'react-markdown';

const InsightsPanel = ({ insights }) => {
  if (!insights) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Insights</h2>
      <div className="prose prose-blue max-w-none">
        <ReactMarkdown>{insights}</ReactMarkdown>
      </div>
    </div>
  );
};

export default InsightsPanel;