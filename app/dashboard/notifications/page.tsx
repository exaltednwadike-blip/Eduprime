"use client";

import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-3xl p-6 bg-[#111827]">
        <div className="flex items-center gap-3">
          <Bell />
          <h1 className="text-2xl font-semibold">Notifications</h1>
        </div>
        <div className="mt-6 text-slate-400">Coming Soon.</div>
      </div>
    </div>
  );
}
