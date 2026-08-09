"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success", "error", "warning"
  const [resetComplete, setResetComplete] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setChecking(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === "SIGNED_OUT") {
        setSession(null);
      } else if (currentSession) {
        setSession(currentSession);
      }
      setChecking(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (event) => {
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

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setMessageType("error");
      setLoading(false);
      return;
    }

    // Sign out so the user lands on the login page after the reset.
    await supabase.auth.signOut();
    setMessage("Heslo bylo úspěšně změněno.");
    setMessageType("success");
    setResetComplete(true);
    setLoading(false);
  };

  const fieldClass = "mt-1.5 w-full rounded-lg border border-line bg-ink/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-600 transition focus:border-accent";

  const messageClass = {
    success: "text-emerald-400",
    error: "text-rose-400",
    warning: "text-amber-400",
  }[messageType];

  if (checking) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Nové heslo</h2>
        <p className="text-sm text-slate-400">Načítám...</p>
      </div>
    );
  }

  if (resetComplete) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Heslo změněno</h2>
        {message && <p className={`text-sm font-medium ${messageClass}`}>{message}</p>}
        <p className="text-sm text-slate-400">Nyní se můžete přihlásit s novým heslem.</p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:from-accentHover"
        >
          Přihlásit se
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Odkaz vypršel</h2>
        <p className="text-sm text-slate-400">
          Tento odkaz pro obnovení hesla je neplatný nebo vypršel. Vyžádejte si nový odkaz.
        </p>
        <button
          type="button"
          onClick={() => router.push("/login")}
          className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:from-accentHover"
        >
          Zpět na přihlášení
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Nové heslo</h2>
      <label className="block text-sm font-medium text-slate-300">
        Nové heslo
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
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-lg bg-gradient-to-r from-accent to-violet px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:from-accentHover disabled:cursor-not-allowed disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Ukládám..." : "Změnit heslo"}
        </button>
      </div>
    </form>
  );
}
