"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-yellow-400", "bg-blue-400", "bg-teal"];
  const textColors = ["", "text-red-500", "text-yellow-600", "text-blue-600", "text-teal"];

  if (!password) return null;

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-gray-200"}`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
      )}
    </div>
  );
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const [token, setToken] = useState<string>("");
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "submitting" | "done">("loading");
  const [info, setInfo] = useState<{ name: string; patientFirstName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);
      fetch(`/api/invite/${t}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.valid) {
            setInfo({ name: data.name, patientFirstName: data.patientFirstName });
            setStatus("valid");
          } else {
            setErrorMsg(data.reason || "This invitation is no longer valid.");
            setStatus("invalid");
          }
        })
        .catch(() => {
          setErrorMsg("Something went wrong. Please try again.");
          setStatus("invalid");
        });
    });
  }, [params]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords don't match.");
      return;
    }

    setStatus("submitting");

    const res = await fetch(`/api/invite/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.success) {
      setStatus("done");
      setTimeout(() => {
        router.push("/login?message=Account+created!+Please+log+in.");
      }, 2000);
    } else {
      setFormError(data.error || "Something went wrong. Please try again.");
      setStatus("valid");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Validating invitation…</div>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">Invitation Expired</h1>
          <p className="text-gray-500 text-sm mb-6">{errorMsg}</p>
          <Link href="/" className="text-teal text-sm font-medium hover:underline">← Back to KinCare360</Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-navy mb-2">You're all set! 🎉</h1>
          <p className="text-gray-500 text-sm">Redirecting you to login…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full shadow-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-10 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-navy">Welcome to KinCare360</h1>
          {info && (
            <p className="text-gray-500 text-sm mt-2">
              {info.name ? `Hi ${info.name}! ` : ""}
              You've been connected to{" "}
              <strong className="text-navy">{info.patientFirstName}'s</strong> care dashboard.
            </p>
          )}
        </div>

        <div className="bg-teal/5 border border-teal/20 rounded-xl px-4 py-3 mb-6 text-sm text-teal">
          Set a password to activate your account and start receiving care updates.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
            <PasswordStrength password={password} />
          </div>

          <div>
            <label className="block text-sm font-medium text-navy mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
              placeholder="Repeat your password"
              required
            />
          </div>

          {formError && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{formError}</div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40"
          >
            {status === "submitting" ? "Setting up your account…" : "Set Password & Accept Invitation"}
          </button>
        </form>
      </div>
    </div>
  );
}
