'use client';

import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MailCheck } from 'lucide-react';
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
      title="Reset password"
      subtitle="Enter your account email to receive a reset link."
      footerLabel="Back to"
      footerHref="/login"
      footerLinkLabel="Login"
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
          <Input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
          />
        </div>
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
