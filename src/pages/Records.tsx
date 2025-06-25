import { useEffect, useState } from "react";
import axios from "axios";
import { getToken } from "../auth";
import { useNavigate } from "react-router-dom";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faTrash,
  faSearch,
} from "@fortawesome/free-solid-svg-icons";

type SavingRecord = {
  id: number;
  amount: number;
  date: string;
};

const Records = () => {
  const [records, setRecords] = useState<SavingRecord[]>([]);
  const [recordToDelete, setRecordToDelete] = useState<SavingRecord | null>(null);
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      const res = await axios.get("http://192.168.100.173:8000/api/savings", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setRecords(res.data);
    };
    fetchRecords();
  }, []);

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    await axios.delete(`http://192.168.100.173:8000/api/savings/${recordToDelete.id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setRecordToDelete(null);
    const res = await axios.get("http://192.168.100.173:8000/api/savings", {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    setRecords(res.data);
  };

  const filteredRecords = records.filter((record) => {
    const date = new Date(record.date);
    const matchesSearch =
      record.amount.toString().includes(search) ||
      format(date, "MMMM d, yyyy").toLowerCase().includes(search.toLowerCase());

    const matchesMonth =
      selectedMonth === "all" || format(date, "yyyy-MM") === selectedMonth;

    return matchesSearch && matchesMonth;
  });

  const groupRecordsByDate = () => {
    const grouped: Record<string, SavingRecord[]> = {};
    for (let record of filteredRecords) {
      const date = new Date(record.date);
      let key = format(date, "MMMM d, yyyy");
      if (isToday(date)) key = "Today";
      else if (isYesterday(date)) key = "Yesterday";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    }
    return grouped;
  };

  const grouped = groupRecordsByDate();

  const availableMonths = Array.from(
    new Set(records.map((r) => format(new Date(r.date), "yyyy-MM")))
  ).sort((a, b) => b.localeCompare(a)); // latest first

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
        <h1 className="text-lg font-bold text-indigo-700">💾 Saving History</h1>
        <div className="w-6" /> {/* spacer */}
      </header>

      {/* Filters */}
      <div className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="relative w-full sm:w-1/2">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute top-2.5 left-3 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by amount or date"
              className="pl-9 pr-3 py-2 border rounded-md w-full text-sm focus:ring-indigo-300 focus:border-indigo-400"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm focus:ring-indigo-300 focus:border-indigo-400"
          >
            <option value="all">All Months</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {format(parseISO(month + "-01"), "MMMM yyyy")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-28">
        {filteredRecords.length === 0 ? (
          <p className="text-center text-gray-400 mt-8">No matching savings found.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([label, items]) => (
              <div key={label}>
                <p className="text-sm text-gray-500 mb-2 font-medium">{label}</p>
                <div className="space-y-2">
                  {items.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white rounded-xl p-4 shadow flex justify-between items-center transition hover:shadow-md"
                    >
                      <div>
                        <p className="text-lg font-semibold text-green-600">
                          ₱{record.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {format(new Date(record.date), "h:mm a")}
                        </p>
                      </div>
                      <button
                        onClick={() => setRecordToDelete(record)}
                        className="text-red-500 hover:text-red-600 transition"
                        title="Delete"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t text-center py-3 text-xs text-gray-400 fixed bottom-0 w-full z-10">
        <span>© {new Date().getFullYear()} Kaching App — Version 1.0</span>
        <span className="block">Develop by: JP QUINTANA</span>
      </footer>

      {/* Delete Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-[90%] max-w-sm animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Delete Record</h2>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete{" "}
              <strong>₱{recordToDelete.amount.toFixed(2)}</strong> saved on{" "}
              {format(new Date(recordToDelete.date), "MMMM d, yyyy")}?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
