import Link from 'next/link';
import { ArrowRight, Bot, MessageSquareText, Sparkles, UsersRound, Workflow } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-20">
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
          <Sparkles size={14} />
          SynapseHub Collaboration Cloud
        </span>
        <h1 className="mt-5 text-5xl font-bold leading-tight text-ink lg:text-6xl">
          Collaboration built for modern product teams.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          A realtime workspace with channels, DMs, threads, mentions, bots, and delivery workflows in one polished platform.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-accent to-accentDeep px-6 py-3 font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:brightness-95"
        >
          Create account
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/login"
          className="rounded-2xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Sign in
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="app-glass p-5">
          <MessageSquareText size={18} className="text-blue-600" />
          <h2 className="mt-3 text-xl font-bold text-ink">Realtime messaging</h2>
          <p className="mt-1 text-sm text-slate-600">Low-latency channels and thread-first conversations.</p>
        </div>
        <div className="app-glass p-5">
          <UsersRound size={18} className="text-blue-600" />
          <h2 className="mt-3 text-xl font-bold text-ink">Workspace governance</h2>
          <p className="mt-1 text-sm text-slate-600">Role-based control for owners, admins, members, and guests.</p>
        </div>
        <div className="app-glass p-5">
          <Bot size={18} className="text-blue-600" />
          <h2 className="mt-3 text-xl font-bold text-ink">Automation ready</h2>
          <p className="mt-1 text-sm text-slate-600">Integrate bots and external workflows without friction.</p>
        </div>
      </div>

      <section className="app-glass grid gap-4 p-5 md:grid-cols-3">
        <div className="app-muted-box">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Workflow size={14} className="text-blue-600" />
            Event-driven architecture
          </p>
          <p className="mt-1 text-xs text-slate-500">Socket.IO, Redis Pub/Sub, and service boundaries for scale.</p>
        </div>
        <div className="app-muted-box">
          <p className="text-sm font-semibold text-slate-800">Enterprise-safe auth</p>
          <p className="mt-1 text-xs text-slate-500">JWT + refresh tokens, OAuth, RBAC, and audit trails.</p>
        </div>
        <div className="app-muted-box">
          <p className="text-sm font-semibold text-slate-800">Operational clarity</p>
          <p className="mt-1 text-xs text-slate-500">Observability-ready with logs, metrics, and deployment pipelines.</p>
        </div>
      </section>
    </main>
  );
}
