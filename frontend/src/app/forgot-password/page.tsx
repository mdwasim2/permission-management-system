"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type ForgotPasswordResponse = {
  message?: string;
  resetToken?: string;
  resetLink?: string;
};

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resetLink, setResetLink] = useState<string | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setResetLink(null);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok) {
        setErrorMessage(result.message ?? "Unable to process your request");
        return;
      }

      setSuccessMessage(
        result.message ?? "If this email exists, reset instructions were sent.",
      );
      setResetLink(result.resetLink ?? null);
    } catch {
      setErrorMessage("Unable to reach the backend API right now");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fffdfb] px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-md rounded-3xl bg-white px-6 py-8 shadow-[0_16px_34px_#C2C2C21A] [border:10px_solid_#00000005] sm:px-8 sm:py-10">
        <h1 className="font-onest text-2xl font-semibold text-[#202631] sm:text-3xl">
          Forgot password
        </h1>
        <p className="mt-2 text-sm text-[#7f8796] sm:text-base">
          Enter your email and we will generate a reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#414d61]">
              Email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              placeholder="example@email.com"
              className="h-11 w-full rounded-xl border border-[#e8ebf0] bg-white px-4 text-sm text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-2 focus:ring-[#ffe5da]"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#c94f2d]">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl bg-[#eefaf2] px-4 py-3 text-sm text-[#22543d]">
              <p className="font-semibold">{successMessage}</p>
              {resetLink ? (
                <p className="mt-1 break-all">
                  Dev reset link:{" "}
                  <Link className="underline" href={resetLink}>
                    {resetLink}
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl border-2 border-[#ff6c3e] bg-[linear-gradient(180deg,#ff7d51_0%,#ff6235_100%)] text-sm font-semibold text-white transition hover:bg-none hover:bg-white hover:text-[#f26639] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : "Generate reset link"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7f8796]">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#202631] hover:text-[#ff6b3d]"
          >
            Back to login
          </Link>
        </p>
      </section>
    </main>
  );
}
