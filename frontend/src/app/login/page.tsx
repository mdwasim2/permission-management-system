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

export default function LoginPage() {
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
                Login
              </h1>
              <p className="mt-2 text-base text-[#98a1b2] sm:text-[1.05rem]">
                Enter your details to continue
              </p>
            </div>

            <form className="mt-12 space-y-6">
              <label className="block">
                <span className="mb-2.5 block text-[1.02rem] font-medium text-[#3f4b5f]">
                  Email
                </span>
                <input
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
                    type="password"
                    placeholder="Enter your password"
                    className="h-full flex-1 rounded-2xl bg-transparent px-4 text-[1.02rem] text-[#202631] outline-none placeholder:text-[#b0b7c3]"
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
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

              <button
                type="button"
                className="mt-2 h-13 w-full rounded-2xl bg-[linear-gradient(180deg,#ff7e52_0%,#ff6235_100%)] text-[1.02rem] font-medium text-white shadow-[0_16px_28px_rgba(255,107,61,0.34)] transition hover:brightness-[1.02]"
              >
                Log in
              </button>
            </form>

            <p className="mt-12 text-center text-[1rem] text-[#7f8796]">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="font-semibold text-[#202631] transition hover:text-[#ff6b3d]"
              >
                Sign up
              </button>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
