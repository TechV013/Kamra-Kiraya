"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import axios from "axios";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, token, hasHydrated, setUser, setToken, setHasHydrated } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (hasHydrated && token) {
      setChecking(false);
      return;
    }

    if (hasHydrated && !token) {
      verifySession();
      return;
    }
  }, [hasHydrated, token]);

  const verifySession = async () => {
    try {
      const res = await axios.get("/api/auth/me");
      if (res.data.user) {
        setUser(res.data.user);
        if (res.data.token) setToken(res.data.token);
        setChecking(false);
        return;
      }
    } catch {}
    router.push("/login");
  };

  useEffect(() => {
    if (!checking && !token) {
      router.push("/login");
    }
  }, [checking, token]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
