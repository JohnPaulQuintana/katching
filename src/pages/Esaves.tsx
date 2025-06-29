import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import { getToken } from "../auth";
import { Line, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

interface Expense {
  id: number;
  date: string;
  amount: number;
  category: string;
  note: string;
  tags: string[];
}

interface Reminder {
  title: string;
  due: string;
}

interface Insights {
  total_spent: number;
  top_category: { name: string; amount: number };
  daily_avg: number;
  budget_left: number;
  warning: string;
  suggestions: string[];
  upcoming_reminders: Reminder[];
  ai_summary: string;
  trend_analysis: string;
}
function Esaves() {
  const API = "https://katching-backend.vercel.app/api";
  const navigate = useNavigate();

  const [page, setPage] = useState<string>("dashboard");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [form, setForm] = useState<{
    amount: string;
    category: string;
    note: string;
  }>({ amount: "", category: "", note: "" });
  const [budget, setBudget] = useState<string>("");

  const loadExpenses = async () => {
    const res = await axios.get<Expense[]>(`${API}/expenses`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setExpenses(res.data);
  };

  const loadInsights = async () => {
    const [insightsRes, budgetRes] = await Promise.all([
      axios.get<Insights>(`${API}/insights`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
      axios.get<{ budget: number }>(`${API}/budget`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      }),
    ]);
    setInsights(insightsRes.data);
    setBudget(budgetRes.data.budget.toString());
  };

  useEffect(() => {
    loadExpenses();
    loadInsights();

    const interval = setInterval(() => {
      loadExpenses();
      loadInsights();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await axios.post(`${API}/expenses`, {
      ...form,
      amount: parseFloat(form.amount),
      date: new Date().toISOString().split("T")[0],
    });
    setForm({ amount: "", category: "", note: "" });
    loadExpenses();
    loadInsights();
    alert("Expense saved successfully!");
  };

  // const handleDelete = async (id: number) => {
  //   if (confirm("Are you sure you want to delete this expense?")) {
  //     await axios.delete(`${API}/expenses/${id}`);
  //     loadExpenses();
  //     loadInsights();
  //   }
  // };

  const renderDashboard = () => {
    if (!insights)
      return <p className="text-center text-gray-500">Loading insights...</p>;

    const dailyMap: { [key: string]: number } = {};
    const categoryMap: { [key: string]: number } = {};

    expenses.forEach((e) => {
      dailyMap[e.date] = (dailyMap[e.date] || 0) + e.amount;
      if (e.category) {
        categoryMap[e.category] = (categoryMap[e.category] || 0) + e.amount;
      }
    });
    // Prepare dailyLabels and dailyData for the Line chart
    const dailyLabels = Object.keys(dailyMap).sort();
    const dailyData = dailyLabels.map((date) => dailyMap[date]);

    const categoryLabels = Object.keys(categoryMap);
    const categoryData = Object.values(categoryMap);

    const budgetUsedPercent = Math.min(
      100,
      Number(
        (
          (insights.total_spent /
            (insights.total_spent + insights.budget_left)) *
          100
        ).toFixed(0)
      )
    );

    return (
      <div className="max-w-full px-2 py-8 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {[
            {
              icon: "💰",
              label: "Total Spent",
              value: `₱${insights.total_spent}`,
              color: "bg-green-500",
            },
            {
              icon: "📊",
              label: "Top Category",
              value: `${insights.top_category.name} (₱${insights.top_category.amount})`,
              color: "bg-red-500",
            },
            {
              icon: "📅",
              label: "Daily Average",
              value: `₱${insights.daily_avg}`,
              color: "bg-green-400",
            },
            {
              icon: "🧮",
              label: "Budget Left",
              value: `₱${insights.budget_left}`,
              color:
                insights.budget_left > 0
                  ? "bg-green-600"
                  : "bg-red-600 text-white",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-4 rounded-2xl shadow-md bg-white"
            >
              <div
                className={`${item.color} text-white p-2 rounded-full text-xl`}
              >
                {item.icon}
              </div>
              <div>
                <p className="text-sm text-gray-500">{item.label}</p>
                <p className="font-bold text-gray-800 text-base">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Budget Form */}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await axios.post(`${API}/budget`, {
              budget: parseFloat(budget),
            });
            loadInsights();
            alert("Budget updated!");
          }}
          className="bg-white p-4 rounded-xl shadow space-y-3"
        >
          <p className="text-sm font-semibold text-gray-700">
            🎯 Set or update your monthly budget
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="border border-green-400 rounded-lg px-3 py-1 w-32 text-center focus:ring-2 focus:ring-green-300 outline-none"
            />
            <button className="bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition">
              Update Budget
            </button>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
            <div
              className={`h-2 ${
                budgetUsedPercent >= 100 ? "bg-red-500" : "bg-green-500"
              }`}
              style={{ width: `${budgetUsedPercent}%` }}
            />
          </div>
        </form>

        {/* AI Summary + Trend */}
        <div className="grid md:grid-cols-2 gap-4">
          {insights.ai_summary && (
            <div className="bg-white border-l-4 border-green-500 p-4 rounded-xl text-sm text-green-900 space-y-2">
              <p className="font-semibold text-green-700">🧠 AI Summary</p>
              <p>{insights.ai_summary}</p>
            </div>
          )}
          {insights.trend_analysis && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl text-sm text-blue-900 space-y-2">
              <p className="font-semibold text-blue-700">📉 Spending Trend</p>
              <p>{insights.trend_analysis}</p>
            </div>
          )}
        </div>

        {/* Suggestions + Reminders */}
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <h3 className="font-semibold text-green-700">💡 Suggestions</h3>
            <ul className="list-disc ml-5 space-y-1">
              {insights.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div className="bg-white p-4 rounded-xl shadow space-y-2">
            <h3 className="font-semibold text-green-700">📅 Reminders</h3>
            <ul className="list-disc ml-5 space-y-1">
              {insights.upcoming_reminders.map((r, i) => (
                <li key={i}>
                  {r.title} –{" "}
                  <span className="text-red-600 font-medium">{r.due}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6 w-full">
          <div className="bg-white p-6 rounded-3xl shadow-xl ring-1 ring-green-200">
            <h3 className="text-lg font-semibold mb-4 text-green-700">
              📈 Daily Spending
            </h3>
            <Line
              data={{
                labels: dailyLabels,
                datasets: [
                  {
                    label: "Amount Spent",
                    data: dailyData,
                    fill: false,
                    borderColor: "#22c55e",
                    backgroundColor: "#86efac",
                    tension: 0.4,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "top" },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `₱${ctx.parsed.y}`,
                    },
                  },
                },
                scales: {
                  y: {
                    ticks: {
                      callback: (val) => `₱${val}`,
                    },
                  },
                },
              }}
              height={180}
            />
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl ring-1 ring-green-200">
            <h3 className="text-lg font-semibold mb-4 text-green-700">
              📊 Categories Breakdown
            </h3>
            <Pie
              data={{
                labels: categoryLabels,
                datasets: [
                  {
                    data: categoryData,
                    backgroundColor: [
                      "#22c55e",
                      "#ef4444",
                      "#10b981",
                      "#f59e0b",
                      "#3b82f6",
                      "#6b7280",
                      "#14b8a6",
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { position: "bottom" },
                },
              }}
              height={180}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderExpenses = () => {
    const filtered = expenses.filter(
      (e) =>
        e.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.category || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="max-w-4xl mx-auto p-3 space-y-4 mt-4">
        <div className="bg-white shadow-md rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            🧾 Add Expense
          </h2>
          <form
            onSubmit={handleSubmit}
            className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <input
              type="number"
              required
              placeholder="Amount (₱)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="col-span-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Category (optional)"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="col-span-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              placeholder="Note"
              required
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="col-span-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <div className="col-span-1 md:col-span-3 text-right">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-md"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow-md rounded-2xl p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📋 Recent Expenses
          </h3>
          <input
            type="text"
            placeholder="Search by note or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded-md"
          />

          {filtered.length === 0 ? (
            <p className="text-gray-500 italic">No expenses yet.</p>
          ) : (
            <ul className="space-y-3">
              {filtered.map((e) => (
                <li
                  key={e.id}
                  className="border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row md:justify-between items-start md:items-center bg-gray-50 hover:bg-gray-100 transition"
                >
                  <div>
                    <p className="text-lg font-medium text-green-700">
                      ₱{e.amount}
                    </p>
                    <p className="text-gray-700">
                      {e.category || (
                        <span className="italic text-red-600">
                          Uncategorized
                        </span>
                      )}
                    </p>
                    <p className="text-gray-500 text-sm">{e.note}</p>
                  </div>
                  <div className="mt-2 md:mt-0 text-sm text-gray-400">
                    {e.date}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  const renderSystemDetails = () => (
    <div className="max-w-3xl mx-auto p-3 space-y-6 text-gray-800 mt-6">
      <h1 className="text-2xl font-bold text-blue-700">📘 System Overview</h1>

      <div className="bg-white/80 backdrop-blur p-6 rounded-3xl shadow-xl ring-1 ring-gray-200 space-y-6 text-sm">
        <section>
          <h2 className="text-lg font-semibold text-blue-600">
            🤖 AI-Powered Insights
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Total Spending:</strong> Aggregates total expenses across
              all entries.
            </li>
            <li>
              <strong>Top Category:</strong> Identifies which category received
              the highest total spending.
            </li>
            <li>
              <strong>Daily Average:</strong> Computes daily average spending
              based on the dates of recorded expenses.
            </li>
            <li>
              <strong>Budget Monitoring:</strong> Tracks spending against a
              user-defined monthly budget, with real-time updates and a visual
              progress bar.
            </li>
            <li>
              <strong>Spending Warnings:</strong> Alerts the user when they
              exceed a defined spending threshold.
            </li>
            <li>
              <strong>Suggestions Engine:</strong> Dynamically generates
              cost-saving advice based on behavioral patterns and category
              usage.
            </li>
            <li>
              <strong>Upcoming Reminders:</strong> Displays a list of
              due-date-based events or bills from backend scheduling.
            </li>
            <li>
              <strong>AI Summary:</strong> Summarizes your financial behavior
              using context-aware text generated via lightweight AI logic.
            </li>
            <li>
              <strong>Trend Analysis:</strong> Provides visual feedback on
              monthly or weekly changes in expense behavior.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-blue-600 mt-4">
            📊 Visualization
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Line Chart:</strong> Shows daily expense trends for better
              temporal understanding.
            </li>
            <li>
              <strong>Pie Chart:</strong> Breaks down total spending by
              category.
            </li>
            <li>
              <strong>Currency Formatting:</strong> All figures formatted in
              Philippine Peso (₱) with tooltips and value labels.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-blue-600 mt-4">
            🛠️ Tech Stack
          </h2>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              <strong>Frontend:</strong> React, Chart.js, Tailwind CSS
            </li>
            <li>
              <strong>Backend:</strong> FastAPI (Python)
            </li>
            <li>
              <strong>Database:</strong> MySQL
            </li>
            <li>
              <strong>AI Logic:</strong> Uses Naive Bayes to auto-categorize
              expenses from descriptions
            </li>
            <li>
              <strong>Visualization:</strong> Chart.js for dynamic line and pie
              charts
            </li>
          </ul>
        </section>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow px-4 py-3 flex justify-between items-center">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-indigo-600 hover:underline text-sm font-medium"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Dashboard
        </button>
        <h1 className="text-lg font-bold text-indigo-700">E-SAVING</h1>
        <div className="w-6" /> {/* spacer */}
      </header>

      <main className="mb-28">
        {page === "dashboard" && renderDashboard()}
        {page === "expenses" && renderExpenses()}
        {page === "system" && renderSystemDetails()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t text-center py-3 text-xs text-gray-400 fixed bottom-0 w-full z-10">
        <div className="flex justify-around py-4 z-50">
          <button
            className={`text-center ${
              page === "dashboard"
                ? "text-green-600 font-bold"
                : "text-gray-500"
            }`}
            onClick={() => setPage("dashboard")}
          >
            📊<div className="text-xs mt-1">Dashboard</div>
          </button>
          <button
          className={`text-center ${
            page === "expenses" ? "text-green-600 font-bold" : "text-gray-500"
          }`}
          onClick={() => setPage("expenses")}
        >
          🧾<div className="text-xs mt-1">Expenses</div>
        </button>
        <button
          className={`text-center ${
            page === "system" ? "text-green-600 font-bold" : "text-gray-500"
          }`}
          onClick={() => setPage("system")}
        >
          📘<div className="text-xs mt-1">System</div>
        </button>
        </div>
        <span>© {new Date().getFullYear()} Kaching App — Version 1.0</span>
        <span className="block">Develop by: JP QUINTANA</span>
      </footer>
    </div>
  );
}

export default Esaves;
