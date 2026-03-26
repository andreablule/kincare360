"use client";

import { useEffect, useState } from "react";

interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notifyUpdates: boolean;
}

export default function FamilyPage() {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/family-members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.items || []);
        setLoading(false);
      });
  }, []);

  function addMember() {
    setMembers([...members, { name: "", relationship: "", phone: "", email: "", notifyUpdates: true }]);
  }

  async function saveMember(member: FamilyMember, index: number) {
    setSaving(true);
    const method = member.id ? "PUT" : "POST";
    const res = await fetch("/api/family-members" + (member.id ? `?id=${member.id}` : ""), {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(member),
    });
    const data = await res.json();
    if (data.item) {
      const updated = [...members];
      updated[index] = data.item;
      setMembers(updated);
    }
    setSaving(false);
  }

  async function removeMember(member: FamilyMember, index: number) {
    if (member.id) {
      await fetch(`/api/family-members?id=${member.id}`, { method: "DELETE" });
    }
    setMembers(members.filter((_, i) => i !== index));
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal";

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Family Members</h1>
        <button onClick={addMember} className="text-sm bg-teal text-white px-4 py-2 rounded-full font-medium hover:bg-teal-dark">
          + Add Member
        </button>
      </div>

      {members.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">No family members added.</p>
          <p className="text-gray-400 text-sm mb-4">Add family members to receive updates and alerts about your loved one.</p>
          <button onClick={addMember} className="bg-teal text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-dark">
            Add Family Member
          </button>
        </div>
      )}

      <div className="space-y-4">
        {members.map((member, i) => (
          <div key={member.id || `new-${i}`} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  className={inputClass}
                  value={member.name}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], name: e.target.value }; setMembers(u); }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Relationship</label>
                <input
                  className={inputClass}
                  value={member.relationship}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], relationship: e.target.value }; setMembers(u); }}
                  placeholder="e.g. Daughter, Son"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                <input
                  type="tel"
                  className={inputClass}
                  value={member.phone}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], phone: e.target.value }; setMembers(u); }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={member.email}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], email: e.target.value }; setMembers(u); }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { const u = [...members]; u[i] = { ...u[i], notifyUpdates: !u[i].notifyUpdates }; setMembers(u); }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  member.notifyUpdates
                    ? "bg-teal/10 text-teal border border-teal/30"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-colors ${
                  member.notifyUpdates ? "bg-teal border-teal" : "bg-white border-gray-300"
                }`} />
                Notifications {member.notifyUpdates ? "ON" : "OFF"}
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => saveMember(member, i)}
                  disabled={saving}
                  className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg font-medium hover:bg-teal-dark disabled:opacity-40"
                >
                  {member.id ? "Update" : "Save"}
                </button>
                <button
                  onClick={() => removeMember(member, i)}
                  className="text-xs text-red-500 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
