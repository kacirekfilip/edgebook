"use client";

import { useState } from "react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center mb-6">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-accent to-violet text-xl font-black text-white shadow-lg shadow-accent/30">
          E
        </span>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Edgebook</h1>
      </div>
      {isRegistering ? (
        <RegisterForm onToggleLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginForm onToggleRegister={() => setIsRegistering(true)} />
      )}
    </>
  );
}