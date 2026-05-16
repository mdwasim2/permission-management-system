"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type ResetPasswordResponse = {
  message?: string;
};

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("Reset token is missing from the URL");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const result = (await response.json()) as ResetPasswordResponse;

      if (!response.ok) {
        setErrorMessage(result.message ?? "Could not reset password");
        return;
      }

      setSuccessMessage(result.message ?? "Password reset successful");
      setPassword("");
      setConfirmPassword("");
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
          Reset password
        </h1>
        <p className="mt-2 text-sm text-[#7f8796] sm:text-base">
          Set a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#414d61]">
              New password
            </span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              required
              minLength={6}
              placeholder="Enter your new password"
              className="h-11 w-full rounded-xl border border-[#e8ebf0] bg-white px-4 text-sm text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-2 focus:ring-[#ffe5da]"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-[#414d61]">
              Confirm password
            </span>
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type="password"
              required
              minLength={6}
              placeholder="Retype your new password"
              className="h-11 w-full rounded-xl border border-[#e8ebf0] bg-white px-4 text-sm text-[#202631] outline-none transition placeholder:text-[#b1b8c4] focus:border-[#ff6b3d] focus:ring-2 focus:ring-[#ffe5da]"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl bg-[#fff0ea] px-4 py-3 text-sm text-[#c94f2d]">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl bg-[#eefaf2] px-4 py-3 text-sm text-[#22543d]">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-xl border-2 border-[#ff6c3e] bg-[linear-gradient(180deg,#ff7d51_0%,#ff6235_100%)] text-sm font-semibold text-white transition hover:bg-none hover:bg-white hover:text-[#f26639] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Please wait..." : "Reset password"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7f8796]">
          Go back to{" "}
          <Link
            href="/login"
            className="font-semibold text-[#202631] hover:text-[#ff6b3d]"
          >
            login
          </Link>
        </p>
      </section>
    </main>
  );
}
