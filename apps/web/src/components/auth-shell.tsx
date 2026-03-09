'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, Workflow } from 'lucide-react';
import { Card } from '@synapsehub/ui';

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
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-3 py-8 sm:px-4 sm:py-10">
      <div className="grid w-full gap-3 sm:gap-4 lg:grid-cols-[1.05fr_1fr]">
        <motion.section
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative hidden overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-8 text-white shadow-panel lg:flex lg:flex-col lg:justify-between"
        >
          <div className="pointer-events-none absolute -right-16 top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/85">
              <Sparkles size={12} />
              SynapseHub
            </p>
            <h2 className="mt-3 text-4xl font-bold leading-tight">
              Team communication with enterprise-grade clarity.
            </h2>
            <p className="mt-4 max-w-md text-sm text-white/85">
              Channels, direct messages, mentions, threads, and integrations in one modern workspace.
            </p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="inline-flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2">
              <Workflow size={14} />
              Event-driven architecture with low-latency messaging
            </p>
            <p className="inline-flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2">
              <ShieldCheck size={14} />
              JWT auth, RBAC controls, and enterprise-ready security
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 14 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="flex items-center"
        >
          <Card className="w-full p-5 sm:p-7">
            <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
            <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
            {children}
            <p className="mt-4 text-sm text-slate-600">
              {footerLabel}{' '}
              <Link href={footerHref} className="font-semibold text-blue-700 hover:underline">
                {footerLinkLabel}
              </Link>
            </p>
          </Card>
        </motion.section>
      </div>
    </main>
  );
}
