"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Header({ onAddTrade, onOpenSettings }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };
  return (
    <header className="border-b border-violet/40 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex items-center gap-9">
          <a className="flex items-center gap-2.5" href="#overview" aria-label="Edgebook dashboard">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-violet text-lg font-black text-white shadow-lg shadow-accent/30">
              E
            </span>
            <span className="text-lg font-bold tracking-tight text-white sm:text-xl">Edgebook</span>
          </a>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Hlavní navigace">
            {[{ label: "Přehled", href: "#overview" }, { label: "Obchody", href: "#trades" }, { label: "Analytika", href: "#analytics" }].map((item, index) => (
              <a
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  index === 0 ? "bg-violet/25 text-white ring-1 ring-violet/50" : "text-slate-400 hover:text-white"
                }`}
                href={item.href}
                key={item.label}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:text-white sm:px-3"
            type="button"
            onClick={onOpenSettings}
            aria-label="Nastavení"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span className="hidden sm:inline">Nastavení</span>
          </button>
          <button
            className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:from-accentHover hover:to-violet md:px-3.5 md:py-2"
            type="button"
            onClick={onAddTrade}
          >
            <span aria-hidden="true">+</span> Přidat obchod
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-rose-500/60 hover:text-white"
            type="button"
            onClick={handleLogout}
            aria-label="Odhlásit se"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Odhlásit
          </button>
        </div>
      </div>
    </header>
  );
}
