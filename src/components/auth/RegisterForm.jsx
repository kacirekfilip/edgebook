"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function RegisterForm({ onToggleLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "warning"

  const handleRegister = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    if (password !== confirmPassword) {
      setMessage("Hesla se neshodují.");
      setMessageType("warning");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
    } else {
      setMessage("Registrace úspěšná! Zkontrolujte svůj email pro potvrzení.");
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
    <form onSubmit={handleRegister} className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Registrace</h2>
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
      <label className="block text-sm font-medium text-slate-300">
        Potvrzení hesla
        <input
          className={fieldClass}
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
          {loading ? "Registruji..." : "Registrovat"}
        </button>
        <button
          type="button"
          onClick={onToggleLogin}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-panelMuted"
        >
          Přihlásit
        </button>
      </div>
    </form>
  );
}
