from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import google.generativeai as genai
import os
from enum import Enum
import json
import sqlite3
from contextlib import contextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="AI Personal Finance Tracker", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "your-gemini-api-key-here")
genai.configure(api_key=GEMINI_API_KEY)

# Database setup
DATABASE_PATH = "finance_tracker.db"

def init_database():
    """Initialize SQLite database with tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Create transactions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT 'default_user',
            type TEXT NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Create budget_goals table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS budget_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT 'default_user',
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            UNIQUE(user_id, category, month, year)
        )
    """)
    
    conn.commit()
    conn.close()

@contextmanager
def get_db():
    """Database context manager"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Pydantic models
class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class Transaction(BaseModel):
    type: TransactionType
    category: str
    amount: float
    description: Optional[str] = None
    date: date

class TransactionResponse(BaseModel):
    id: int
    type: str
    category: str
    amount: float
    description: Optional[str]
    date: date
    created_at: datetime

class BudgetGoal(BaseModel):
    category: str
    amount: float
    month: int
    year: int

class AIAdviceRequest(BaseModel):
    transactions: List[Dict[str, Any]]
    budget_goals: Optional[Dict[str, float]] = None
    user_context: Optional[str] = None

class FinancialSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_balance: float
    expenses_by_category: Dict[str, float]
    savings_rate: float

# Database functions
def create_transaction(transaction: Transaction, user_id: str = "default_user"):
    """Create a new transaction in the database"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO transactions (user_id, type, category, amount, description, date)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (user_id, transaction.type.value, transaction.category, transaction.amount, 
              transaction.description, transaction.date))
        conn.commit()
        return cursor.lastrowid

def get_transactions(user_id: str = "default_user", limit: int = 100):
    """Get transactions for a user"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM transactions 
            WHERE user_id = ? 
            ORDER BY date DESC, created_at DESC 
            LIMIT ?
        """, (user_id, limit))
        return cursor.fetchall()

def get_budget_goals(user_id: str = "default_user", month: int = None, year: int = None):
    """Get budget goals for a user"""
    with get_db() as conn:
        cursor = conn.cursor()
        if month and year:
            cursor.execute("""
                SELECT * FROM budget_goals 
                WHERE user_id = ? AND month = ? AND year = ?
            """, (user_id, month, year))
        else:
            cursor.execute("""
                SELECT * FROM budget_goals 
                WHERE user_id = ?
            """, (user_id,))
        return cursor.fetchall()

def set_budget_goal(budget_goal: BudgetGoal, user_id: str = "default_user"):
    """Set or update a budget goal"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO budget_goals (user_id, category, amount, month, year)
            VALUES (?, ?, ?, ?, ?)
        """, (user_id, budget_goal.category, budget_goal.amount, 
              budget_goal.month, budget_goal.year))
        conn.commit()

# AI functions
def generate_financial_advice(transactions_data: List[Dict], budget_goals: Dict = None, user_context: str = None):
    """Generate financial advice using Gemini API"""
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        # Prepare the prompt
        prompt = f"""
        You are a professional financial advisor. Analyze the following financial data and provide personalized advice.

        TRANSACTION DATA:
        {json.dumps(transactions_data, indent=2)}

        BUDGET GOALS:
        {json.dumps(budget_goals, indent=2) if budget_goals else "No budget goals set"}

        USER CONTEXT:
        {user_context if user_context else "No additional context provided"}

        Please provide:
        1. Overall financial health assessment
        2. Spending pattern analysis
        3. Specific recommendations for improvement
        4. Budget suggestions
        5. Savings opportunities
        6. Warning about any concerning trends

        Keep the advice practical, actionable, and encouraging. Format your response in a clear, easy-to-read manner.
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        logger.error(f"Error generating AI advice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI advice")

def calculate_financial_summary(transactions: List[Dict]) -> FinancialSummary:
    """Calculate financial summary from transactions"""
    total_income = sum(t['amount'] for t in transactions if t['type'] == 'income')
    total_expenses = sum(t['amount'] for t in transactions if t['type'] == 'expense')
    net_balance = total_income - total_expenses
    
    # Calculate expenses by category
    expenses_by_category = {}
    for t in transactions:
        if t['type'] == 'expense':
            expenses_by_category[t['category']] = expenses_by_category.get(t['category'], 0) + t['amount']
    
    savings_rate = (net_balance / total_income * 100) if total_income > 0 else 0
    
    return FinancialSummary(
        total_income=total_income,
        total_expenses=total_expenses,
        net_balance=net_balance,
        expenses_by_category=expenses_by_category,
        savings_rate=savings_rate
    )

# API endpoints
@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_database()
    logger.info("Database initialized")

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "AI Personal Finance Tracker API", "version": "1.0.0"}

@app.post("/transactions/", response_model=dict)
async def create_transaction_endpoint(transaction: Transaction):
    """Create a new transaction"""
    try:
        transaction_id = create_transaction(transaction)
        return {"id": transaction_id, "message": "Transaction created successfully"}
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create transaction")

@app.get("/transactions/", response_model=List[dict])
async def get_transactions_endpoint(limit: int = 100):
    """Get all transactions"""
    try:
        transactions = get_transactions(limit=limit)
        return [dict(row) for row in transactions]
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch transactions")

@app.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: int):
    """Delete a transaction"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM transactions WHERE id = ?", (transaction_id,))
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="Transaction not found")
            conn.commit()
        return {"message": "Transaction deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting transaction: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete transaction")

@app.get("/summary/", response_model=FinancialSummary)
async def get_financial_summary():
    """Get financial summary"""
    try:
        transactions = get_transactions()
        transactions_data = [dict(row) for row in transactions]
        summary = calculate_financial_summary(transactions_data)
        return summary
    except Exception as e:
        logger.error(f"Error calculating summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate financial summary")

@app.post("/budget-goals/", response_model=dict)
async def set_budget_goal_endpoint(budget_goal: BudgetGoal):
    """Set or update a budget goal"""
    try:
        set_budget_goal(budget_goal)
        return {"message": "Budget goal set successfully"}
    except Exception as e:
        logger.error(f"Error setting budget goal: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to set budget goal")

@app.get("/budget-goals/", response_model=List[dict])
async def get_budget_goals_endpoint(month: int = None, year: int = None):
    """Get budget goals"""
    try:
        goals = get_budget_goals(month=month, year=year)
        return [dict(row) for row in goals]
    except Exception as e:
        logger.error(f"Error fetching budget goals: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch budget goals")

@app.post("/ai-advice/", response_model=dict)
async def get_ai_advice(request: AIAdviceRequest):
    """Get AI-powered financial advice"""
    try:
        advice = generate_financial_advice(
            transactions_data=request.transactions,
            budget_goals=request.budget_goals,
            user_context=request.user_context
        )
        return {"advice": advice}
    except Exception as e:
        logger.error(f"Error generating AI advice: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate AI advice")

@app.get("/analytics/spending-trends/", response_model=dict)
async def get_spending_trends():
    """Get spending trends analytics"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            
            # Monthly spending trends
            cursor.execute("""
                SELECT 
                    strftime('%Y-%m', date) as month,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
                FROM transactions
                WHERE date >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', date)
                ORDER BY month
            """)
            monthly_trends = [dict(row) for row in cursor.fetchall()]
            
            # Category spending trends
            cursor.execute("""
                SELECT 
                    category,
                    SUM(amount) as total_amount,
                    COUNT(*) as transaction_count,
                    AVG(amount) as avg_amount
                FROM transactions
                WHERE type = 'expense' AND date >= date('now', '-30 days')
                GROUP BY category
                ORDER BY total_amount DESC
            """)
            category_trends = [dict(row) for row in cursor.fetchall()]
            
            # Daily spending pattern
            cursor.execute("""
                SELECT 
                    strftime('%w', date) as day_of_week,
                    AVG(amount) as avg_spending
                FROM transactions
                WHERE type = 'expense' AND date >= date('now', '-30 days')
                GROUP BY strftime('%w', date)
                ORDER BY day_of_week
            """)
            daily_patterns = [dict(row) for row in cursor.fetchall()]
            
        return {
            "monthly_trends": monthly_trends,
            "category_trends": category_trends,
            "daily_patterns": daily_patterns
        }
    except Exception as e:
        logger.error(f"Error fetching spending trends: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch spending trends")

@app.get("/analytics/budget-performance/", response_model=dict)
async def get_budget_performance():
    """Get budget performance analytics"""
    try:
        current_month = datetime.now().month
        current_year = datetime.now().year
        
        # Get budget goals for current month
        budget_goals = get_budget_goals(month=current_month, year=current_year)
        budget_dict = {goal['category']: goal['amount'] for goal in budget_goals}
        
        # Get actual spending for current month
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT 
                    category,
                    SUM(amount) as actual_spending
                FROM transactions
                WHERE type = 'expense' 
                    AND strftime('%m', date) = ? 
                    AND strftime('%Y', date) = ?
                GROUP BY category
            """, (f"{current_month:02d}", str(current_year)))
            
            actual_spending = {row['category']: row['actual_spending'] for row in cursor.fetchall()}
        
        # Calculate performance metrics
        performance = []
        for category, budget in budget_dict.items():
            actual = actual_spending.get(category, 0)
            performance.append({
                "category": category,
                "budget": budget,
                "actual": actual,
                "difference": budget - actual,
                "percentage_used": (actual / budget * 100) if budget > 0 else 0,
                "status": "over_budget" if actual > budget else "within_budget"
            })
        
        return {
            "budget_performance": performance,
            "total_budget": sum(budget_dict.values()),
            "total_spent": sum(actual_spending.values()),
            "overall_status": "within_budget" if sum(actual_spending.values()) <= sum(budget_dict.values()) else "over_budget"
        }
    except Exception as e:
        logger.error(f"Error fetching budget performance: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch budget performance")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)