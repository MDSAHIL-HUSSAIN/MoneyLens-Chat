import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = "http://localhost:8000";

export default function ReminderForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    subject: "", description: "", date: "", time: "", duration: 30,
  });
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    try {
      const { data } = await axios.get(`${API}/auth/login`);
      window.open(data.auth_url, "_blank"); // Open in new tab
    } catch (err) {
      setStatus("Failed to connect to Google Calendar");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("Creating...");
    setIsLoading(true);
    try {
      const { data } = await axios.post(`${API}/create-reminder`, form);
      setStatus(data.message);
      setForm({ subject: "", description: "", date: "", time: "", duration: 30 });
    } catch (err) {
      setStatus(err.response?.data?.detail || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-white rounded-lg transition-all shadow-sm hover:shadow-md"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <h1 className="text-2xl font-semibold text-gray-800">Create Reminder</h1>
          <div className="w-24"></div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Google Calendar Section */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Step 1: Connect Calendar</h2>
            <p className="text-gray-600 mb-4">Connect your Google Calendar to create reminders</p>
            <button
              onClick={handleLogin}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              <span>📅</span>
              <span>Connect Google Calendar</span>
            </button>
          </div>

          {/* Reminder Form Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Set Reminder Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <input
                  name="subject"
                  type="text"
                  placeholder="e.g., Pay Credit Card Bill"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  placeholder="Add any additional details..."
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <input
                    name="time"
                    type="time"
                    value={form.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  name="duration"
                  type="number"
                  min="15"
                  max="480"
                  value={form.duration}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Status Message */}
              {status && (
                <div className={`p-4 rounded-lg ${status.includes("failed") || status.includes("Error") || status.includes("wrong") ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                  {status}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Create Reminder"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}