"use client";

import { usePatientContext } from "./PatientContext";

export default function PatientSwitcher() {
  const { patients, selectedPatientId, setSelectedPatientId, isFamilyPlan } = usePatientContext();

  if (!isFamilyPlan || patients.length < 2) return null;

  return (
    <div className="flex gap-2 mb-6">
      {patients.map((p, i) => (
        <button
          key={p.id}
          onClick={() => setSelectedPatientId(p.id)}
          className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
            selectedPatientId === p.id
              ? "bg-teal text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Parent {i + 1}: {p.firstName} {p.lastName}
        </button>
      ))}
    </div>
  );
}
