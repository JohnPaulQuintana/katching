// -- imports --
import { useEffect, useState } from "react";
import axios from "axios";
import { getToken, getName, removeToken } from "../auth";
import { useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { format, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faChartPie,
  faReceipt,
} from "@fortawesome/free-solid-svg-icons";
import { motion, AnimatePresence } from "framer-motion";

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

// -- types --
type SavingRecord = {
  id: number;
  amount: number;
  date: string;
};

const Dashboard = () => {
  const [records, setRecords] = useState<SavingRecord[]>([]);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [filter, setFilter] = useState("daily");
  const [chartData, setChartData] = useState<any>(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    const headers = { Authorization: `Bearer ${getToken()}` };
    try {
      const [savingsRes, goalRes] = await Promise.all([
        axios.get("https://katching-backend.vercel.app/api/savings", { headers }),
        axios.get("https://katching-backend.vercel.app/api/goals", { headers }),
      ]);
      setRecords(savingsRes.data);
      setGoal(goalRes.data.target_amount);
    } catch {
      setToast("⚠️ Failed to load data.");
    }
  };

  const updateChart = () => {
    const grouped: Record<string, number> = {};
    const now = new Date();

    for (const r of records) {
      const date = parseISO(r.date);

      // Filter for current month only in "daily" view
      if (
        filter === "daily" &&
        (date.getFullYear() !== now.getFullYear() ||
          date.getMonth() !== now.getMonth())
      ) {
        continue;
      }

      // Filter for current year only in "monthly" view
      if (filter === "monthly" && date.getFullYear() !== now.getFullYear()) {
        continue;
      }

      let key = format(date, "MM-dd");
      if (filter === "monthly") key = format(date, "yyyy-MM");
      if (filter === "yearly") key = format(date, "yyyy");

      grouped[key] = (grouped[key] || 0) + r.amount;
    }

    const labels = Object.keys(grouped).sort();
    let cumulativeTotal = 0;
    const savingsData = labels.map((l) => {
      cumulativeTotal += grouped[l];
      return cumulativeTotal;
    });

    const goalLine = Array(labels.length).fill(goal);

    setChartData({
      labels,
      datasets: [
        {
          label: "Cumulative Savings",
          data: savingsData,
          borderColor: "#4f46e5",
          backgroundColor: "#c7d2fe",
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          yAxisID: "y",
        },
        {
          label: "Target Goal",
          data: goalLine,
          borderColor: "#f43f5e",
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          yAxisID: "y2",
        },
      ],
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setLoading(true);
    try {
      const res = await axios.post(
        "https://katching-backend.vercel.app/api/savings",
        { amount: parseFloat(amount) },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setAmount("");
      setToast("✅ Saved successfully!");
      setHighlightId(res.data.id);
      fetchData();
    } catch {
      setToast("❌ Failed to save. Try again.");
    } finally {
      setLoading(false);
      setTimeout(() => setToast(""), 3000);
      setTimeout(() => setHighlightId(null), 1500);
    }
  };

  const handleUpdateGoal = async () => {
    try {
      const res = await axios.put(
        "https://katching-backend.vercel.app/api/goals/",
        { target_amount: parseFloat(goalInput) },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setGoal(res.data.target_amount);
      setEditingGoal(false);
      setToast("✅ Goal updated!");
    } catch {
      setToast("❌ Failed to update goal");
    } finally {
      setTimeout(() => setToast(""), 3000);
    }
  };

  const logout = () => {
    removeToken();
    navigate("/");
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (records.length && goal !== null) updateChart();
  }, [records, goal, filter]);

  const total = records.reduce((sum, r) => sum + r.amount, 0);
  const lastSavedDate =
    records.length > 0
      ? new Date(records[records.length - 1].date).toLocaleDateString()
      : "-";

  const todaysRecords = records.filter(
    (r) =>
      format(new Date(r.date), "yyyy-MM-dd") ===
      format(new Date(), "yyyy-MM-dd")
  );

  return (
    <div className="min-h-screen bg-white px-4 py-2 sm:px-6 lg:px-8">
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black text-white text-sm px-5 py-2 rounded-full z-50 animate-fadeIn">
          {toast}
        </div>
      )}

      <header className="sticky top-0 bg-white py-4 flex justify-between items-center mb-6 z-10">
        <h1 className="text-2xl font-bold text-indigo-600">💰 Kaching</h1>
        <button
          onClick={logout}
          className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faRightFromBracket} /> Logout
        </button>
      </header>
      <header className="text-base flex gap-2 justify-between">
        <p className="font-bold text-gray-500">Welcome Back!,</p>
        <h1 className="font-bold text-indigo-500 bg-white text-xl px-1">
          {getName()}
        </h1>
      </header>
      <section className="rounded-xl p-6 mb-6 shadow-lg bg-gradient-to-br from-indigo-50 via-white to-emerald-50 backdrop-blur-md border border-indigo-100">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left w-full sm:w-auto">
            <p className="text-sm text-gray-600">Total Savings</p>
            <motion.h2
              className="text-5xl font-extrabold text-emerald-600 drop-shadow-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
            >
              ₱{total.toLocaleString("en-PH")}
            </motion.h2>

            <p className="text-sm text-gray-400">Last saved: {lastSavedDate}</p>
            {goal !== null && (
              <div className="mt-3 text-left">
                {!editingGoal ? (
                  <p className="inline-flex items-center gap-2 text-sm text-gray-500 bg-white px-2 py-1 rounded-full shadow-inner">
                    🎯 Goal: ₱{goal.toLocaleString()}
                    <button
                      onClick={() => {
                        setGoalInput(goal.toString());
                        setEditingGoal(true);
                      }}
                      className="text-blue-500 underline text-xs hover:text-blue-700"
                    >
                      Edit
                    </button>
                  </p>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      className="px-2 py-1 border rounded-md text-sm max-w-[150px]"
                    />
                    <button
                      onClick={handleUpdateGoal}
                      className="text-sm bg-indigo-600 text-white px-2 py-1 rounded-md"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGoal(false)}
                      className="text-sm text-gray-500 underline"
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {goal > 0 && (
                  <div className="w-full h-2 bg-gray-300 rounded-full mt-2 overflow-hidden">
                    <motion.div
                      className={`h-2 rounded-full ${
                        total / goal >= 1
                          ? "bg-emerald-500"
                          : total / goal >= 0.5
                          ? "bg-amber-400"
                          : "bg-blue-500"
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((total / goal) * 100, 100)}%`,
                      }}
                      transition={{ duration: 1.2 }}
                    />
                  </div>
                )}
                {records.length >= 1 && goal > total && (
                  <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-700 space-y-2 shadow-sm">
                    {(() => {
                      const sortedRecords = [...records].sort(
                        (a, b) =>
                          new Date(a.date).getTime() -
                          new Date(b.date).getTime()
                      );
                      const recentInput =
                        sortedRecords.length > 0
                          ? sortedRecords[sortedRecords.length - 1].amount
                          : 1;
                      const totalSaved = total;
                      const uniqueDates = new Set(
                        records.map((r) =>
                          format(new Date(r.date), "yyyy-MM-dd")
                        )
                      );
                      const daysWithSaving = uniqueDates.size;
                      const averagePerDay = totalSaved / daysWithSaving;
                      const remaining = goal! - total;
                      const daysFromRecent = remaining / recentInput;
                      const daysFromPattern = remaining / averagePerDay;
                      const calendarDays =
                        sortedRecords.length > 0
                          ? Math.ceil(
                              (new Date(
                                sortedRecords[sortedRecords.length - 1].date
                              ).getTime() -
                                new Date(sortedRecords[0].date).getTime()) /
                                (1000 * 60 * 60 * 24) +
                                1
                            )
                          : 0;

                      return (
                        <>
                          <div className="flex items-start gap-2">
                            <span className="text-xl">📊</span>
                            <p>
                              Based on your{" "}
                              <span className="font-semibold">
                                most recent input
                              </span>{" "}
                              of{" "}
                              <span className="font-bold text-green-600">
                                ₱{recentInput.toFixed(2)}
                              </span>
                              , you’ll reach your goal in{" "}
                              <span className="font-bold text-amber-600">
                                {Math.ceil(daysFromRecent)} days
                              </span>
                              .
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="text-xl">💡</span>
                            <p>
                              Based on your{" "}
                              <span className="font-semibold">
                                average saving habit
                              </span>{" "}
                              (
                              <span className="text-indigo-500 font-semibold">
                                ₱{averagePerDay.toFixed(2)}/day
                              </span>
                              ), you’ll reach your goal in{" "}
                              <span className="font-bold text-amber-600">
                                {Math.ceil(daysFromPattern)} days
                              </span>
                              .
                            </p>
                          </div>

                          <div className="text-gray-500 text-xs mt-2 pl-7">
                            📆 You saved on{" "}
                            <span className="font-medium text-indigo-600">
                              {daysWithSaving}
                            </span>{" "}
                            days over{" "}
                            <span className="font-medium text-indigo-600">
                              {calendarDays}
                            </span>{" "}
                            calendar days.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
                {records.length >= 1 && total >= goal && (
                  <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4 text-sm text-green-700 space-y-2 shadow-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">🎉</span>
                      <p>
                        Congratulations! You've reached your savings goal of{" "}
                        <span className="font-bold text-green-600">
                          ₱{goal.toFixed(2)}
                        </span>
                        !
                      </p>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-xl">💰</span>
                      <p>
                        You’ve saved a total of{" "}
                        <span className="font-bold text-indigo-700">
                          ₱{total.toFixed(2)}
                        </span>
                        , which{" "}
                        <span className="font-semibold text-emerald-600">
                          surpasses your target
                        </span>
                        . Keep up the great habit!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={handleAdd}
            className="flex flex-col sm:flex-row gap-2 items-center w-full sm:w-auto"
          >
            <label htmlFor="amount" className="font-bold text-indigo-700">
              Ready to Save?
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
              className="px-3 py-2 border rounded-md focus:ring focus:ring-indigo-300 w-full sm:w-auto"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md w-full sm:w-auto"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          {["daily", "monthly", "yearly"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm border transition shadow-sm ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-gray-700 hover:bg-indigo-50"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="mt-4 w-full h-96 sm:h-96">
          {chartData ? (
            <Line
              data={chartData}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: {
                      boxWidth: 12,
                      padding: 15,
                    },
                  },
                },
                layout: {
                  padding: {
                    top: 10,
                    bottom: 10,
                  },
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "Date",
                    },
                  },
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Savings (₱)",
                    },
                    ticks: {
                      callback: (value) => `₱${value}`,
                    },
                  },
                  y2: {
                    position: "right",
                    display: true,
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: "Goal (₱)",
                    },
                    grid: {
                      drawOnChartArea: false,
                    },
                    ticks: {
                      callback: (value) => `₱${value}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <p className="text-sm text-gray-500">Loading chart...</p>
          )}
        </div>
      </section>

      <section className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-lg p-6 mb-20">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          🗓️ Saving History{" "}
          <span className="text-sm text-gray-400">(Today)</span>
        </h3>

        {todaysRecords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center">
            No records for today
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence>
              {todaysRecords.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className={`rounded-xl border px-5 py-4 shadow-sm transition hover:shadow-md bg-white hover:scale-[1.01] ${
                      record.id === highlightId
                        ? "border-green-400 bg-green-50"
                        : "border-gray-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="text-lg font-bold text-indigo-600">
                          ₱{record.amount.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Date</p>
                        <p className="text-sm text-gray-700">
                          {new Date(record.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg flex justify-around py-3 z-40 backdrop-blur-md">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex flex-col items-center gap-0.5 transition transform hover:scale-105 ${
            location.pathname === "/dashboard"
              ? "text-indigo-600 font-semibold"
              : "text-gray-500 hover:text-indigo-500"
          }`}
        >
          <FontAwesomeIcon icon={faChartPie} className="text-xl" />
          <span className="text-xs">Dashboard</span>
        </button>

        <button
          onClick={() => navigate("/records")}
          className={`flex flex-col items-center gap-0.5 transition transform hover:scale-105 ${
            location.pathname === "/records"
              ? "text-indigo-600 font-semibold"
              : "text-gray-500 hover:text-indigo-500"
          }`}
        >
          <FontAwesomeIcon icon={faReceipt} className="text-xl" />
          <span className="text-xs">Records</span>
        </button>
        {/* 
  <button
    onClick={() => navigate("/goal")}
    className={`flex flex-col items-center gap-0.5 transition transform hover:scale-105 ${
      location.pathname === "/goal"
        ? "text-indigo-600 font-semibold"
        : "text-gray-500 hover:text-indigo-500"
    }`}
  >
    <FontAwesomeIcon icon={faBullseye} className="text-xl" />
    <span className="text-xs">Goal</span>
  </button> */}
      </nav>
    </div>
  );
};

export default Dashboard;
