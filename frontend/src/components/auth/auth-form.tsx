"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

const EyeIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    className="h-5 w-5"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 12C4.2 8.4 7.5 6.6 12 6.6C16.5 6.6 19.8 8.4 22 12C19.8 15.6 16.5 17.4 12 17.4C7.5 17.4 4.2 15.6 2 12Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="2.7" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

const ObliqLogo = () => (
  <div className="flex items-center gap-3">
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[linear-gradient(180deg,#ff9f72_0%,#ff6b3d_100%)] shadow-[0_12px_24px_rgba(255,107,61,0.28)]">
      <div className="relative h-5 w-5">
        <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-white/85" />
        <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full bg-white/55" />
        <span className="absolute bottom-0 right-1 h-2.5 w-2.5 rounded-full bg-white" />
      </div>
    </div>
    <span className="text-[2rem] font-bold tracking-[-0.04em] text-[#2d1d18]">
      Obliq
    </span>
  </div>
);

type AuthMode = "login" | "register";

type AuthResult = {
  message: string;
  accessToken: string;
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

type AuthFormProps = {
  mode: AuthMode;
};

export function AuthForm({ mode }: AuthFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successData, setSuccessData] = useState<AuthResult | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  const submitLabel = useMemo(
    () => (mode === "login" ? "Log in" : "Create account"),
    [mode],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessData(null);

    try {
      const payload =
        mode === "login" ? { email, password } : { name, email, password };

      const response = await fetch(`${apiBaseUrl}/auth/${mode}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as
        | AuthResult
        | { message?: string | string[] };

      if (!response.ok) {
        const message = Array.isArray(result.message)
          ? result.message[0]
          : result.message || "Authentication failed";
        setErrorMessage(message);
        return;
      }

      setSuccessData(result as AuthResult);

      // A full navigation ensures the new auth cookies are visible to middleware immediately.
      window.location.assign("/");
    } catch {
      setErrorMessage("Unable to reach the backend API right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] px-5 py-8 sm:px-7 sm:py-10">
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,151,107,0.16)_0%,_rgba(255,255,255,0)_68%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,146,104,0.08),_transparent_28%)]" />
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
        <header className="flex items-start justify-start">
          <ObliqLogo />
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-16">
          <section className="w-full max-w-[27.25rem] rounded-[2rem] border border-[#f6efea] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(223,214,208,0.26),0_45px_90px_rgba(239,233,228,0.6)] ring-8 ring-white/50 sm:px-10 sm:py-12">
            <div className="text-center">
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[#202631] sm:text-[2.15rem]">
                {mode === "login" ? "Login" : "Register"}
              </h1>
              <p className="mt-2 text-[1.02rem] text-[#a0a8b8]">
                {mode === "login"
                  ? "Enter your details to continue"
                  : "Create your account to continue"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-12 space-y-5">
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-2.5 block text-[1.05rem] font-medium text-[#414d61]">
                    Full name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    placeholder="John Doe"
                    className="h-[3.45rem] w-full rounded-[1.05rem] border border-[#e8ebf0] bg-white px-4 text-[1rem] text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-4 focus:ring-[#ffe5da]"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2.5 block text-[1.05rem] font-medium text-[#414d61]">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="example@email.com"
                  className="h-[3.45rem] w-full rounded-[1.05rem] border border-[#e8ebf0] bg-white px-4 text-[1rem] text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-4 focus:ring-[#ffe5da]"
                />
              </label>

              <label className="block">
                <span className="mb-2.5 block text-[1.05rem] font-medium text-[#414d61]">
                  Password
                </span>
                <div className="flex h-[3.45rem] items-center rounded-[1.05rem] border border-[#e8ebf0] bg-white pr-4 transition focus-within:border-[#ff6b3d] focus-within:ring-4 focus-within:ring-[#ffe5da]">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-full flex-1 rounded-[1.05rem] bg-transparent px-4 text-[1rem] text-[#202631] outline-none placeholder:text-[#b1b8c4]"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-[#d0d5dd] transition hover:text-[#9ca4b3]"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </label>

              {mode === "login" ? (
                <div className="flex flex-col gap-3 text-[0.98rem] text-[#7f8796] sm:flex-row sm:items-center sm:justify-between">
                  <label className="inline-flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 rounded-[0.35rem] border border-[#dde2ea] text-[#ff6b3d] accent-[#ff6b3d]"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    className="text-left font-medium text-[#ff6b3d] transition hover:text-[#f15c2f] sm:text-right"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <p className="text-[0.98rem] text-[#7f8796]">
                  New accounts are created with the{" "}
                  <span className="font-medium text-[#414d61]">Customer</span>{" "}
                  role.
                </p>
              )}

              {errorMessage ? (
                <p className="rounded-2xl bg-[#fff0ea] px-4 py-3 text-sm text-[#c94f2d]">
                  {errorMessage}
                </p>
              ) : null}

              {successData ? (
                <div className="rounded-2xl bg-[#eefaf2] px-4 py-3 text-sm text-[#22543d]">
                  <p className="font-semibold">{successData.message}</p>
                  <p className="mt-1">
                    Signed in as {successData.user.name} (
                    {successData.user.role.label})
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 h-[3.45rem] w-full rounded-[1rem] border border-[#ff6c3e] bg-[linear-gradient(180deg,#ff7d51_0%,#ff6235_100%)] text-[1.02rem] font-medium text-white shadow-[0_10px_28px_rgba(255,109,64,0.32)] transition hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Please wait..." : submitLabel}
              </button>
            </form>

            <p className="mt-12 text-center text-[1rem] text-[#7f8796]">
              {mode === "login"
                ? "Don’t have an account? "
                : "Already have an account? "}
              <Link
                href={mode === "login" ? "/register" : "/login"}
                className="font-semibold text-[#202631] transition hover:text-[#ff6b3d]"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
