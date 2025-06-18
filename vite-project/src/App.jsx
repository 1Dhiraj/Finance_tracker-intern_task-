import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plus, DollarSign, TrendingUp, TrendingDown, Bot, Calendar, Target } from 'lucide-react';
import './App.css'

const App = () => {
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'expense', category: 'Food', amount: 45.50, description: 'Grocery shopping', date: '2024-06-15' },
    { id: 2, type: 'income', category: 'Salary', amount: 3000, description: 'Monthly salary', date: '2024-06-01' },
    { id: 3, type: 'expense', category: 'Transport', amount: 25.00, description: 'Gas', date: '2024-06-14' },
    { id: 4, type: 'expense', category: 'Entertainment', amount: 80.00, description: 'Movie tickets', date: '2024-06-12' },
    { id: 5, type: 'expense', category: 'Bills', amount: 120.00, description: 'Electricity bill', date: '2024-06-10' }
  ]);

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [aiAdvice, setAiAdvice] = useState('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [budgetGoals, setBudgetGoals] = useState({
    Food: 300,
    Transport: 200,
    Entertainment: 150,
    Bills: 400
  });

  // Calculate financial metrics
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  // Prepare data for charts
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
    percentage: ((amount / totalExpenses) * 100).toFixed(1)
  }));

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0066', '#8dd1e1'];

  // Monthly trend data (simplified)
  const monthlyData = [
    { month: 'Jan', income: 2800, expenses: 2200 },
    { month: 'Feb', income: 3000, expenses: 2400 },
    { month: 'Mar', income: 3200, expenses: 2600 },
    { month: 'Apr', income: 3000, expenses: 2300 },
    { month: 'May', income: 3100, expenses: 2500 },
    { month: 'Jun', income: totalIncome, expenses: totalExpenses }
  ];

  // Budget vs Actual data
  const budgetData = Object.entries(budgetGoals).map(([category, budget]) => ({
    category,
    budget,
    actual: expensesByCategory[category] || 0,
    difference: budget - (expensesByCategory[category] || 0)
  }));

  const addTransaction = () => {
    if (!newTransaction.category || !newTransaction.amount) return;
    
    const transaction = {
      id: Date.now(),
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    };
    
    setTransactions([...transactions, transaction]);
    setNewTransaction({
      type: 'expense',
      category: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const getAIAdvice = async () => {
    setIsLoadingAdvice(true);
    
    // Simulate AI advice generation (replace with actual Gemini API call)
    setTimeout(() => {
      const advice = generateFinancialAdvice();
      setAiAdvice(advice);
      setIsLoadingAdvice(false);
    }, 2000);
  };

  const generateFinancialAdvice = () => {
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1);
    const topExpenseCategory = Object.entries(expensesByCategory).sort(([,a], [,b]) => b - a)[0];
    
    return `Based on your spending patterns:

📊 Your current savings rate is ${savingsRate}% (${savingsRate > 20 ? 'Excellent!' : savingsRate > 10 ? 'Good, but could improve' : 'Needs improvement'})

💡 Your highest expense category is ${topExpenseCategory[0]} at $${topExpenseCategory[1].toFixed(2)}. Consider:
- Setting a monthly budget of $${(topExpenseCategory[1] * 0.9).toFixed(2)} for this category
- Looking for alternatives to reduce costs

🎯 Recommendations:
1. ${netBalance > 0 ? 'Great job maintaining positive cash flow!' : 'Focus on reducing expenses or increasing income'}
2. Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings
3. Build an emergency fund of 3-6 months of expenses (target: $${(totalExpenses * 3).toFixed(2)})

⚠️ Budget Alert: ${budgetData.filter(b => b.actual > b.budget).length > 0 ? 
  `You've exceeded budget in: ${budgetData.filter(b => b.actual > b.budget).map(b => b.category).join(', ')}` : 
  'You\'re within budget for all categories!'}`;
  };

  return (
    <div id="main" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">AI Financial Advisor</h1>
          <p className="text-gray-600">Track, analyze, and optimize your personal finances with AI insights</p>
        </header>

        {/* Navigation */}
        <nav className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {['dashboard', 'transactions', 'budget', 'insights'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-medium capitalize transition-colors ${
                  activeTab === tab 
                    ? 'bg-blue-500 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Income</p>
                    <p className="text-2xl font-bold text-green-600">${totalIncome.toFixed(2)}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">${totalExpenses.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Net Balance</p>
                    <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${netBalance.toFixed(2)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expense Breakdown Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Expense Breakdown</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Trend */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-6">
            {/* Add Transaction Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Add New Transaction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                
                <input
                  type="text"
                  placeholder="Category"
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={addTransaction}
                  className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
              
              <input
                type="text"
                placeholder="Description (optional)"
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                className="w-full p-2 border rounded-lg mt-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <h3 className="text-lg font-semibold p-6 border-b">Recent Transactions</h3>
              <div className="divide-y">
                {transactions.slice().reverse().map((transaction) => (
                  <div key={transaction.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${transaction.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        <p className="text-sm text-gray-600">{transaction.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-600">{transaction.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            {/* Budget vs Actual Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Budget vs Actual Spending</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  <Bar dataKey="actual" fill="#ef4444" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget Goals */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Monthly Budget Goals</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(budgetGoals).map(([category, budget]) => {
                  const actual = expensesByCategory[category] || 0;
                  const percentage = (actual / budget) * 100;
                  
                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{category}</span>
                        <span className="text-sm text-gray-600">
                          ${actual.toFixed(2)} / ${budget.toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            percentage > 100 ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {percentage.toFixed(1)}% used
                        {percentage > 100 && (
                          <span className="text-red-600 ml-2">Over budget!</span>
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            {/* AI Advice Section */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-blue-500" />
                  AI Financial Advisor
                </h3>
                <button
                  onClick={getAIAdvice}
                  disabled={isLoadingAdvice}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoadingAdvice ? 'Analyzing...' : 'Get AI Advice'}
                </button>
              </div>
              
              {aiAdvice && (
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                  <div className="whitespace-pre-wrap text-sm">{aiAdvice}</div>
                </div>
              )}
              
              {!aiAdvice && !isLoadingAdvice && (
                <p className="text-gray-600">Click "Get AI Advice" to receive personalized financial recommendations based on your spending patterns.</p>
              )}
            </div>

            {/* Financial Health Score */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-lg font-semibold mb-4">Financial Health Score</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Savings Rate</span>
                  <span className="font-medium">{((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Budget Adherence</span>
                  <span className="font-medium">
                    {(budgetData.filter(b => b.actual <= b.budget).length / budgetData.length * 100).toFixed(0)}%
                  </span>
                </div>s
                <div className="flex items-center justify-between">
                  <span>Emergency Fund Goal</span>
                  <span className="font-medium">
                    {Math.min((netBalance / (totalExpenses * 3)) * 100, 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;