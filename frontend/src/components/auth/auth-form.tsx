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

      if (mode === "register") {
        setPassword("");
      }
    } catch {
      setErrorMessage("Unable to reach the backend API right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] px-5 py-8 sm:px-8 sm:py-10">
      <div className="pointer-events-none absolute left-1/2 top-[38%] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,142,97,0.14)_0%,_rgba(255,255,255,0)_68%)] blur-3xl" />
      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col">
        <header className="flex items-start justify-start">
          <ObliqLogo />
        </header>

        <div className="flex flex-1 items-center justify-center py-10 sm:py-14">
          <section className="w-full max-w-[27rem] rounded-[2rem] border border-white/80 bg-white px-6 py-8 shadow-[0_28px_90px_rgba(198,181,169,0.26)] ring-1 ring-[#f4efeb] sm:px-10 sm:py-11">
            <div className="text-center">
              <h1 className="text-[2.1rem] font-semibold tracking-[-0.04em] text-[#202631] sm:text-[2.3rem]">
                {mode === "login" ? "Login" : "Create account"}
              </h1>
              <p className="mt-2 text-base text-[#98a1b2] sm:text-[1.05rem]">
                {mode === "login"
                  ? "Enter your details to continue"
                  : "Set up your customer account"}
              </p>
            </div>

            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-[#fff2ec] p-1">
              <Link
                href="/login"
                className={`rounded-[1rem] px-4 py-2.5 text-center text-sm font-medium transition ${
                  mode === "login"
                    ? "bg-white text-[#202631] shadow-sm"
                    : "text-[#a56c58]"
                }`}
              >
                Login
              </Link>
              <Link
                href="/register"
                className={`rounded-[1rem] px-4 py-2.5 text-center text-sm font-medium transition ${
                  mode === "register"
                    ? "bg-white text-[#202631] shadow-sm"
                    : "text-[#a56c58]"
                }`}
              >
                Sign up
              </Link>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-2.5 block text-[1.02rem] font-medium text-[#3f4b5f]">
                    Full name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    placeholder="John Doe"
                    className="h-13 w-full rounded-2xl border border-[#e6e9ee] bg-white px-4 text-[1.02rem] text-[#202631] outline-none transition placeholder:text-[#b0b7c3] focus:border-[#ff6b3d] focus:ring-4 focus:ring-[#ffe0d5]"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-2.5 block text-[1.02rem] font-medium text-[#3f4b5f]">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="example@email.com"
                  className="h-13 w-full rounded-2xl border border-[#e6e9ee] bg-white px-4 text-[1.02rem] text-[#202631] outline-none transition placeholder:text-[#b0b7c3] focus:border-[#ff6b3d] focus:ring-4 focus:ring-[#ffe0d5]"
                />
              </label>

              <label className="block">
                <span className="mb-2.5 block text-[1.02rem] font-medium text-[#3f4b5f]">
                  Password
                </span>
                <div className="flex h-13 items-center rounded-2xl border border-[#e6e9ee] bg-white pr-4 transition focus-within:border-[#ff6b3d] focus-within:ring-4 focus-within:ring-[#ffe0d5]">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-full flex-1 rounded-2xl bg-transparent px-4 text-[1.02rem] text-[#202631] outline-none placeholder:text-[#b0b7c3]"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-[#c5cbd6] transition hover:text-[#98a1b2]"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </label>

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
                {mode === "login" ? (
                  <button
                    type="button"
                    className="text-left font-medium text-[#ff6b3d] transition hover:text-[#f15c2f] sm:text-right"
                  >
                    Forgot password?
                  </button>
                ) : (
                  <span className="text-left sm:text-right">
                    Default role: Customer
                  </span>
                )}
              </div>

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
                className="mt-2 h-13 w-full rounded-2xl bg-[linear-gradient(180deg,#ff7e52_0%,#ff6235_100%)] text-[1.02rem] font-medium text-white shadow-[0_16px_28px_rgba(255,107,61,0.34)] transition hover:brightness-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
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
