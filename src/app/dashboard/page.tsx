import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPatientIdForUser, getAllPatientsForUser } from "@/lib/patient";
import { formatPlanName, isFamilyPlan } from "@/lib/format-plan";
import Link from "next/link";
import { redirect } from "next/navigation";
import AddSecondParentCard from "@/components/AddSecondParentCard";

async function getTrialDaysRemaining(stripeCustomerId: string | null | undefined): Promise<number | null> {
  if (!stripeCustomerId) return null;
  try {
    const SK = process.env.STRIPE_SECRET_KEY!;
    const auth = Buffer.from(`${SK}:`).toString("base64");
    const res = await fetch(
      `https://api.stripe.com/v1/subscriptions?customer=${stripeCustomerId}&status=trialing&limit=1`,
      { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" }
    );
    const data = await res.json();
    if (data?.data?.[0]?.trial_end) {
      const msLeft = data.data[0].trial_end * 1000 - Date.now();
      return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
    }
  } catch {}
  return null;
}

async function getPatientDashboardData(patientId: string) {
  const [patient, recentCall, callCount, totalAppointments, nextAppointment] = await Promise.all([
    prisma.patient.findUnique({ where: { id: patientId } }),
    prisma.callLog.findFirst({ where: { patientId }, orderBy: { callDate: "desc" } }),
    prisma.callLog.count({ where: { patientId } }),
    prisma.serviceRequest.count({ where: { patientId } }),
    prisma.serviceRequest.findFirst({
      where: { patientId, status: { in: ["DONE", "COMPLETED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { patient, recentCall, callCount, totalAppointments, nextAppointment };
}

export const metadata = {
  title: "Dashboard | KinCare360",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as any;
  const userId = sessionUser?.id;
  const userRole = sessionUser?.role || "CLIENT";
  const userPatientId = sessionUser?.patientId ?? null;

  if (userRole === "ADMIN") redirect("/admin");

  // Determine user and plan info
  const ownerUserId = (userRole === "FAMILY" || userRole === "MANAGER")
    ? (userPatientId ? (await prisma.patient.findUnique({ where: { id: userPatientId }, select: { userId: true } }))?.userId : null)
    : userId;
  const user = ownerUserId ? await prisma.user.findUnique({ where: { id: ownerUserId } }) : null;
  const trialDaysRemaining = user?.subscriptionStatus === "trialing"
    ? await getTrialDaysRemaining(user.stripeCustomerId)
    : null;

  const familyPlan = isFamilyPlan(user?.plan);

  // For family plans (CLIENT role), fetch ALL patients
  // For non-family or FAMILY/MANAGER roles, fetch just the one
  let patients: Awaited<ReturnType<typeof getPatientDashboardData>>[] = [];
  if (familyPlan && userRole === "CLIENT") {
    const allPatients = await getAllPatientsForUser(userId);
    patients = await Promise.all(allPatients.map((p) => getPatientDashboardData(p.id)));
  } else {
    const patientId = await getPatientIdForUser(userId, userRole, userPatientId);
    if (patientId) {
      patients = [await getPatientDashboardData(patientId)];
    }
  }

  const hasAnyPatient = patients.length > 0 && patients[0].patient;
  const canAddSecondParent = familyPlan && userRole === "CLIENT" && patients.length < 2;

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy mb-6">
        {(userRole === "FAMILY" || userRole === "MANAGER") && patients[0]?.patient
          ? `Viewing ${patients[0].patient.firstName} ${patients[0].patient.lastName}'s Care 💙`
          : `Welcome back, ${patients[0]?.patient?.firstName || session?.user?.name?.split(" ")[0] || "there"} 👋`}
      </h1>

      {/* Onboarding card — shown when no patient record exists */}
      {!hasAnyPatient && (
        <div className="bg-teal/5 border-2 border-teal/30 rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 bg-teal/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-navy">Complete your care profile to get started</h2>
            <p className="text-sm text-gray-500 mt-1">Set up your loved one&apos;s information so Lily can begin daily check-ins and medication reminders.</p>
          </div>
          <Link
            href="/intake"
            className="bg-teal text-white px-6 py-2.5 rounded-full font-semibold hover:bg-teal-dark transition-colors text-sm whitespace-nowrap"
          >
            Set Up Profile →
          </Link>
        </div>
      )}

      {/* Plan card — always visible */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Current Plan</div>
          <div className="text-lg font-bold text-navy">{formatPlanName(user?.plan)}</div>
          {user?.subscriptionStatus === "trialing" ? (
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                🎁 Free Trial
                {trialDaysRemaining !== null && (
                  <span>— {trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} left</span>
                )}
              </span>
            </div>
          ) : (
            <div className="text-sm text-gray-500 mt-1">
              Status: <span className="text-teal font-medium">{user?.subscriptionStatus || "N/A"}</span>
            </div>
          )}
          <Link href="/dashboard/plan" className="text-sm text-teal font-medium mt-3 inline-block hover:underline">
            Manage Plan →
          </Link>
        </div>
      </div>

      {/* Patient profiles — show each patient's data */}
      {familyPlan && patients.length >= 2 ? (
        /* Family plan with 2 patients: side-by-side on desktop */
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {patients.map((data, idx) => (
            <PatientCard key={data.patient?.id || idx} data={data} label={`Parent ${idx + 1}`} />
          ))}
        </div>
      ) : (
        /* Single patient (individual plan or family with 1 patient so far) */
        patients.map((data, idx) => (
          <div key={data.patient?.id || idx} className="mb-8">
            {familyPlan && (
              <h2 className="text-base font-semibold text-navy mb-3">Parent 1: {data.patient?.firstName} {data.patient?.lastName}</h2>
            )}
            <PatientCard data={data} />
          </div>
        ))
      )}

      {/* Add Second Parent card for family plans with only 1 patient */}
      {canAddSecondParent && hasAnyPatient && (
        <AddSecondParentCard />
      )}

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Link href="/dashboard/medical" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-teal transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-navy">Medical Records</div>
            <div className="text-xs text-gray-500">Doctors, meds, conditions</div>
          </div>
        </Link>
        <Link href="/dashboard/family" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-teal transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-navy">Family Members</div>
            <div className="text-xs text-gray-500">Manage notifications</div>
          </div>
        </Link>
        <Link href="/dashboard/requests" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-teal transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-navy">Appointments</div>
            <div className="text-xs text-gray-500">View scheduled appointments</div>
          </div>
        </Link>
        <Link href="/dashboard/history" className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-teal transition-colors flex items-center gap-3">
          <div className="w-10 h-10 bg-teal/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-navy">Call History</div>
            <div className="text-xs text-gray-500">View daily check-in logs</div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function PatientCard({ data, label }: {
  data: Awaited<ReturnType<typeof getPatientDashboardData>>;
  label?: string;
}) {
  const { patient, recentCall, callCount, totalAppointments, nextAppointment } = data;
  if (!patient) return null;

  return (
    <div>
      {label && (
        <h2 className="text-base font-semibold text-navy mb-3">{label}: {patient.firstName} {patient.lastName}</h2>
      )}

      {/* No preferred call time reminder */}
      {!patient.preferredCallTime && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-amber-700 flex-1">
            Set check-in time so Lily knows when to call.{" "}
            <Link href="/dashboard/profile" className="font-semibold underline">Update →</Link>
          </p>
        </div>
      )}

      <div className="grid gap-4 mb-4">
        {/* Check-in */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Daily Check-In</div>
          <div className="text-lg font-bold text-navy">{patient.preferredCallTime || "Not set"}</div>
          <div className="text-sm text-gray-500 mt-1">Daily wellness call with Lily</div>
        </div>

        {/* Medication reminders */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Medication Reminders</div>
          {patient.medicationReminderTime ? (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {patient.medicationReminderTime.split(',').map((t: string, i: number) => (
                <span key={i} className="text-sm font-bold text-navy bg-teal/5 border border-teal/20 rounded-lg px-2.5 py-1">{t.trim()}</span>
              ))}
            </div>
          ) : (
            <div className="text-lg font-bold text-navy">Not set</div>
          )}
        </div>

        {/* Appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Appointments</div>
          {nextAppointment ? (
            <>
              <div className="text-sm font-bold text-navy mt-1">
                {nextAppointment.description?.match(/DOCTOR: (.+)/)?.[1] || "Scheduled"}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {nextAppointment.description?.match(/DATE: (.+)/)?.[1] || ""}
              </div>
              <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                nextAppointment.status === "DONE" || nextAppointment.status === "COMPLETED"
                  ? "bg-green-100 text-green-700"
                  : "bg-blue-100 text-blue-700"
              }`}>
                {nextAppointment.status === "DONE" || nextAppointment.status === "COMPLETED" ? "✓ Confirmed" : "Scheduling..."}
              </span>
            </>
          ) : (
            <div className="text-lg font-bold text-navy">None</div>
          )}
        </div>
      </div>

      {/* Recent call summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="text-sm font-semibold text-navy mb-3">Most Recent Call</h3>
        {recentCall ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Date</span>
              <span className="text-navy font-medium">{new Date(recentCall.callDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mood</span>
              <span className="text-navy font-medium">{recentCall.mood || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Medications Taken</span>
              <span className={`font-medium ${recentCall.medicationsTaken ? "text-teal" : "text-red-500"}`}>
                {recentCall.medicationsTaken ? "Yes ✓" : "No ✗"}
              </span>
            </div>
            {recentCall.summary && (
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500">Summary:</span>
                <p className="text-navy mt-1">{recentCall.summary}</p>
              </div>
            )}
            {recentCall.urgent && (
              <div className="bg-red-50 text-red-600 rounded-xl px-3 py-2 text-xs font-medium">
                ⚠️ Urgent concern flagged in this call
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">
            Lily will begin daily check-ins soon. You&apos;ll see call summaries here.
          </p>
        )}
        {callCount > 0 && (
          <Link href="/dashboard/history" className="text-sm text-teal font-medium mt-3 inline-block hover:underline">
            View All {callCount} Calls →
          </Link>
        )}
      </div>
    </div>
  );
}
