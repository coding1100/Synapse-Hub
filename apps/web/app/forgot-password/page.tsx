'use client';

import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MailCheck, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth-shell';
import { resolveApiError } from '@/lib/http-error';
import { forgotPassword } from '@/lib/queries';
import { Button, Input } from '@synapsehub/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => forgotPassword(email),
    onSuccess: (result) => {
      setFeedback(result.message);
      toast.success('Reset instructions sent');
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to start password reset.');
      setFeedback(message);
      toast.error(message);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);
    mutation.mutate();
  };

  return (
    <AuthShell
      title="Forgot Password"
      subtitle="No worries, it happens. Enter your email address and we will send a secure reset link."
      footerLabel="Back to"
      footerHref="/login"
      footerLinkLabel="Login"
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-app-ink">Email address</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <p className="inline-flex w-full items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-200">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          If an account exists for this email, reset instructions will be sent shortly.
        </p>
        <Button type="submit" className="w-full" disabled={mutation.isPending || !email.trim()}>
          <MailCheck size={15} className="mr-1" />
          {mutation.isPending ? 'Sending...' : 'Send reset link'}
        </Button>
        {feedback && (
          <p className={`text-sm font-semibold ${mutation.isError ? 'text-red-600' : 'text-emerald-700'}`}>
            {feedback}
          </p>
        )}
      </form>
    </AuthShell>
  );
}
