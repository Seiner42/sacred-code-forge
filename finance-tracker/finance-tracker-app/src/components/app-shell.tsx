"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Обзор" },
  { href: "/operations", label: "Операции" },
  { href: "/subscriptions", label: "Подписки" },
  { href: "/imports", label: "Импорт" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
        <header className="mb-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 shadow-2xl shadow-black/20 backdrop-blur sm:px-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80 sm:text-sm">
                Finance Tracker
              </p>
              <h1 className="mt-2 text-xl font-semibold leading-tight text-white sm:text-2xl">
                Личный контур финансов
              </h1>
            </div>
            <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm transition ${
                      isActive
                        ? "border-cyan-300/60 bg-cyan-400/15 text-white"
                        : "border-white/10 text-slate-200 hover:border-cyan-400/50 hover:bg-cyan-400/10 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
