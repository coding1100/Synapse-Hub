import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-20 text-center">
      <span className="animate-riseIn rounded-full bg-white px-4 py-2 text-sm font-medium text-ocean shadow-panel">
        SynapseHub Collaboration Cloud
      </span>
      <h1 className="font-display text-5xl font-bold leading-tight text-ink">Build momentum where your teams talk</h1>
      <p className="max-w-2xl text-lg text-slate-600">
        SynapseHub combines channels, direct messaging, threads, and realtime notifications for high-scale distributed teams.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link href="/register" className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accentDeep">
          Create account
        </Link>
        <Link href="/login" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 transition hover:border-slate-400">
          Sign in
        </Link>
      </div>
    </main>
  );
}