"use client";

import { useEffect, useState } from "react";

interface Doctor { id?: string; name: string; specialty: string; phone: string; address: string; notes: string; }
interface Pharmacy { id?: string; name: string; phone: string; address: string; }
interface Medication { id?: string; name: string; dosage: string; frequency: string; instructions: string; }
interface Condition { id?: string; name: string; notes: string; }

function Section<T extends { id?: string }>({
  title,
  items,
  setItems,
  endpoint,
  fields,
  emptyItem,
}: {
  title: string;
  items: T[];
  setItems: (items: T[]) => void;
  endpoint: string;
  fields: { key: keyof T; label: string; type?: string }[];
  emptyItem: T;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSave(item: T, index: number) {
    setSaving(true);
    const method = item.id ? "PUT" : "POST";
    const res = await fetch(endpoint + (item.id ? `?id=${item.id}` : ""), {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (data.item) {
      const updated = [...items];
      updated[index] = data.item;
      setItems(updated);
    }
    setSaving(false);
  }

  async function handleDelete(item: T, index: number) {
    if (!item.id) {
      setItems(items.filter((_, i) => i !== index));
      return;
    }
    await fetch(`${endpoint}?id=${item.id}`, { method: "DELETE" });
    setItems(items.filter((_, i) => i !== index));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-navy">{title}</h2>
        <button
          onClick={() => setItems([...items, { ...emptyItem }])}
          className="text-sm text-teal font-medium hover:underline"
        >
          + Add
        </button>
      </div>

      {items.length === 0 && <p className="text-sm text-gray-400">None added yet.</p>}

      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={item.id || `new-${i}`} className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              {fields.map((f) => (
                <div key={String(f.key)}>
                  <label className="block text-xs font-medium text-gray-500 mb-1">{f.label}</label>
                  <input
                    type={f.type || "text"}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal"
                    value={String(item[f.key] || "")}
                    onChange={(e) => {
                      const updated = [...items];
                      (updated[i] as any)[f.key] = e.target.value;
                      setItems(updated);
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(item, i)}
                disabled={saving}
                className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg font-medium hover:bg-teal-dark disabled:opacity-40"
              >
                {item.id ? "Update" : "Save"}
              </button>
              <button
                onClick={() => handleDelete(item, i)}
                className="text-xs text-red-500 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MedicalPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/doctors").then((r) => r.json()),
      fetch("/api/pharmacies").then((r) => r.json()),
      fetch("/api/medications").then((r) => r.json()),
      fetch("/api/conditions").then((r) => r.json()),
    ]).then(([d, p, m, c]) => {
      setDoctors(d.items || []);
      setPharmacies(p.items || []);
      setMedications(m.items || []);
      setConditions(c.items || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">Medical Records</h1>

      <Section<Doctor>
        title="Doctors"
        items={doctors}
        setItems={setDoctors}
        endpoint="/api/doctors"
        emptyItem={{ name: "", specialty: "", phone: "", address: "", notes: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "specialty", label: "Specialty" },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "address", label: "Address" },
          { key: "notes", label: "Notes" },
        ]}
      />

      <Section<Pharmacy>
        title="Pharmacies"
        items={pharmacies}
        setItems={setPharmacies}
        endpoint="/api/pharmacies"
        emptyItem={{ name: "", phone: "", address: "" }}
        fields={[
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "address", label: "Address" },
        ]}
      />

      <Section<Medication>
        title="Medications"
        items={medications}
        setItems={setMedications}
        endpoint="/api/medications"
        emptyItem={{ name: "", dosage: "", frequency: "", instructions: "" }}
        fields={[
          { key: "name", label: "Medication Name" },
          { key: "dosage", label: "Dosage" },
          { key: "frequency", label: "Frequency" },
          { key: "instructions", label: "Instructions" },
        ]}
      />

      <Section<Condition>
        title="Conditions"
        items={conditions}
        setItems={setConditions}
        endpoint="/api/conditions"
        emptyItem={{ name: "", notes: "" }}
        fields={[
          { key: "name", label: "Condition" },
          { key: "notes", label: "Notes" },
        ]}
      />
    </div>
  );
}
