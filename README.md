# Sand Finance

An automated financial dashboard system that helps startups' finance teams with reporting and analysis. The system pulls data from Google Sheets, generates insights using LLMs, and presents an interactive dashboard.

## Implementation Status

The project is under active development. Here's the current status:

✅ Backend infrastructure and route setup  
✅ User authentication system  
✅ Google Sheets integration  
✅ Database schema and setup  
✅ LLM integration for natural language processing  
✅ Query processing and analysis  
✅ Report generation system  
✅ Frontend dashboard components  
✅ Interactive query interface  
✅ Reports listing and management  
✅ Feedback system for learning from user interactions  

🚧 Frontend visualization components (in progress)  
🚧 Data transformation and export features (in progress)  
🚧 Testing infrastructure (to be implemented)  
🚧 CI/CD pipeline (to be implemented)  

## Architecture Overview

1. **Data Sources Layer**
   - Google Sheets integration (primary data source)
   - API connections to retrieve financial data
   - Authentication handling for secure data access

2. **Backend Services (Node.js/Express)**
   - RESTful API for data retrieval and processing
   - Data access layer to standardize interactions with Google Sheets
   - Query processing to translate natural language to structured data requests
   - Report generation system for monthly financial reports
   - Authentication and user management

3. **Database Layer**
   - Metadata repository to map and track Google Sheets data locations
   - Query history storage for learning from past interactions
   - Feedback database to store user corrections and preferences
   - SQLite as a lightweight database solution

4. **LLM Integration**
   - Query interpretation to understand natural language requests
   - Insight generation for analyzing financial data
   - Report drafting capabilities for monthly reports
   - Connection to OpenAI or Anthropic API

5. **Frontend (React)**
   - Interactive dashboard with financial visualizations
   - Natural language query interface
   - Feedback components to improve system accuracy
   - Report templates and viewing capabilities
   - Responsive design for different devices

6. **Learning System**
   - Feedback processing to improve accuracy
   - Metadata updates as the system learns about data
   - Prompt optimization for better LLM performance

## Core Features

- **Natural Language Querying**: Ask questions about your financial data in plain English
- **Automated Reporting**: Generate comprehensive financial reports with a few clicks
- **Google Sheets Integration**: Directly connect to your existing financial data
- **Interactive Dashboard**: View key metrics and insights at a glance
- **Learning System**: Improves over time with your feedback
- **Access Control**: Secure role-based authentication system

## Technical Stack

- **Backend**: Node.js with Express
- **Frontend**: React with Tailwind CSS for UI components
- **Database**: SQLite for lightweight storage needs
- **Visualization**: React components for data visualization
- **APIs**: Google Sheets API, OpenAI/Claude API
- **Authentication**: JWT-based authentication system
- **Deployment**: Heroku or similar platform

## Security Setup

- Environment variables loaded from an external keys directory (`/home/simrob1729/keys/.env`)
- Gitignore configured to exclude sensitive files
- All API keys and credentials stored securely outside the repository
- JWT-based authentication with role-based access control

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Google Cloud Platform account with Sheets API enabled
- OpenAI or Anthropic API access

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd sand-finance
   ```

2. Install dependencies
   ```bash
   npm install
   cd src/frontend
   npm install
   cd ../..
   ```

3. Create environment files
   - Copy `.env.example` to `/home/simrob1729/keys/.env` (external keys directory)
   - Fill in the required environment variables

4. Set up the database
   ```bash
   npm run setup-db
   ```

5. Start the development server
   ```bash
   npm run dev:all
   ```

## Available Scripts

- `npm start`: Starts the backend server
- `npm run dev`: Starts the backend server with hot reloading
- `npm run client`: Starts the React development server
- `npm run dev:all`: Runs both backend and frontend in development mode
- `npm test`: Runs tests
- `npm run lint`: Lints the code

## Project Structure

```
sand-finance/
├── src/
│   ├── backend/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic and external services
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Express server setup
│   ├── database/
│   │   └── setup.js        # Database initialization
│   └── frontend/           # React application
│       ├── components/     # React components
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       ├── services/       # API client services
│       ├── utils/          # Utility functions
│       ├── App.jsx         # Root component
│       ├── index.jsx       # Application entry point
│       └── package.json    # Frontend dependencies
├── .env.example            # Template for environment variables
└── package.json            # Project dependencies and scripts
```

**Note:** The current implementation has a nested structure with duplicate folders that should be restructured in a future refactoring.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.