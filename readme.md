# AI Personal Finance Tracker

A comprehensive personal finance management application with AI-powered insights using Google's Gemini API.

## Features

- 📊 **Interactive Dashboard** - Real-time financial overview with charts and graphs
- 💳 **Transaction Management** - Add, view, and categorize income/expenses
- 📈 **Visual Analytics** - Pie charts, line graphs, and bar charts using Recharts
- 🤖 **AI-Powered Advice** - Personalized financial recommendations using Gemini API
- 💰 **Budget Tracking** - Set and monitor budget goals with performance analytics
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🎯 **Smart Insights** - Spending patterns and financial health scoring

## Tech Stack

### Frontend
- React 18
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons

### Backend
- FastAPI
- SQLite database
- Google Gemini API
- Pydantic for data validation

## Setup Instructions

### Backend Setup

1. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

2. **Set up environment variables:**
Create a `.env` file in the backend directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

3. **Get Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key to your `.env` file

4. **Run the backend server:**
```bash
python main.py
```
The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Create a new React project:**
```bash
npx create-react-app finance-tracker-frontend
cd finance-tracker-frontend
```

2. **Install required dependencies:**
```bash
npm install recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

3. **Configure Tailwind CSS:**
Update `tailwind.config.js`:
```javascript
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

4. **Add Tailwind to your CSS:**
Replace the contents of `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

5. **Replace App.js with the React component provided**

6. **Start the development server:**
```bash
npm start
```

## Backend Requirements (requirements.txt)

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
google-generativeai==0.3.2
python-multipart==0.0.6
python-dotenv==1.0.0
sqlite3
```

## API Endpoints

### Transactions
- `POST /transactions/` - Create a new transaction
- `GET /transactions/` - Get all transactions
- `DELETE /transactions/{id}` - Delete a transaction

### Budget Management
- `POST /budget-goals/` - Set budget goals
- `GET /budget-goals/` - Get budget goals
- `GET /analytics/budget-performance/` - Get budget performance

### AI & Analytics
- `POST /ai-advice/` - Get AI-powered financial advice
- `GET /summary/` - Get financial summary
- `GET /analytics/spending-trends/` - Get spending trends
- `GET /health` - Health check

## Integration with Frontend

To connect the React frontend with the FastAPI backend, you'll need to:

1. **Install axios for API calls:**
```bash
npm install axios
```

2. **Create an API service file** (`src/services/api.js`):
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const financeAPI = {
  // Transactions
  getTransactions: () => api.get('/transactions/'),
  createTransaction: (transaction) => api.post('/transactions/', transaction),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  
  // Summary
  getSummary: () => api.get('/summary/'),
  
  // Budget
  setBudgetGoal: (goal) => api.post('/budget-goals/', goal),
  getBudgetGoals: () => api.get('/budget-goals/'),
  
  // AI Advice
  getAIAdvice: (data) => api.post('/ai-advice/', data),
  
  // Analytics
  getSpendingTrends: () => api.get('/analytics/spending-trends/'),
  getBudgetPerformance: () => api.get('/analytics/budget-performance/'),
};

export default api;
```

3. **Update the React component** to use real API calls instead of mock data.

## Deployment

### Backend Deployment (Railway/Heroku/DigitalOcean)
1. Add a `Procfile` for Heroku:
```
web: uvicorn main:app --host=0.0.0.0 --port=${PORT:-8000}
```

2. Set environment variables in your deployment platform
3. Update CORS origins to include your deployed frontend URL

### Frontend Deployment (Vercel/Netlify)
1. Build the React app: `npm run build`
2. Deploy the build folder to your chosen platform
3. Update API base URL to your deployed backend URL

## Security Considerations

- Store API keys securely in environment variables
- Implement user authentication for multi-user support
- Add rate limiting to prevent API abuse
- Use HTTPS in production
- Validate and sanitize all user inputs

## Future Enhancements

- User authentication and multi-user support
- Bank account integration (Plaid API)
- Investment tracking
- Bill reminders and notifications
- Export data to CSV/PDF
- Dark mode theme
- Mobile app version
- Advanced ML models for prediction

## Troubleshooting

### Common Issues:

1. **Gemini API Key Issues:**
   - Ensure API key is correctly set in environment variables
   - Check API key permissions and quota

2. **Database Issues:**
   - Database file will be created automatically
   - Check file permissions in the project directory

3. **CORS Issues:**
   - Ensure frontend URL is added to CORS origins
   - Check if ports match between frontend and backend

4. **Dependencies:**
   - Use virtual environment for Python dependencies
   - Ensure Node.js version compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.