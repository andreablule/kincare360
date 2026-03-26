"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";

const allNavItems = [
  { label: "Overview", href: "/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1", roles: ["CLIENT","MANAGER","FAMILY","ADMIN"] },
  { label: "Profile", href: "/dashboard/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", roles: ["CLIENT","MANAGER","FAMILY","ADMIN"] },
  { label: "Medical", href: "/dashboard/medical", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", roles: ["CLIENT","MANAGER","FAMILY","ADMIN"] },
  { label: "Family", href: "/dashboard/family", icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z", roles: ["CLIENT","MANAGER","ADMIN"] },
  { label: "Requests", href: "/dashboard/requests", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", roles: ["CLIENT","MANAGER","ADMIN"] },
  { label: "Call History", href: "/dashboard/history", icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z", roles: ["CLIENT","MANAGER","FAMILY","ADMIN"] },
  { label: "Plan", href: "/dashboard/plan", icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", roles: ["CLIENT","ADMIN"] },
];

function NavIcon({ d, active }: { d: string; active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-teal" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === "CLIENT" || role === "ADMIN") return null;
  if (role === "MANAGER") {
    return (
      <span className="inline-flex items-center gap-1 bg-teal/10 text-teal text-xs font-semibold px-2.5 py-0.5 rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg>
        Manager
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-semibold px-2.5 py-0.5 rounded-full">
      Family Member
    </span>
  );
}

export default function DashboardShell({ children, user }: { children: React.ReactNode; user: any }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const userRole: string = (user as any)?.role || "CLIENT";
  const navItems = allNavItems.filter((item) => item.roles.includes(userRole));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
        </div>
      )}

      {/* Mobile sidebar drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-4 py-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/"><img src="/kincare360-logo.png" alt="KinCare360" className="h-20 w-auto" /></Link>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? "bg-teal/10 text-teal" : "text-gray-600 hover:bg-gray-50 hover:text-navy"}`}>
                <NavIcon d={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500 mb-1 truncate">{user?.email}</div>
          {(userRole === "MANAGER" || userRole === "FAMILY") && (
            <div className="mb-2"><RoleBadge role={userRole} /></div>
          )}
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-sm text-red-500 hover:text-red-700 font-medium">Sign Out</button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-100 fixed h-full">
        <div className="px-4 py-6 border-b border-gray-100">
          <Link href="/">
            <img src="/kincare360-logo.png" alt="KinCare360" className="h-24 w-auto" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-teal/10 text-teal"
                    : "text-gray-600 hover:bg-gray-50 hover:text-navy"
                }`}
              >
                <NavIcon d={item.icon} active={active} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {(user?.role === "ADMIN" || user?.email === "hello@kincare360.com") && (
          <div className="px-4 pt-2">
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === "/admin"
                  ? "bg-teal/10 text-teal"
                  : "text-gray-600 hover:bg-gray-50 hover:text-navy"
              }`}
            >
              <svg className={`w-5 h-5 ${pathname === "/admin" ? "text-teal" : "text-gray-400"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              Admin
            </Link>
          </div>
        )}

        <div className="p-4 border-t border-gray-100">
          <div className="text-sm text-gray-500 mb-1 truncate">{user?.email}</div>
          {(userRole === "MANAGER" || userRole === "FAMILY") && (
            <div className="mb-2"><RoleBadge role={userRole} /></div>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm text-red-500 hover:text-red-700 font-medium"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile top header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-navy p-1">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        <Link href="/"><img src="/kincare360-logo.png" alt="KinCare360" className="h-12 w-auto" /></Link>
        <div className="w-8" />
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0 pt-14 md:pt-0">
        {/* Role banner for non-owners */}
        {(userRole === "MANAGER" || userRole === "FAMILY") && (
          <div className={`w-full px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 ${
            userRole === "MANAGER"
              ? "bg-teal/10 text-teal border-b border-teal/20"
              : "bg-gray-100 text-gray-500 border-b border-gray-200"
          }`}>
            <RoleBadge role={userRole} />
            <span>
              {userRole === "MANAGER"
                ? "You have Manager access — you can edit care records and submit requests."
                : "You have read-only access to this care dashboard."}
            </span>
          </div>
        )}
        <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav — dynamically show up to 5 items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
        <div className="flex justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${
                  active ? "text-teal" : "text-gray-400"
                }`}
              >
                <NavIcon d={item.icon} active={active} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
