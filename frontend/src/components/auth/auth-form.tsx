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

const ObliqLogo = () => (
  <div className="flex items-center gap-2 sm:gap-3">
    <div className="grid h-8 w-8 place-items-center rounded-lg bg-[linear-gradient(180deg,#ff9f72_0%,#ff6b3d_100%)] shadow-[0_8px_16px_rgba(255,107,61,0.24)] sm:h-10 sm:w-10 sm:rounded-xl sm:shadow-[0_12px_24px_rgba(255,107,61,0.28)]">
      <div className="relative h-4 w-4 sm:h-5 sm:w-5">
        <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white/85 sm:h-3.5 sm:w-3.5" />
        <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full bg-white/55 sm:h-3.5 sm:w-3.5" />
        <span className="absolute bottom-0 right-1 h-2 w-2 rounded-full bg-white sm:h-2.5 sm:w-2.5" />
      </div>
    </div>
    <span className="text-lg font-bold tracking-[-0.04em] text-[#2d1d18] sm:text-2xl">
      Obliq
    </span>
  </div>
);

type AuthMode = "login" | "register";

type AuthResult = {
  message: string;
  accessToken: string;
  refreshToken?: string;
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

      const authResult = result as AuthResult;
      setSuccessData(authResult);

      // Call local API route to set secure cookies
      await fetch("/api/auth/callback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accessToken: authResult.accessToken,
          refreshToken: authResult.refreshToken || undefined,
        }),
      });

      // A full navigation ensures the new auth cookies are visible to middleware immediately.
      window.location.assign("/");
    } catch {
      setErrorMessage("Unable to reach the backend API right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-[20rem] w-[20rem] -translate-x-1/2 rounded-full sm:h-[28rem] sm:w-[28rem] md:h-[36rem] md:w-[36rem]" />
      <div className="pointer-events-none absolute inset-0" />
      <div className="relative flex min-h-[calc(100vh-2rem)] flex-col sm:min-h-[calc(100vh-3rem)] md:min-h-[calc(100vh-4rem)]">
        <header className="flex items-start justify-start px-2 pt-2 sm:px-3 sm:pt-3 md:px-4 md:pt-4">
          <Image src="/logo.png" alt="Obliq" width={104} height={40} priority />
        </header>

        <div className="flex flex-1 items-center justify-center px-2 py-6 sm:px-4 sm:py-8 md:py-12 lg:py-16">
          <section className="w-full max-w-[420px] rounded-xl sm:rounded-2xl md:rounded-3xl bg-white px-4 py-5 sm:px-6 sm:py-7 md:px-8 md:py-9 lg:px-10 lg:py-10 ring-0 [border:10px_solid_#00000005] shadow-[0_16px_34px_#C2C2C21A] transition-all duration-200">
            <div className="text-center">
              <h1 className="font-onest font-semibold text-xl leading-7 sm:text-2xl sm:leading-8 md:text-3xl md:leading-9 tracking-[-2%] text-[#202631] align-middle">
                {mode === "login" ? "Login" : "Register"}
              </h1>
              <p className="mt-1 sm:mt-2 md:mt-2.5 font-inter font-normal text-sm sm:text-[15px] md:text-base leading-5 sm:leading-6 md:leading-6 text-[#a0a8b8] align-middle">
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
                className="group mt-4 sm:mt-5 md:mt-6 h-9 sm:h-10 md:h-11 lg:h-12 w-full transform-gpu rounded-lg sm:rounded-[0.875rem] md:rounded-xl border-2 border-[#ff6c3e] bg-[linear-gradient(180deg,#ff7d51_0%,#ff6235_100%)] text-xs sm:text-sm md:text-base font-semibold text-white shadow-[0_8px_16px_rgba(255,109,64,0.24)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-none hover:bg-white hover:text-[#f26639] hover:shadow-[0_10px_22px_rgba(255,109,64,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                <span className="inline-flex items-center justify-center gap-1.5">
                  <span>{isSubmitting ? "Please wait..." : submitLabel}</span>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.3333 8H3.33325"
                      stroke="#FD6D3F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.66675 12C8.66675 12 12.6667 9.05407 12.6667 8C12.6667 6.94587 8.66675 4 8.66675 4"
                      stroke="#FD6D3F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
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
        </div>
      </div>
    </main>
  );
}
