"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type MeResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    status: string;
    role: {
      key: string;
      label: string;
    };
  };
};

export function AuthHome() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [user, setUser] = useState<MeResponse["user"] | null>(null);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  useEffect(() => {
    async function loadSession() {
      const meResponse = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include",
      });

      if (meResponse.ok) {
        const data = (await meResponse.json()) as MeResponse;
        setUser(data.user);
        setIsLoading(false);
        return;
      }

      // If the access token has expired but the refresh cookie is still valid, restore the session once.
      const refreshResponse = await fetch(`${apiBaseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        router.replace("/login");
        return;
      }

      const refreshedMeResponse = await fetch(`${apiBaseUrl}/auth/me`, {
        credentials: "include",
      });

      if (!refreshedMeResponse.ok) {
        router.replace("/login");
        return;
      }

      const data = (await refreshedMeResponse.json()) as MeResponse;
      setUser(data.user);
      setIsLoading(false);
    }

    loadSession().catch(() => {
      setErrorMessage("Unable to restore your session");
      setIsLoading(false);
    });
  }, [apiBaseUrl, router]);

  async function handleLogout() {
    await fetch(`${apiBaseUrl}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });

    // Force the client back through middleware after the cookies are cleared.
    router.replace("/login");
    router.refresh();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdfb] px-6 py-10 text-[#202631]">
        <div className="rounded-3xl border border-[#f1e8e1] bg-white px-8 py-6 shadow-[0_18px_50px_rgba(223,214,208,0.22)]">
          Checking your session...
        </div>
      </main>
    );
  }

  if (errorMessage || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fffdfb] px-6 py-10 text-[#202631]">
        <div className="rounded-3xl border border-[#ffe0d5] bg-white px-8 py-6 text-[#c94f2d] shadow-[0_18px_50px_rgba(223,214,208,0.22)]">
          {errorMessage || "Session unavailable"}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fffdfb] px-6 py-10 text-[#202631]">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-[#f3ebe5] bg-white p-8 shadow-[0_22px_70px_rgba(223,214,208,0.24)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-[#ff6b3d]">
              Authenticated home
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Welcome, {user.name}
            </h1>
            <p className="mt-3 text-base text-[#7f8796]">
              Home route is now protected. Access is only available after a
              valid login session or refresh token restore.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border border-[#ffd7c7] bg-[#fff4ee] px-5 py-3 text-sm font-medium text-[#ff6b3d] transition hover:bg-[#ffe9df]"
          >
            Logout
          </button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-[#fff8f4] p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#a56c58]">
              Email
            </p>
            <p className="mt-2 text-lg font-medium">{user.email}</p>
          </div>
          <div className="rounded-3xl bg-[#fff8f4] p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#a56c58]">
              Role
            </p>
            <p className="mt-2 text-lg font-medium">{user.role.label}</p>
          </div>
          <div className="rounded-3xl bg-[#fff8f4] p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-[#a56c58]">
              Status
            </p>
            <p className="mt-2 text-lg font-medium">{user.status}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
