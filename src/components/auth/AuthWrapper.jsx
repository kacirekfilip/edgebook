"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import AuthPage from "./AuthPage";
import AuthLayout from "./AuthLayout";

export default function AuthWrapper({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (session && pathname === "/login") {
        router.push("/");
      } else if (!session && pathname !== "/login" && pathname !== "/reset-password") {
        router.push("/login");
      }
    }
  }, [session, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm">
        <p className="text-white text-lg">Načítám...</p>
      </div>
    );
  }

  if (pathname === "/reset-password") {
    return (
      <AuthLayout>
        {children}
      </AuthLayout>
    );
  }

  if (!session && pathname === "/login") {
    return (
      <AuthLayout>
        <AuthPage />
      </AuthLayout>
    );
  }

  if (session && pathname !== "/login") {
    return children;
  }

  return null; // Should not reach here in normal flow
}
