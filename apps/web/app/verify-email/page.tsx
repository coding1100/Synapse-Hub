'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, MailWarning } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth-shell';
import { resolveApiError } from '@/lib/http-error';
import { resendVerification, verifyEmail } from '@/lib/queries';
import { Button, Input } from '@synapsehub/ui';

export default function VerifyEmailPage() {
  const [token, setToken] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resendEmailValue, setResendEmailValue] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken((params.get('token') ?? '').trim());
  }, []);

  const verifyMutation = useMutation({
    mutationFn: () => verifyEmail(token),
    onSuccess: () => {
      setFeedback('Email verified successfully. You can continue to login.');
      toast.success('Email verified');
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to verify email token.');
      setFeedback(message);
      toast.error(message);
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerification(resendEmailValue),
    onSuccess: (result) => {
      setFeedback(result.message);
      toast.success('Verification email sent');
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to resend verification email.');
      setFeedback(message);
      toast.error(message);
    },
  });

  useEffect(() => {
    if (token) {
      verifyMutation.mutate();
      return;
    }
    setFeedback((current) => current ?? 'Verification token is missing.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell
      title="Verify email"
      subtitle="Complete account verification to activate secure workspace access."
      footerLabel="Go to"
      footerHref="/login"
      footerLinkLabel="Login"
    >
      <div className="mt-6 space-y-4">
        {verifyMutation.isPending && (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-app-muted">
            <MailWarning size={15} />
            Verifying token...
          </p>
        )}

        {feedback && (
          <p className={`text-sm font-semibold ${verifyMutation.isError ? 'text-red-600' : 'text-emerald-700'}`}>
            {feedback}
          </p>
        )}

        {verifyMutation.isSuccess && (
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={15} />
            Email verification completed.
          </p>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFeedback(null);
            resendMutation.mutate();
          }}
          className="space-y-3 rounded-2xl border border-app-line bg-app-soft p-4"
        >
          <p className="text-sm font-semibold text-app-ink">Need another verification email?</p>
          <Input
            type="email"
            required
            value={resendEmailValue}
            onChange={(event) => setResendEmailValue(event.target.value)}
            placeholder="you@company.com"
          />
          <Button type="submit" className="w-full" disabled={resendMutation.isPending || !resendEmailValue.trim()}>
            {resendMutation.isPending ? 'Sending...' : 'Resend verification email'}
          </Button>
        </form>

        <p className="text-sm text-app-muted">
          Continue to{' '}
          <Link href="/login" className="font-semibold text-blue-700 hover:underline">
            login
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
