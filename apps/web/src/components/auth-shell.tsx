'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function AuthShell({
  title,
  subtitle,
  footerLabel,
  footerHref,
  footerLinkLabel,
  children,
}: {
  title: string;
  subtitle: string;
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
  children: ReactNode;
}) {
  const year = new Date().getFullYear();

  return (
    <main className="app-page-bg min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <div className="app-panel mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1380px] flex-col sm:min-h-[calc(100vh-2rem)]">
        <header className="flex items-center justify-between border-b border-app-line px-4 py-3 sm:px-5">
          <div className="inline-flex items-center gap-2">
            <span className="app-logo-mark">S</span>
            <span className="text-base font-semibold text-app-ink">SynapseHub</span>
          </div>
          <div className="inline-flex items-center gap-2.5">
            <p className="hidden text-sm font-medium text-app-muted md:block">{footerLabel}</p>
            <Link href={footerHref} className="app-control inline-flex h-10 items-center px-3.5 text-sm font-semibold">
              {footerLinkLabel}
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <section className="flex flex-1 items-center px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid w-full items-stretch gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <article className="app-auth-anchor relative hidden overflow-hidden rounded-2xl p-6 lg:flex lg:flex-col lg:justify-between">
              <div className="relative z-10">
                <p className="app-kicker">Enterprise workspace</p>
                <h2 className="mt-2 max-w-[24rem] text-3xl font-bold leading-tight text-app-ink">
                  Collaboration, governance, and delivery in one secure workspace.
                </h2>
                <p className="mt-3 max-w-[24rem] text-sm text-app-muted">
                  Run channels, direct messages, workflows, and search with consistent access controls.
                </p>
              </div>

              <div className="relative z-10 space-y-2">
                <AnchorRow
                  icon={<Sparkles size={15} className="text-indigo-600 dark:text-indigo-300" />}
                  label="Realtime messaging and thread collaboration"
                />
                <AnchorRow
                  icon={<ShieldCheck size={15} className="text-indigo-600 dark:text-indigo-300" />}
                  label="Role-based access with audit-ready operations"
                />
                <AnchorRow
                  icon={<CheckCircle2 size={15} className="text-indigo-600 dark:text-indigo-300" />}
                  label="Workspace setup designed for scale and reliability"
                />
              </div>

              <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -right-8 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
            </article>

            <div className="app-panel w-full max-w-[470px] self-center justify-self-center px-5 py-6 sm:px-6 sm:py-7 lg:justify-self-end">
              <h1 className="text-4xl font-bold leading-tight text-app-ink">{title}</h1>
              <p className="mt-2 text-sm text-app-muted">{subtitle}</p>
              {children}
            </div>
          </div>
        </section>

        <footer className="border-t border-app-line px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-app-muted">
            <a href="#" className="hover:text-app-ink">
              Status
            </a>
            <a href="#" className="hover:text-app-ink">
              Support
            </a>
            <a href="#" className="hover:text-app-ink">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-app-ink">
              Terms of Service
            </a>
          </div>
          <p className="mt-2 text-center text-xs text-app-muted">(c) {year} SynapseHub Inc. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}

function AnchorRow({
  icon,
  label,
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <p className="app-auth-dot inline-flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium">
      {icon}
      {label}
    </p>
  );
}
