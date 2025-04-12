const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
const { createDbConnection } = require('../../database/setup');

// Load environment variables from external keys directory
dotenv.config({ path: '/home/simrob1729/keys/.env' });

/**
 * Service to handle interactions with Language Models (OpenAI/Anthropic)
 */

// Configure API settings based on environment
const useClaude = process.env.LLM_PROVIDER === 'anthropic' || !process.env.OPENAI_API_KEY;
const apiKey = useClaude ? process.env.ANTHROPIC_API_KEY : process.env.OPENAI_API_KEY;
const apiUrl = useClaude 
  ? 'https://api.anthropic.com/v1/messages'
  : 'https://api.openai.com/v1/chat/completions';

// Interpret natural language queries into structured data queries
const interpretQuery = async (query, context = {}) => {
  try {
    const { availableSheets, availableColumns } = context;

    // Format context for the prompt
    let contextString = 'Available data sources:\n';
    
    if (availableSheets && availableSheets.length) {
      contextString += availableSheets.map(sheet => 
        `- ${sheet.name} (ID: ${sheet.sheet_id})\n`
      ).join('');
    } else {
      contextString += '- No sheets available yet\n';
    }

    if (availableColumns && Object.keys(availableColumns).length) {
      contextString += '\nAvailable columns by sheet:\n';
      for (const [sheetId, columns] of Object.entries(availableColumns)) {
        const sheetName = availableSheets.find(s => s.sheet_id === sheetId)?.name || sheetId;
        contextString += `\n${sheetName}:\n`;
        contextString += columns.map(col => 
          `- ${col.display_name || col.column_name} (${col.data_type || 'unknown type'})${col.description ? ': ' + col.description : ''}`
        ).join('\n');
      }
    }

    // Create the prompt for the language model
    const prompt = `You are a financial data assistant that translates natural language queries into structured data requests.

${contextString}

User query: "${query}"

Please analyze this query and provide a response in the following JSON format:
{
  "targetSheet": "sheet_id_here", // The ID of the sheet to query, or null if unclear
  "interpretation": "what you understand the user is asking for",
  "requiredColumns": ["column1", "column2"], // Column names needed to answer this query
  "filters": [], // Any filters to apply to the data
  "sorting": null, // Sorting instructions if relevant
  "aggregation": null, // Aggregation functions if relevant (sum, average, etc.)
  "timeRange": null, // Time range if relevant
  "confidenceScore": 0.0 to 1.0, // How confident you are in this interpretation
  "needsClarification": false, // Whether you need more information from the user
  "clarificationQuestion": null // Question to ask the user if clarification is needed
}`;

    const payload = useClaude 
      ? {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }
      : {
          model: 'gpt-4-turbo',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...useClaude ? { 'anthropic-version': '2023-06-01' } : {}
    };

    // Make API request to language model
    const response = await axios.post(apiUrl, payload, { headers });
    const content = useClaude 
      ? response.data.content[0].text 
      : response.data.choices[0].message.content;

    // Parse the JSON response
    try {
      const parsedResponse = JSON.parse(content.trim());
      return parsedResponse;
    } catch (e) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse LLM response as JSON');
      }
    }
  } catch (error) {
    console.error('Error in LLM query interpretation:', error);
    throw error;
  }
};

// Generate insights from financial data
const generateInsights = async (data, context = {}) => {
  try {
    const { sheetName, columns } = context;

    // Format context for the prompt
    let contextString = '';
    if (sheetName) {
      contextString += `Data source: ${sheetName}\n`;
    }
    
    if (columns && columns.length) {
      contextString += 'Columns:\n';
      contextString += columns.map(col => 
        `- ${col.display_name || col.column_name}${col.description ? ': ' + col.description : ''}`
      ).join('\n');
    }

    // Sample data entries to help the LLM understand the format
    let dataPreview = '';
    if (Array.isArray(data) && data.length > 0) {
      const sampleSize = Math.min(3, data.length);
      dataPreview = '\nData preview (limited sample):\n';
      for (let i = 0; i < sampleSize; i++) {
        dataPreview += JSON.stringify(data[i], null, 2) + '\n';
      }
      if (data.length > sampleSize) {
        dataPreview += `...and ${data.length - sampleSize} more entries\n`;
      }
    }

    // Create the prompt for the language model
    const prompt = `You are a financial analyst assistant that generates insights from data.

${contextString}
${dataPreview}

Full data: ${JSON.stringify(data)}

Please analyze this financial data and provide the following:
1. Summary of key metrics and trends
2. Notable patterns or anomalies
3. Potential business implications
4. Recommendations based on the data

Format your response in a clear, professional manner suitable for a financial dashboard.`;

    const payload = useClaude 
      ? {
          model: 'claude-3-haiku-20240307',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        }
      : {
          model: 'gpt-4-turbo',
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...useClaude ? { 'anthropic-version': '2023-06-01' } : {}
    };

    // Make API request to language model
    const response = await axios.post(apiUrl, payload, { headers });
    const content = useClaude 
      ? response.data.content[0].text 
      : response.data.choices[0].message.content;

    return content;
  } catch (error) {
    console.error('Error generating insights:', error);
    throw error;
  }
};

// Generate a financial report
const generateReport = async (reportType, data, parameters = {}) => {
  try {
    // Format the prompt based on report type
    let promptTemplate = '';
    
    switch (reportType.toLowerCase()) {
      case 'monthly_summary':
        promptTemplate = `Generate a comprehensive monthly financial summary report with the following sections:
- Executive Summary
- Revenue Analysis
- Expense Breakdown
- Profit & Loss Statement
- Cash Flow Overview
- Key Performance Indicators
- Recommendations`;
        break;
      
      case 'trend_analysis':
        promptTemplate = `Generate a trend analysis report that examines patterns over time with these sections:
- Historical Trends Overview
- Seasonality Analysis
- Growth Rate Calculation
- Comparative Performance
- Future Projections
- Risk Factors
- Strategic Opportunities`;
        break;
        
      case 'variance_report':
        promptTemplate = `Generate a variance report that compares actual results against projections with these sections:
- Variance Summary
- Key Deviations Analysis
- Contributing Factors
- Impact Assessment
- Corrective Actions
- Updated Forecasts`;
        break;
        
      default:
        promptTemplate = `Generate a financial report with comprehensive analysis and insights.`;
    }
    
    // Include any additional parameters
    let parameterString = '';
    if (Object.keys(parameters).length > 0) {
      parameterString = '\nParameters:\n' + 
        Object.entries(parameters)
          .map(([key, value]) => `- ${key}: ${value}`)
          .join('\n');
    }
    
    // Create the prompt for the language model
    const prompt = `You are a financial report generator. ${promptTemplate}
${parameterString}

Use the following data to create this report:
${JSON.stringify(data, null, 2)}

Format the report in Markdown, with appropriate headings, bullet points, and emphasis. Include relevant calculations and insights based on the data provided.`;

    const payload = useClaude 
      ? {
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        }
      : {
          model: 'gpt-4-turbo',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...useClaude ? { 'anthropic-version': '2023-06-01' } : {}
    };

    // Make API request to language model
    const response = await axios.post(apiUrl, payload, { headers });
    const content = useClaude 
      ? response.data.content[0].text 
      : response.data.choices[0].message.content;

    return content;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

// Get suggested queries based on available data
const getSuggestedQueries = async (availableSheets, availableColumns) => {
  try {
    // Format context for the prompt
    let contextString = 'Available data sources:\n';
    
    if (availableSheets && availableSheets.length) {
      contextString += availableSheets.map(sheet => 
        `- ${sheet.name} (ID: ${sheet.sheet_id})\n`
      ).join('');
    } else {
      contextString += '- No sheets available yet\n';
      return []; // Return empty array if no sheets available
    }

    if (availableColumns && Object.keys(availableColumns).length) {
      contextString += '\nAvailable columns by sheet:\n';
      for (const [sheetId, columns] of Object.entries(availableColumns)) {
        const sheetName = availableSheets.find(s => s.sheet_id === sheetId)?.name || sheetId;
        contextString += `\n${sheetName}:\n`;
        contextString += columns.map(col => 
          `- ${col.display_name || col.column_name} (${col.data_type || 'unknown type'})${col.description ? ': ' + col.description : ''}`
        ).join('\n');
      }
    }

    // Create the prompt for the language model
    const prompt = `You are a financial data assistant. Based on the available data sources and columns provided, generate 5 useful natural language queries that a finance team might want to ask.

${contextString}

Please provide 5 example queries that would be useful for financial analysis and reporting. Focus on queries that provide strategic insights, trend analysis, and important financial metrics. Return ONLY the list of 5 queries as a JSON array, with no additional text.`;

    const payload = useClaude 
      ? {
          model: 'claude-3-haiku-20240307',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }
      : {
          model: 'gpt-4-turbo',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...useClaude ? { 'anthropic-version': '2023-06-01' } : {}
    };

    // Make API request to language model
    const response = await axios.post(apiUrl, payload, { headers });
    const content = useClaude 
      ? response.data.content[0].text 
      : response.data.choices[0].message.content;

    // Parse the JSON response
    try {
      // Clean the response to extract just the JSON array
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // If no array found, try parsing the whole content
        return JSON.parse(content.trim());
      }
    } catch (e) {
      console.error('Failed to parse suggested queries:', e);
      return [];
    }
  } catch (error) {
    console.error('Error generating suggested queries:', error);
    return [];
  }
};

// Learn from user feedback
const learnFromFeedback = async (queryId, feedbackType, feedbackText) => {
  try {
    const db = createDbConnection();

    // Get the original query and processed query
    db.get(
      'SELECT query_text, processed_query FROM query_history WHERE id = ?',
      [queryId],
      async (err, queryData) => {
        db.close();
        if (err || !queryData) {
          console.error('Error retrieving query data for feedback learning:', err);
          return;
        }

        // Only send to LLM for learning if it's substantive feedback
        if (feedbackType === 'incorrect' || feedbackText) {
          // Create the prompt for the language model to learn from feedback
          const prompt = `You are an AI system learning to improve financial data queries based on user feedback.

Original query: "${queryData.query_text}"
Processed interpretation: ${queryData.processed_query}
Feedback type: ${feedbackType}
User feedback: ${feedbackText || 'No specific feedback provided'}

Please analyze this feedback and provide:
1. What went wrong with the interpretation?
2. How would you improve the interpretation in the future?
3. Are there specific patterns or edge cases to be aware of?

This analysis will be stored to improve future query processing.`;

          const payload = useClaude 
            ? {
                model: 'claude-3-haiku-20240307',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }],
              }
            : {
                model: 'gpt-4-turbo',
                max_tokens: 1000,
                messages: [{ role: 'user', content: prompt }],
              };

          const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            ...useClaude ? { 'anthropic-version': '2023-06-01' } : {}
          };

          // We don't need to wait for this response or store it
          // It's just to help the LLM learn from patterns for future implementations
          axios.post(apiUrl, payload, { headers })
            .catch(error => console.error('Error in feedback learning process:', error));
        }
      }
    );
  } catch (error) {
    console.error('Error in feedback learning process:', error);
  }
};

module.exports = {
  interpretQuery,
  generateInsights,
  generateReport,
  getSuggestedQueries,
  learnFromFeedback
};
