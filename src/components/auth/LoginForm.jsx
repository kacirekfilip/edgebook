"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginForm({ onToggleRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "warning"

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage("Přihlášení úspěšné!");
      setMessageType("success");
    }
    setLoading(false);
  };

  const fieldClass = "mt-1.5 w-full rounded-lg border border-line bg-ink/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:border-accent";

  const messageClass = {
    success: "text-emerald-400",
    error: "text-rose-400",
    warning: "text-amber-400",
  }[messageType];

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Přihlášení</h2>
      <label className="block text-sm font-medium text-slate-300">
        Email
        <input
          className={fieldClass}
          type="email"
          placeholder="tvuj@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="block text-sm font-medium text-slate-300">
        Heslo
        <input
          className={fieldClass}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {message && <p className={`text-sm font-medium ${messageClass}`}>{message}</p>}
      <div className="flex justify-between items-center">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:from-accentHover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Přihlašuji..." : "Přihlásit"}
        </button>
        <button
          type="button"
          onClick={onToggleRegister}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-panelMuted"
        >
          Registrovat
        </button>
      </div>
    </form>
  );
}