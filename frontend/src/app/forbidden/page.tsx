"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForbiddenPage() {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  async function handleSwitchAccount() {
    setIsSwitching(true);
    try {
      await fetch(`${apiBaseUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignore errors, proceed to login anyway
    } finally {
      router.push("/login");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#fff7f1_0%,#fffaf6_14%,#fdfdfd_100%)] px-3 py-6 sm:px-5 sm:py-10 text-[#202631]">
      <section className="w-full max-w-[34rem] rounded-2xl sm:rounded-4xl border border-[#f4e7dc] bg-white/95 p-5 sm:p-8 md:p-10 text-center shadow-[0_22px_60px_rgba(223,214,208,0.25)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ff6b3d]">
          Access denied
        </p>
        <h1 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.03em] text-[#2f3648]">
          403
        </h1>
        <p className="mt-3 text-sm sm:text-base md:text-lg text-[#6d7486]">
          You do not have the required permission atom to open this page.
        </p>
        <div className="mt-5 sm:mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-10 sm:h-11 w-full sm:w-auto items-center justify-center rounded-full bg-[linear-gradient(180deg,#7178ff_0%,#5f68f8_100%)] px-6 text-xs sm:text-sm font-medium text-white shadow-[0_10px_24px_rgba(95,104,248,0.28)] transition hover:brightness-105"
          >
            Go to workspace
          </Link>
          <button
            type="button"
            disabled={isSwitching}
            onClick={handleSwitchAccount}
            className="inline-flex h-10 sm:h-11 w-full sm:w-auto items-center justify-center rounded-full border border-[#e8dfd8] bg-white px-6 text-xs sm:text-sm font-medium text-[#4f5567] transition hover:bg-[#fafaf8] disabled:opacity-60"
          >
            {isSwitching ? "Logging out..." : "Switch account"}
          </button>
        </div>
      </section>
    </main>
  );
}
