import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const PLAN_PRICES: Record<string, number> = { BASIC: 99, STANDARD: 199, PREMIUM: 299 };

export default async function ClientDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  const currentUser = session?.user as any;
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.email !== "hello@kincare360.com")) {
    redirect("/admin");
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, plan: true, subscriptionStatus: true, stripeCustomerId: true, createdAt: true },
  });

  if (!user) redirect("/admin");

  const patient = await prisma.patient.findFirst({
    where: { userId: user.id },
    include: {
      doctors: true,
      pharmacies: true,
      medications: true,
      conditions: true,
      familyMembers: true,
      callLogs: { orderBy: { callDate: "desc" } },
      serviceRequests: { orderBy: { createdAt: "desc" } },
    },
  });

  // Stripe trial end
  let trialEnd: string | null = null;
  if (user.subscriptionStatus === "trialing" && user.stripeCustomerId) {
    const SK = process.env.STRIPE_SECRET_KEY;
    if (SK) {
      try {
        const auth = Buffer.from(SK + ":").toString("base64");
        const res = await fetch(
          "https://api.stripe.com/v1/subscriptions?customer=" + user.stripeCustomerId + "&status=trialing&limit=1",
          { headers: { Authorization: "Basic " + auth }, cache: "no-store" }
        );
        const sdata = await res.json();
        if (sdata?.data?.[0]?.trial_end) {
          trialEnd = new Date(sdata.data[0].trial_end * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      } catch {}
    }
  }

  const mrr = PLAN_PRICES[user.plan || ""] || 0;
  const totalCalls = patient?.callLogs?.length || 0;
  const urgentCalls = patient?.callLogs?.filter((c) => c.urgent).length || 0;
  const pendingRequests = patient?.serviceRequests?.filter((r) => r.status === "PENDING").length || 0;

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* HEADER */}
      <header className="bg-[#0f172a] border-b border-[#1e293b]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white text-xl font-bold tracking-tight">KinCare360</span>
            <span className="bg-teal/20 text-teal text-xs font-semibold px-2.5 py-1 rounded-full">Admin</span>
          </div>
          <Link href="/admin" className="text-sm text-teal hover:text-teal/80 transition-colors font-medium">
            &larr; Back to Admin
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Client Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[#0f172a]">{user.name || "Unnamed"}</h1>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{user.role}</span>
            {user.subscriptionStatus === "active" ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Active</span>
            ) : user.subscriptionStatus === "trialing" ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">Trial</span>
            ) : user.subscriptionStatus === "past_due" ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Past Due</span>
            ) : (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">{user.subscriptionStatus || "—"}</span>
            )}
            {user.plan === "PREMIUM" ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gradient-to-r from-teal to-blue-500 text-white">PREMIUM</span>
            ) : user.plan === "STANDARD" ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">STANDARD</span>
            ) : user.plan ? (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{user.plan}</span>
            ) : null}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>

        {/* SECTION: Overview */}
        <div className="mb-10">
          <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-teal rounded-full"></span>
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Subscription Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Subscription</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Plan</span><span className="font-semibold text-[#0f172a]">{user.plan || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-semibold text-[#0f172a]">{user.subscriptionStatus || "—"}</span></div>
                {trialEnd && <div className="flex justify-between"><span className="text-gray-500">Trial Ends</span><span className="font-semibold text-[#0f172a]">{trialEnd}</span></div>}
                <div className="flex justify-between"><span className="text-gray-500">Stripe ID</span><span className="font-mono text-xs text-gray-600">{user.stripeCustomerId || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">MRR</span><span className="font-semibold text-green-600">${mrr}/mo</span></div>
              </div>
            </div>

            {/* Account Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Account</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-semibold text-[#0f172a]">{user.email}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Role</span><span className="font-semibold text-[#0f172a]">{user.role}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Joined</span><span className="font-semibold text-[#0f172a]">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Last Login</span><span className="font-semibold text-[#0f172a]">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span></div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Quick Stats</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-2xl font-bold text-[#0f172a]">{totalCalls}</div>
                  <div className="text-xs text-gray-500">Total Calls</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${urgentCalls > 0 ? "text-red-600" : "text-[#0f172a]"}`}>{urgentCalls}</div>
                  <div className="text-xs text-gray-500">Urgent Calls</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${pendingRequests > 0 ? "text-orange-600" : "text-[#0f172a]"}`}>{pendingRequests}</div>
                  <div className="text-xs text-gray-500">Pending Requests</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION: Patient Profile */}
        {patient && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal rounded-full"></span>
              Patient Profile
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              {/* Basic Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "Name", value: `${patient.firstName} ${patient.lastName}` },
                  { label: "DOB", value: patient.dob ? new Date(patient.dob).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—" },
                  { label: "Phone", value: patient.phone || "—" },
                  { label: "Gender", value: patient.gender || "—" },
                  { label: "Address", value: patient.address || "—" },
                  { label: "City/State/ZIP", value: [patient.city, patient.state, patient.zip].filter(Boolean).join(", ") || "—" },
                  { label: "Preferred Call Time", value: (patient as any).preferredCallTime || "—" },
                  { label: "Medication Reminder Times", value: (patient as any).medicationReminderTime || "—" },
                  { label: "Check-in Days", value: (patient as any).checkInDays || "—" },
                ].map((field) => (
                  <div key={field.label}>
                    <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">{field.label}</div>
                    <div className="text-sm font-semibold text-[#0f172a]">{field.value}</div>
                  </div>
                ))}
              </div>

              {/* Doctors */}
              {patient.doctors.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Doctors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patient.doctors.map((doc: any) => (
                      <div key={doc.id} className="bg-gray-50 rounded-xl p-4 text-sm">
                        <div className="font-semibold text-[#0f172a]">{doc.name}</div>
                        {doc.specialty && <div className="text-gray-500">{doc.specialty}</div>}
                        {doc.phone && <div className="text-gray-500">{doc.phone}</div>}
                        {doc.address && <div className="text-gray-400 text-xs">{doc.address}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pharmacies */}
              {patient.pharmacies.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Pharmacies</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patient.pharmacies.map((ph: any) => (
                      <div key={ph.id} className="bg-gray-50 rounded-xl p-4 text-sm">
                        <div className="font-semibold text-[#0f172a]">{ph.name}</div>
                        {ph.phone && <div className="text-gray-500">{ph.phone}</div>}
                        {ph.address && <div className="text-gray-400 text-xs">{ph.address}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Medications */}
              {patient.medications.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Medications</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patient.medications.map((med: any) => (
                      <div key={med.id} className="bg-gray-50 rounded-xl p-4 text-sm">
                        <div className="font-semibold text-[#0f172a]">{med.name}</div>
                        <div className="text-gray-500">{[med.dosage, med.frequency].filter(Boolean).join(" — ")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Conditions */}
              {patient.conditions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Conditions</h3>
                  <div className="flex flex-wrap gap-2">
                    {patient.conditions.map((cond: any) => (
                      <span key={cond.id} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-50 text-orange-700">
                        {cond.name}{cond.notes ? ` — ${cond.notes}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Insurance */}
              {(patient as any).insuranceCompany && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Insurance</h3>
                  <div className="bg-gray-50 rounded-xl p-4 text-sm grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><div className="text-xs text-gray-500 mb-1">Company</div><div className="font-semibold text-[#0f172a]">{(patient as any).insuranceCompany}</div></div>
                    <div><div className="text-xs text-gray-500 mb-1">Member ID</div><div className="font-semibold text-[#0f172a]">{(patient as any).insuranceMemberId || "—"}</div></div>
                    <div><div className="text-xs text-gray-500 mb-1">Group Number</div><div className="font-semibold text-[#0f172a]">{(patient as any).insuranceGroupNumber || "—"}</div></div>
                    <div><div className="text-xs text-gray-500 mb-1">Policy Holder</div><div className="font-semibold text-[#0f172a]">{(patient as any).insurancePolicyHolder || "—"}</div></div>
                  </div>
                </div>
              )}

              {/* Family Members */}
              {patient.familyMembers.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Family Members</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {patient.familyMembers.map((fm: any) => (
                      <div key={fm.id} className="bg-gray-50 rounded-xl p-4 text-sm">
                        <div className="font-semibold text-[#0f172a]">{fm.name}</div>
                        <div className="text-gray-500">{fm.relationship}{fm.role ? ` (${fm.role})` : ""}</div>
                        {fm.phone && <div className="text-gray-400">{fm.phone}</div>}
                        {fm.email && <div className="text-gray-400">{fm.email}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION: Call History */}
        {patient && patient.callLogs.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal rounded-full"></span>
              Call History
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{patient.callLogs.length}</span>
            </h2>
            <div className="space-y-3">
              {patient.callLogs.map((log: any) => {
                const moodColor = log.mood === "happy" ? "bg-green-100 text-green-700"
                  : (log.mood === "sad" || log.mood === "concerned") ? "bg-red-100 text-red-700"
                  : log.mood ? "bg-gray-100 text-gray-600" : null;
                const transcript = log.transcript || "";
                const truncatedTranscript = transcript.length > 200 ? transcript.slice(0, 200) + "... [full transcript available]" : transcript;
                return (
                  <div key={log.id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-sm font-semibold text-[#0f172a]">
                        {new Date(log.callDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}{" "}
                        {new Date(log.callDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      {log.callType && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.callType}</span>
                      )}
                      {log.urgent && (
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">{"\u26A0"} Urgent</span>
                      )}
                      {moodColor && (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${moodColor}`}>{log.mood}</span>
                      )}
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${log.medicationsTaken ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                        Meds: {log.medicationsTaken ? "Yes" : "No"}
                      </span>
                    </div>
                    {log.summary && (
                      <p className="text-sm text-gray-700 mb-2">{log.summary}</p>
                    )}
                    {transcript && (
                      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono whitespace-pre-wrap">
                        {truncatedTranscript}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: Service Requests */}
        {patient && patient.serviceRequests.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[#0f172a] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-teal rounded-full"></span>
              Service Requests
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2.5 py-1 rounded-full">{patient.serviceRequests.length}</span>
            </h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Created</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patient.serviceRequests.map((r: any) => {
                      const statusColor = r.status === "PENDING" ? "bg-yellow-100 text-yellow-700"
                        : r.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700"
                        : r.status === "DONE" ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600";
                      const desc = r.description || "";
                      const lines = desc.split("\n").filter(Boolean);
                      const dateLine = lines.find((l: string) => /^DATE:/i.test(l));
                      const doctorLine = lines.find((l: string) => /^DOCTOR:/i.test(l));
                      const doctorPhoneLine = lines.find((l: string) => /^DOCTOR PHONE:/i.test(l));
                      const notesLine = lines.find((l: string) => /^NOTES:/i.test(l));
                      return (
                        <tr key={r.id} className="border-b border-gray-50">
                          <td className="px-4 py-4">
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{r.type}</span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </td>
                          <td className="px-4 py-4 text-gray-600 text-xs">
                            <div className="space-y-0.5">
                              {dateLine && <div>{dateLine}</div>}
                              {doctorLine && <div>{doctorLine}</div>}
                              {doctorPhoneLine && <div>{doctorPhoneLine}</div>}
                              {notesLine && <div>{notesLine}</div>}
                              {!dateLine && !doctorLine && !notesLine && <div>{desc.slice(0, 120)}</div>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
