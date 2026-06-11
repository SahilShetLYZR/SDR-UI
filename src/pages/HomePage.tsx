import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Mail, Rocket, Search, Settings2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const quickLinks = [
  {
    to: "/campaign",
    icon: Rocket,
    title: "Campaigns",
    copy: "Create a campaign, load your prospects, and let Jazon run the outreach.",
    cta: "Open campaigns",
  },
  {
    to: "/settings/domain-configs",
    icon: Settings2,
    title: "Email setup",
    copy: "Connect the sending addresses Jazon writes from. Up to 10 per workspace.",
    cta: "Configure email",
  },
];

const steps = [
  { icon: Search, label: "Research", copy: "LinkedIn, news, and web intel on demand." },
  { icon: Mail, label: "Outreach", copy: "Drafts and sends in your voice." },
  { icon: ArrowUpRight, label: "Follow-through", copy: "Detects replies, answers in context." },
];

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const firstName = user?.email?.split("@")[0]?.split(/[._-]/)[0] ?? "";
  const greeting = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : "there";

  return (
    <div className="flex min-h-full flex-col">
      {/* Dark hero band */}
      <section className="relative shrink-0 overflow-hidden bg-ink px-5 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="auth-orb absolute -left-24 -top-32 h-[24rem] w-[24rem] rounded-full bg-purple-500/35 blur-3xl" />
          <div className="auth-orb-slow absolute -bottom-32 right-[-6rem] h-[26rem] w-[26rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="auth-grid absolute inset-0" />
          <div className="auth-noise absolute inset-0" />
        </div>

        <div className="relative z-10 max-w-2xl">
          <p className="auth-reveal font-display text-sm italic text-purple-300">
            Welcome back, {greeting}
          </p>
          <h1
            className="auth-reveal mt-2 font-display text-3xl font-medium leading-[1.12] sm:text-4xl xl:text-[2.75rem]"
            style={{ animationDelay: "120ms" }}
          >
            Let&apos;s fill your calendar
            <br />
            <em className="text-purple-300">with meetings.</em>
          </h1>
          <p
            className="auth-reveal mt-4 max-w-lg text-[15px] leading-relaxed text-white/75"
            style={{ animationDelay: "240ms" }}
          >
            Pick a campaign and Jazon takes it from there: research, outreach,
            and replies, around the clock.
          </p>
          <div className="auth-reveal mt-7" style={{ animationDelay: "360ms" }}>
            <Link
              to="/campaign"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-purple-600 px-5 text-sm font-medium text-white shadow-lg shadow-purple-600/25 transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Go to Campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Light body */}
      <section className="flex-1 px-6 py-10 sm:px-10 lg:px-14">
        <div className="grid max-w-5xl gap-5 md:grid-cols-2">
          {quickLinks.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="group rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                <q.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">{q.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-500">{q.copy}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-purple-600">
                {q.cta}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-12 max-w-5xl">
          <p className="font-display text-sm italic text-purple-600">How Jazon works</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div
                key={s.label}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-200 hover:shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="font-display text-xs italic text-purple-500">
                    0{i + 1}
                  </span>
                  <h4 className="text-sm font-semibold text-zinc-900">{s.label}</h4>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-zinc-500">{s.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
