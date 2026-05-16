"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Checkbox } from "../common/checkbox";
import Image from "next/image";

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

  const panelContent = useMemo(
    () =>
      mode === "login"
        ? {
            eyebrow: "Permission Management",
            title: "Secure access, clear control",
            description:
              "Monitor roles, keep audit trails visible, and manage permissions from one place.",
            chartTitle: "Role Activity",
            badge: "Live",
          }
        : {
            eyebrow: "Team Onboarding",
            title: "Create users with the right access",
            description:
              "Set up accounts fast, apply safe defaults, and keep permissions aligned with each role.",
            chartTitle: "Access Setup",
            badge: "Guided",
          },
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
    <main className="min-h-screen bg-[#f9f9f9] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[1220px] flex-col rounded-[30px] bg-[#f9f9f9]">
        <header className="px-2 py-3 sm:px-3 lg:px-4">
          <Image
            src="/logo.png"
            alt="Obliq"
            width={132}
            height={48}
            priority
            style={{ width: "auto", height: "auto" }}
          />
        </header>

        <div className="grid flex-1 items-center gap-6 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-10 xl:gap-14">
          <section className="w-full max-w-[420px] justify-self-center rounded-[28px] bg-white px-5 py-7 sm:px-7 sm:py-8 lg:px-10 lg:py-9 [border:10px_solid_#00000005] shadow-[0_16px_34px_#C2C2C21A]">
            <div className="text-center">
              <h1 className="font-onest text-[42px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#202631] sm:text-[48px]">
                {mode === "login" ? "Login" : "Register"}
              </h1>
              <p className="mt-2 font-inter text-[15px] font-normal leading-6 text-[#a0a8b8]">
                {mode === "login"
                  ? "Enter your details to continue"
                  : "Create your account to continue"}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-3 sm:mt-7 sm:space-y-4 md:mt-8 md:space-y-4.5"
            >
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#414d61] sm:mb-2 sm:text-sm md:text-base">
                    Full name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    placeholder="John Doe"
                    className="h-9 sm:h-10 md:h-11 lg:h-12 w-full rounded-lg sm:rounded-[0.875rem] md:rounded-xl border border-[#e8ebf0] bg-white px-3 sm:px-4 text-xs sm:text-sm md:text-base text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-2 sm:focus:ring-3 focus:ring-[#ffe5da]"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#414d61] sm:mb-2 sm:text-sm md:text-base">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="example@email.com"
                  className="h-9 sm:h-10 md:h-11 lg:h-12 w-full rounded-lg sm:rounded-[0.875rem] md:rounded-xl border border-[#e8ebf0] bg-white px-3 sm:px-4 text-xs sm:text-sm md:text-base text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-2 sm:focus:ring-3 focus:ring-[#ffe5da]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#414d61] sm:mb-2 sm:text-sm md:text-base">
                  Password
                </span>
                <div className="flex h-9 sm:h-10 md:h-11 lg:h-12 items-center rounded-lg sm:rounded-[0.875rem] md:rounded-xl border border-[#e8ebf0] bg-white pr-3 sm:pr-4 transition focus-within:border-[#ff6b3d] focus-within:ring-2 sm:focus-within:ring-3 focus-within:ring-[#ffe5da]">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-full flex-1 rounded-lg bg-transparent px-3 sm:px-4 text-xs sm:text-sm md:text-base text-[#202631] outline-none placeholder:text-[#b1b8c4]"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((current) => !current)}
                    className="flex-shrink-0 text-[#d0d5dd] transition hover:text-[#9ca4b3] p-1"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </label>

              {mode === "login" ? (
                <div className="flex flex-col gap-2 text-xs text-[#7f8796] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-sm md:text-base md:gap-4">
                  <Checkbox
                    checked={rememberMe}
                    onChange={setRememberMe}
                    label="Remember me"
                  />
                  <button
                    type="button"
                    className="text-left font-medium text-[#ff6b3d] transition hover:text-[#f15c2f] sm:text-right"
                  >
                    Forgot password?
                  </button>
                </div>
              ) : (
                <p className="text-xs text-[#7f8796] sm:text-sm md:text-base">
                  New accounts are created with the{" "}
                  <span className="font-medium text-[#414d61]">Customer</span>{" "}
                  role.
                </p>
              )}

              {errorMessage ? (
                <p className="rounded-lg sm:rounded-xl md:rounded-2xl bg-[#fff0ea] px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-xs sm:text-sm md:text-base text-[#c94f2d]">
                  {errorMessage}
                </p>
              ) : null}

              {successData ? (
                <div className="rounded-lg sm:rounded-xl md:rounded-2xl bg-[#eefaf2] px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-3.5 text-xs sm:text-sm md:text-base text-[#22543d]">
                  <p className="font-semibold">{successData.message}</p>
                  <p className="mt-0.5 sm:mt-1">
                    Signed in as {successData.user.name} (
                    {successData.user.role.label})
                  </p>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-4 h-12 w-full rounded-xl border-2 border-[#ff6c3e] bg-[linear-gradient(180deg,#ff7d51_0%,#ff6235_100%)] text-base font-semibold text-white shadow-[0_8px_16px_rgba(255,109,64,0.24)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-none hover:bg-white hover:text-[#f26639] hover:shadow-[0_10px_22px_rgba(255,109,64,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSubmitting ? "Please wait..." : submitLabel}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#7f8796] sm:mt-8 sm:text-sm md:mt-10 md:text-base">
              {mode === "login"
                ? "Don't have an account? "
                : "Already have an account? "}
              <Link
                href={mode === "login" ? "/register" : "/login"}
                className="font-semibold text-[#202631] transition hover:text-[#ff6b3d]"
              >
                {mode === "login" ? "Sign up" : "Log in"}
              </Link>
            </p>
          </section>

          <section className="relative hidden h-[640px] overflow-hidden rounded-[30px] border border-[#f2d4c8] bg-[linear-gradient(140deg,#ffe7db_0%,#ffbe96_48%,#ff8e58_100%)] p-8 lg:block">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[#ff7c45]/45 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#ffcfac]/60 blur-3xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="max-w-[320px]">
                <p className="font-onest text-sm font-medium uppercase tracking-[0.2em] text-[#7e2f12]">
                  {panelContent.eyebrow}
                </p>
                <h2 className="mt-3 font-onest text-[40px] font-semibold leading-[1.05] tracking-[-0.03em] text-[#2b1b14]">
                  {panelContent.title}
                </h2>
                <p className="mt-4 font-inter text-[16px] leading-6 text-[#5e3a2b]">
                  {panelContent.description}
                </p>
              </div>

              <div className="relative ml-auto w-[82%] rounded-3xl bg-white/90 p-5 shadow-[0_22px_40px_rgba(114,46,16,0.18)] backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-onest text-sm font-semibold text-[#3f2d24]">
                    {panelContent.chartTitle}
                  </p>
                  <span className="rounded-full bg-[#fff1ea] px-3 py-1 text-xs font-medium text-[#ff6b3d]">
                    {panelContent.badge}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 w-full rounded-full bg-[#f6e2d8]">
                    <div className="h-full w-[84%] rounded-full bg-[#ff7a4d]" />
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f6e2d8]">
                    <div className="h-full w-[66%] rounded-full bg-[#ff925f]" />
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[#f6e2d8]">
                    <div className="h-full w-[48%] rounded-full bg-[#ffad83]" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
