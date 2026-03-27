import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, MessageSquareText, Sparkles, UsersRound, Workflow } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function HomePage() {
  return (
    <main className="app-page-bg min-h-screen px-3 py-3 sm:px-4 sm:py-4">
      <div className="app-panel mx-auto flex min-h-[calc(100vh-1.5rem)] w-full max-w-[1380px] flex-col sm:min-h-[calc(100vh-2rem)]">
        <header className="flex items-center justify-between border-b border-app-line px-4 py-3">
          <div className="inline-flex items-center gap-2">
            <span className="app-logo-mark">S</span>
            <div>
              <p className="text-sm font-semibold text-app-ink">SynapseHub</p>
              <p className="text-xs text-app-muted">Team collaboration cloud</p>
            </div>
          </div>
          <div className="inline-flex items-center gap-2">
            <ThemeToggle compact />
            <Link
              href="/login"
              className="app-control inline-flex h-9 items-center px-3 text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>
        </header>

        <section className="grid flex-1 gap-5 px-4 py-5 lg:grid-cols-[1.2fr_0.8fr] lg:px-6 lg:py-6">
          <div className="space-y-5">
            <div>
              <span className="app-chip inline-flex items-center gap-1.5">
                <Sparkles size={13} />
                SynapseHub Workspace Suite
              </span>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight text-app-ink sm:text-5xl">
                Collaboration built for modern product teams.
              </h1>
              <p className="mt-3 max-w-2xl text-base text-app-muted">
                Realtime channels, direct messages, threads, search, file sharing, and automation in one
                consistent workspace experience.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                Create account
                <ArrowRight size={15} />
              </Link>
              <Link href="/login" className="app-control inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-semibold">
                Login
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <FeatureCard
                icon={<MessageSquareText size={16} className="text-indigo-600 dark:text-indigo-300" />}
                title="Realtime messaging"
                subtitle="Low-latency channels and DM flows."
              />
              <FeatureCard
                icon={<UsersRound size={16} className="text-indigo-600 dark:text-indigo-300" />}
                title="Team governance"
                subtitle="Role-based workspace controls."
              />
              <FeatureCard
                icon={<Bot size={16} className="text-indigo-600 dark:text-indigo-300" />}
                title="Automation ready"
                subtitle="Bot and integration endpoints built in."
              />
            </div>
          </div>

          <aside className="app-panel-soft p-4">
            <p className="app-kicker">Platform strengths</p>
            <div className="mt-3 space-y-2">
              <InfoRow
                icon={<Workflow size={14} className="text-indigo-600 dark:text-indigo-300" />}
                title="Event-driven architecture"
                body="Socket.IO + Redis Pub/Sub with horizontal scalability."
              />
              <InfoRow
                icon={<UsersRound size={14} className="text-indigo-600 dark:text-indigo-300" />}
                title="Enterprise-ready auth"
                body="JWT sessions, refresh tokens, OAuth, RBAC and audit logging."
              />
              <InfoRow
                icon={<MessageSquareText size={14} className="text-indigo-600 dark:text-indigo-300" />}
                title="Unified workspace UX"
                body="Consistent light and dark mode across all product surfaces."
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <article className="app-panel-soft p-3">
      <div>{icon}</div>
      <p className="mt-2 text-sm font-semibold text-app-ink">{title}</p>
      <p className="mt-1 text-xs text-app-muted">{subtitle}</p>
    </article>
  );
}

function InfoRow({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <article className="app-panel border bg-app-panel p-3 shadow-none">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-ink">
        {icon}
        {title}
      </p>
      <p className="mt-1 text-xs text-app-muted">{body}</p>
    </article>
  );
}
