"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface LinkedUser {
  id: string;
  role: string;
  inviteToken: string | null;
  inviteExpiry: string | null;
}

interface FamilyMember {
  id?: string;
  name: string;
  relationship: string;
  phone: string;
  email: string;
  notifyUpdates: boolean;
  inviteStatus?: "none" | "pending" | "active";
  linkedRole?: string | null;
  user?: LinkedUser | null;
}

function RoleBadge({ role }: { role: string | null | undefined }) {
  if (!role || role === "FAMILY") {
    return (
      <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
        Family Member
      </span>
    );
  }
  if (role === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal/10 text-teal px-2 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
        </svg>
        Manager
      </span>
    );
  }
  return null;
}

function InviteStatusBadge({ status, email }: { status?: string; email?: string }) {
  if (!email) return null;
  if (status === "active") {
    return (
      <span className="text-xs bg-green-100 text-green-700 font-medium px-2 py-0.5 rounded-full">
        ✓ Active
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="text-xs bg-yellow-100 text-yellow-700 font-medium px-2 py-0.5 rounded-full">
        ⏳ Invited (pending)
      </span>
    );
  }
  return null;
}

export default function FamilyPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || "CLIENT";
  const isOwner = userRole === "CLIENT" || userRole === "ADMIN";
  const isManager = userRole === "MANAGER";

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  function loadMembers() {
    fetch("/api/family-members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data.items || []);
        setLoading(false);
      });
  }

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
      updated[index] = { ...data.item, inviteStatus: member.inviteStatus };
      setMembers(updated);
    }
    setSaving(false);
  }

  async function removeMember(member: FamilyMember, index: number) {
    if (!confirm(`Remove ${member.name || "this member"}? ${member.user ? "Their account will also be deleted." : ""}`)) return;
    if (member.id) {
      await fetch(`/api/family-members?id=${member.id}`, { method: "DELETE" });
    }
    setMembers(members.filter((_, i) => i !== index));
  }

  async function sendInvite(member: FamilyMember, index: number) {
    if (!member.email) {
      alert("Please add an email address before sending an invite.");
      return;
    }
    setInviting(member.id || `new-${index}`);
    const res = await fetch("/api/family-members/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        familyMemberId: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        relationship: member.relationship,
      }),
    });
    const data = await res.json();
    setInviting(null);
    if (data.ok) {
      setInviteSuccess(member.id || `new-${index}`);
      setTimeout(() => setInviteSuccess(null), 3000);
      loadMembers(); // Refresh to show updated status
    } else {
      alert(data.error || "Failed to send invitation.");
    }
  }

  async function toggleRole(member: FamilyMember) {
    if (!member.id) return;
    const newRole = member.linkedRole === "MANAGER" ? "FAMILY" : "MANAGER";
    setRoleChanging(member.id);
    const res = await fetch(`/api/family-members/${member.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (data.ok) {
      const updated = [...members];
      const idx = updated.findIndex((m) => m.id === member.id);
      if (idx !== -1) updated[idx] = { ...updated[idx], linkedRole: newRole };
      setMembers(updated);
    }
    setRoleChanging(null);
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-teal";

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy">Family Members</h1>
        {isOwner && (
          <button onClick={addMember} className="text-sm bg-teal text-white px-4 py-2 rounded-full font-medium hover:bg-teal-dark">
            + Add Member
          </button>
        )}
      </div>

      {/* Role explainer card — shown to owners only */}
      {isOwner && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6">
          <h2 className="text-sm font-bold text-navy mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            Access Roles
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Family Member</span>
              <span className="text-gray-600">Can view daily updates and manage their own contact info. Read-only access.</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-teal/10 text-teal px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">Manager</span>
              <span className="text-gray-600">Can also edit care records (medications, doctors) and submit requests. Cannot access billing.</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">Only you (the account owner) can grant or remove Manager access.</p>
        </div>
      )}

      {members.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium mb-1">No family members added.</p>
          <p className="text-gray-400 text-sm mb-4">Add family members to receive updates and alerts about your loved one.</p>
          {isOwner && (
            <button onClick={addMember} className="bg-teal text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-teal-dark">
              Add Family Member
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {members.map((member, i) => (
          <div key={member.id || `new-${i}`} className="bg-white rounded-2xl border border-gray-100 p-5">
            {/* Header with role + invite status */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {member.id && <RoleBadge role={member.linkedRole} />}
              {member.id && <InviteStatusBadge status={member.inviteStatus} email={member.email} />}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                <input
                  className={inputClass}
                  value={member.name}
                  disabled={userRole === "FAMILY" && member.user?.id !== (session?.user as any)?.id}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], name: e.target.value }; setMembers(u); }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Relationship</label>
                <input
                  className={inputClass}
                  value={member.relationship}
                  disabled={userRole === "FAMILY" && member.user?.id !== (session?.user as any)?.id}
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
                  disabled={userRole === "FAMILY" && member.user?.id !== (session?.user as any)?.id}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], phone: e.target.value }; setMembers(u); }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                <input
                  type="email"
                  className={inputClass}
                  value={member.email}
                  disabled={userRole === "FAMILY" && member.user?.id !== (session?.user as any)?.id}
                  onChange={(e) => { const u = [...members]; u[i] = { ...u[i], email: e.target.value }; setMembers(u); }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-2">
              {/* Notify toggle */}
              <button
                type="button"
                disabled={userRole === "FAMILY" && member.user?.id !== (session?.user as any)?.id}
                onClick={() => {
                  if (userRole === "FAMILY" && member.user?.id !== (session?.user as any)?.id) return;
                  const u = [...members]; u[i] = { ...u[i], notifyUpdates: !u[i].notifyUpdates }; setMembers(u);
                }}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  member.notifyUpdates
                    ? "bg-teal/10 text-teal border border-teal/30"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                } disabled:opacity-50`}
              >
                <div className={`w-4 h-4 rounded-full flex-shrink-0 border-2 transition-colors ${
                  member.notifyUpdates ? "bg-teal border-teal" : "bg-white border-gray-300"
                }`} />
                Notifications {member.notifyUpdates ? "ON" : "OFF"}
              </button>

              {/* Action buttons */}
              <div className="flex gap-2 flex-wrap">
                {/* Save/Update */}
                {(isOwner || isManager || member.user?.id === (session?.user as any)?.id) && (
                  <button
                    onClick={() => saveMember(member, i)}
                    disabled={saving}
                    className="text-xs bg-teal text-white px-3 py-1.5 rounded-lg font-medium hover:bg-teal-dark disabled:opacity-40"
                  >
                    {member.id ? "Update" : "Save"}
                  </button>
                )}

                {/* Invite to Dashboard — owner only */}
                {isOwner && member.email && (
                  <button
                    onClick={() => sendInvite(member, i)}
                    disabled={inviting === (member.id || `new-${i}`)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      inviteSuccess === (member.id || `new-${i}`)
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {inviteSuccess === (member.id || `new-${i}`)
                      ? "✓ Sent!"
                      : inviting === (member.id || `new-${i}`)
                      ? "Sending…"
                      : member.inviteStatus === "active"
                      ? "Resend Invite"
                      : member.inviteStatus === "pending"
                      ? "Resend Invite"
                      : "Invite to Dashboard"}
                  </button>
                )}

                {/* Role toggle — owner only, only for members with accounts */}
                {isOwner && member.id && member.inviteStatus === "active" && (
                  <button
                    onClick={() => toggleRole(member)}
                    disabled={roleChanging === member.id}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                    title={member.linkedRole === "MANAGER" ? "Remove Manager access" : "Grant Manager access"}
                  >
                    {roleChanging === member.id
                      ? "Updating…"
                      : member.linkedRole === "MANAGER"
                      ? "Remove Manager"
                      : "Make Manager"}
                  </button>
                )}

                {/* Remove — owner only */}
                {isOwner && (
                  <button
                    onClick={() => removeMember(member, i)}
                    className="text-xs text-red-500 px-3 py-1.5 rounded-lg font-medium hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
