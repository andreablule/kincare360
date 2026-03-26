"use client";

import { useEffect, useState } from "react";

interface ServiceRequest {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

const requestTypes = [
  { value: "APPOINTMENT", label: "Appointment Scheduling" },
  { value: "FOLLOWUP", label: "Follow-up Request" },
  { value: "MEDICATION_CHANGE", label: "Medication Change" },
  { value: "OTHER", label: "Other" },
];

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  DONE: "bg-green-100 text-green-700",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DONE: "Completed",
};

export default function RequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("APPOINTMENT");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRequests();
  }, []);

  function loadRequests() {
    fetch("/api/service-requests")
      .then((r) => r.json())
      .then((data) => {
        setRequests(data.items || []);
        setLoading(false);
      });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    await fetch("/api/service-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, description }),
    });
    setDescription("");
    setSubmitting(false);
    loadRequests();
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Service Requests</h1>

      {/* New request form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-semibold text-navy mb-3">Submit a New Request</h2>

        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Request Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal"
            >
              {requestTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal resize-none"
            placeholder="Describe what you need..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !description.trim()}
          className="bg-teal text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-teal-dark disabled:opacity-40"
        >
          {submitting ? "Submitting..." : "Submit Request"}
        </button>
      </form>

      {/* Past requests */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Your Requests</h2>

        {requests.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 font-medium">No requests yet.</p>
            <p className="text-xs text-gray-400 mt-1">Submit a request for appointment scheduling or prescription refills.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="border border-gray-100 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="text-sm font-medium text-navy">
                      {requestTypes.find((t) => t.value === req.type)?.label || req.type}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[req.status] || "bg-gray-100 text-gray-600"}`}>
                    {statusLabels[req.status] || req.status.replace("_", " ")}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{req.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
