"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: "", color: "", width: "0%" };
  if (password.length < 6) return { label: "Too short", color: "bg-red-400", width: "25%" };
  if (password.length < 8) return { label: "Weak", color: "bg-orange-400", width: "50%" };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const extras = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  if (extras >= 2) return { label: "Strong", color: "bg-teal", width: "100%" };
  if (extras === 1) return { label: "Good", color: "bg-green-400", width: "75%" };
  return { label: "Weak", color: "bg-orange-400", width: "50%" };
}

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const refParam = searchParams.get("ref") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [referralCode, setReferralCode] = useState(refParam);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [referrerName, setReferrerName] = useState("");

  // Look up referrer name if ref code provided
  useEffect(() => {
    if (refParam) {
      fetch(`/api/referral?code=${refParam}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.referrerName) setReferrerName(d.referrerName);
        })
        .catch(() => {});
    }
  }, [refParam]);

  const strength = getPasswordStrength(password);
  const passwordsMatch = confirm.length === 0 || password === confirm;
  const canSubmit = name && email && password.length >= 8 && password === confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      let stripeCustomerId = null;
      let plan = null;

      if (sessionId) {
        try {
          const stripeRes = await fetch(`/api/stripe-session?session_id=${sessionId}`);
          const stripeData = await stripeRes.json();
          if (stripeData.customerId) {
            stripeCustomerId = stripeData.customerId;
            plan = stripeData.plan;
            if (stripeData.email && !email) {
              // email already captured
            }
          }
        } catch {
          // Continue without Stripe data
        }
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, stripeCustomerId, plan, referralCode: referralCode || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error?.toLowerCase().includes("already")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else {
          setError(data.error || "Registration failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Auto sign in
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created but login failed. Please sign in manually.");
        setLoading(false);
      } else {
        router.push("/intake");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
      {/* Referral badge */}
      {refParam && (
        <div className="bg-teal/10 border border-teal/20 rounded-xl px-4 py-3 text-center">
          {referrerName && (
            <p className="text-sm font-semibold text-teal">
              Referred by {referrerName}
            </p>
          )}
          <p className="text-sm text-navy font-medium mt-0.5">
            $50 off your first bill!
          </p>
        </div>
      )}

      {/* Google Sign Up — top */}
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/intake" })}
        className="w-full flex items-center justify-center gap-3 border border-gray-300 bg-white text-navy py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors text-sm"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign up with Google
      </button>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400">
          <span className="bg-white px-3 uppercase tracking-wide">or sign up with email</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Full Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
            placeholder="Min 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )}
          </button>
        </div>
        {/* Password strength indicator */}
        {password.length > 0 && (
          <div className="mt-2">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <p className={`text-xs mt-1 ${strength.color.replace("bg-", "text-")}`}>
              {strength.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Confirm Password</label>
        <input
          type={showPassword ? "text" : "password"}
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={`w-full border rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm ${
            !passwordsMatch ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="Confirm your password"
        />
        {!passwordsMatch && confirm.length > 0 && (
          <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-navy mb-1">Referral Code <span className="text-gray-400 font-normal">(optional)</span></label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-navy focus:outline-none focus:ring-2 focus:ring-teal text-sm"
          placeholder="e.g. SMIT-A1B2"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full bg-teal text-white py-3 rounded-full font-semibold hover:bg-teal-dark transition-colors disabled:opacity-40"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
            </svg>
            Creating account...
          </span>
        ) : "Create Account"}
      </button>

    </form>
  );
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-28 w-auto mx-auto mb-6" />
          </a>
          <h1 className="text-2xl font-bold text-navy">Create Your Account</h1>
          <p className="text-gray-500 mt-1">Start your 7-day free trial — no credit card required yet</p>
        </div>

        <Suspense fallback={<div className="text-center text-gray-400">Loading...</div>}>
          <RegisterForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-teal font-medium hover:underline">
            Sign In
          </a>
        </p>
        <p className="text-center text-xs text-gray-400 mt-2">
          Need help? Call <a href="tel:+18125155252" className="text-teal hover:underline">(812) 515-5252</a>
        </p>
      </div>
    </main>
  );
}
