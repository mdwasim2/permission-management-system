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
    <main className="relative min-h-screen overflow-hidden bg-[#fffdfb] px-4 py-6 sm:px-5 sm:py-8 md:px-7 md:py-10">
      <div className="pointer-events-none absolute left-1/2 top-[44%] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full " />
      <div className="pointer-events-none absolute " />
      <div className="relative flex min-h-[calc(100vh-3rem)] flex-col sm:min-h-[calc(100vh-4rem)]">
        <header className="flex items-start justify-start">
          <Image src="/logo.png" alt="Obliq" width={104} height={40} />
        </header>

        <div className="flex flex-1 items-center justify-center py-6 sm:py-10 md:py-16">
          <section className="w-full max-w-sm rounded-2xl bg-white px-5 py-6 ring-0 sm:max-w-[27.25rem] sm:rounded-[2rem] sm:px-6 sm:py-8 md:px-10 [border:10px_solid_#00000005] shadow-[0_16px_34px_#C2C2C21A]">
            <div className="text-center">
              <h1 className="font-onest font-semibold text-2xl leading-8 tracking-[-2%] text-[#202631] align-middle">
                {mode === "login" ? "Login" : "Register"}
              </h1>
              <p className="mt-0.5 font-inter font-normal text-[15px] leading-6 text-[#a0a8b8] align-middle sm:mt-2 sm:text-[15px] md:text-[15px]">
                {mode === "login"
                  ? "Enter your details to continue"
                  : "Create your account to continue"}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-3.5 sm:mt-10 sm:space-y-5"
            >
              {mode === "register" ? (
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[#414d61] sm:mb-2.5 sm:text-[0.9rem] md:text-[1.05rem]">
                    Full name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    type="text"
                    placeholder="John Doe"
                    className="h-10 w-full rounded-lg border border-[#e8ebf0] bg-white px-3 text-xs text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-3 focus:ring-[#ffe5da] sm:h-[3.45rem] sm:rounded-[1.05rem] sm:px-4 sm:text-[1rem] sm:focus:ring-4"
                  />
                </label>
              ) : null}

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#414d61] sm:mb-2.5 sm:text-[0.9rem] md:text-[1.05rem]">
                  Email
                </span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="example@email.com"
                  className="h-10 w-full rounded-lg border border-[#e8ebf0] bg-white px-3 text-xs text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-3 focus:ring-[#ffe5da] sm:h-[3.45rem] sm:rounded-[1.05rem] sm:px-4 sm:text-[1rem] sm:focus:ring-4"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[#414d61] sm:mb-2.5 sm:text-[0.9rem] md:text-[1.05rem]">
                  Password
                </span>
                <div className="flex h-10 items-center rounded-lg border border-[#e8ebf0] bg-white pr-3 transition focus-within:border-[#ff6b3d] focus-within:ring-3 focus-within:ring-[#ffe5da] sm:h-[3.45rem] sm:rounded-[1.05rem] sm:pr-4 sm:focus-within:ring-4">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="h-full flex-1 rounded-lg bg-transparent px-3 text-xs text-[#202631] outline-none placeholder:text-[#b1b8c4] sm:rounded-[1.05rem] sm:px-4 sm:text-[1rem]"
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
                <div className="flex flex-col gap-2.5 text-[0.8rem] text-[#7f8796] sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:text-[0.98rem]">
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
                <p className="text-[0.8rem] text-[#7f8796] sm:text-[0.98rem]">
                  New accounts are created with the{" "}
                  <span className="font-medium text-[#414d61]">Customer</span>{" "}
                  role.
                </p>
              )}

              {errorMessage ? (
                <p className="rounded-lg bg-[#fff0ea] px-3 py-2.5 text-xs text-[#c94f2d] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                  {errorMessage}
                </p>
              ) : null}

              {successData ? (
                <div className="rounded-lg bg-[#eefaf2] px-3 py-2.5 text-xs text-[#22543d] sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
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
                className="group mt-2 h-10 w-full transform-gpu rounded-lg border-2 border-[#ff6c3e] bg-[linear-gradient(180deg,#ff7d51_0%,#ff6235_100%)] text-xs font-medium text-white shadow-[0_8px_16px_rgba(255,109,64,0.24)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-none hover:bg-white hover:text-[#f26639] hover:shadow-[0_10px_22px_rgba(255,109,64,0.2)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 sm:mt-3 sm:h-[3.45rem] sm:rounded-[1rem] sm:text-[1.02rem] sm:shadow-[0_10px_28px_rgba(255,109,64,0.32)]"
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

            <p className="mt-6 text-center text-[0.8rem] text-[#7f8796] sm:mt-10 sm:text-[0.95rem]">
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
