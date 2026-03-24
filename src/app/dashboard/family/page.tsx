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
          <p className="text-gray-400 mb-4">No family members added yet.</p>
          <button onClick={addMember} className="text-teal font-medium hover:underline text-sm">
            Add your first family member
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
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={member.notifyUpdates}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], notifyUpdates: e.target.checked }; setMembers(u); }}
                  className="w-4 h-4 accent-teal"
                />
                <span className="text-sm text-gray-600">Receive update notifications</span>
              </label>
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
