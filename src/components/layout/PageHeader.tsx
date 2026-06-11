import { ReactNode } from "react";

interface PageHeaderProps {
  /** Small italic serif label above the title, e.g. "Workspace" */
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  /** Right-aligned action buttons */
  actions?: ReactNode;
  /** Rendered before the title block (e.g. a back link) */
  leading?: ReactNode;
  /** Full-width row at the bottom of the band (e.g. tabs) */
  children?: ReactNode;
}

/**
 * Dark editorial header band — the "dark" half of the app's white/dark mix.
 * Pairs with the auth landing page: ink background, Fraunces display type,
 * purple aurora, faint grid + grain.
 */
const PageHeader = ({
  eyebrow,
  title,
  description,
  actions,
  leading,
  children,
}: PageHeaderProps) => {
  return (
    <header className="relative shrink-0 overflow-hidden bg-ink text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute -left-20 bottom-[-8rem] h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="auth-grid absolute inset-0" />
        <div className="auth-noise absolute inset-0" />
      </div>

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 px-6 py-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {leading}
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-display text-xs italic tracking-wide text-purple-300">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-0.5 truncate font-display text-2xl font-medium tracking-tight sm:text-[1.7rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/70">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {children && <div className="relative z-10">{children}</div>}
    </header>
  );
};

export default PageHeader;
