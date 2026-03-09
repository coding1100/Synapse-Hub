'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth-shell';
import { resolveApiError } from '@/lib/http-error';
import { resetPassword } from '@/lib/queries';
import { Button, Input } from '@synapsehub/ui';
import { useEffect } from 'react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken((params.get('token') ?? '').trim());
  }, []);

  const mutation = useMutation({
    mutationFn: () => resetPassword(token, password),
    onSuccess: () => {
      setFeedback('Password updated successfully. You can now sign in.');
      toast.success('Password updated');
      setPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Unable to reset password.');
      setFeedback(message);
      toast.error(message);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFeedback(null);

    if (!token) {
      setFeedback('Reset token is missing.');
      return;
    }

    if (password !== confirmPassword) {
      setFeedback('Passwords do not match.');
      return;
    }

    mutation.mutate();
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a strong password to secure your account."
      footerLabel="Remembered it?"
      footerHref="/login"
      footerLinkLabel="Login"
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">New password</label>
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Confirm password</label>
          <Input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={mutation.isPending || !password || !confirmPassword}>
          <KeyRound size={15} className="mr-1" />
          {mutation.isPending ? 'Updating...' : 'Update password'}
        </Button>
        {feedback && (
          <p className={`text-sm font-semibold ${mutation.isError ? 'text-red-600' : 'text-emerald-700'}`}>
            {feedback}
          </p>
        )}
        {!token && (
          <p className="text-sm text-slate-600">
            Reset link is invalid. Request a new link from{' '}
            <Link href="/forgot-password" className="font-semibold text-blue-700 hover:underline">
              forgot password
            </Link>
            .
          </p>
        )}
      </form>
    </AuthShell>
  );
}
