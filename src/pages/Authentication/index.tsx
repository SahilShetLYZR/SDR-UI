import { Outlet } from "react-router-dom";

const capabilities = [
  {
    n: "01",
    title: "Research",
    copy: "Every prospect researched across LinkedIn, news, and the web before a single word is written.",
  },
  {
    n: "02",
    title: "Outreach",
    copy: "Emails drafted per prospect from your own materials and sent on your schedule, not a template blast.",
  },
  {
    n: "03",
    title: "Follow-through",
    copy: "Replies answered with full context and your booking link shared at the right time.",
  },
];

export default () => {
  return (
    <div className="flex min-h-dvh flex-col bg-ink text-white lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-1 flex-col overflow-hidden px-6 py-10 sm:px-12 lg:px-16 lg:py-12">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="auth-orb absolute -left-24 -top-32 h-[28rem] w-[28rem] rounded-full bg-purple-500/35 blur-3xl" />
          <div className="auth-orb-slow absolute -bottom-40 -right-24 h-[32rem] w-[32rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="auth-grid absolute inset-0" />
          <div className="auth-noise absolute inset-0" />
        </div>

        <header className="auth-reveal relative z-10 flex items-center gap-2.5">
          <img src="/Lyzr-Logo.svg" alt="Lyzr" className="h-9 w-9 rounded-xl ring-1 ring-white/20" />
          <span className="brand-wordmark text-lg font-medium tracking-tight">Jazon</span>
          <span className="ml-1 rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-white/70">
            AI SDR by Lyzr
          </span>
        </header>

        <div className="relative z-10 my-auto py-14 lg:py-10">
          <h1
            className="auth-reveal max-w-xl font-display text-4xl font-medium leading-[1.08] sm:text-5xl xl:text-6xl"
            style={{ animationDelay: "120ms" }}
          >
            Your pipeline,
            <br />
            <em className="text-purple-300">on autopilot.</em>
          </h1>
          <p
            className="auth-reveal mt-6 max-w-md text-base leading-relaxed text-white/75"
            style={{ animationDelay: "240ms" }}
          >
            Jazon researches every prospect, writes outreach that sounds like
            you, and books the meetings while your team sells.
          </p>
        </div>

        <div
          className="auth-reveal relative z-10 grid gap-4 sm:grid-cols-3"
          style={{ animationDelay: "360ms" }}
        >
          {capabilities.map((c) => (
            <div
              key={c.n}
              className="rounded-2xl border border-white/10 bg-ink-light/60 p-5 shadow-lg shadow-black/10 backdrop-blur transition-colors duration-200 hover:border-purple-400/30 hover:bg-ink-light/80"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-display text-sm italic text-purple-300/80">
                  {c.n}
                </span>
                <h3 className="text-sm font-semibold tracking-wide">
                  {c.title}
                </h3>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-white/70">
                {c.copy}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Sign-in panel */}
      <div className="relative z-10 flex w-full items-center justify-center border-t border-white/10 bg-white px-6 py-14 text-zinc-900 lg:w-[460px] lg:border-l lg:border-t-0 xl:w-[520px]">
        <Outlet />
      </div>
    </div>
  );
};
