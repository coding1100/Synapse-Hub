'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { register } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Card, Input, Button } from '@synapsehub/ui';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('Owner');
  const [email, setEmail] = useState('owner@synapsehub.local');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { setSession } = useAuth();

  const mutation = useMutation({
    mutationFn: () => register(email, password, displayName),
    onSuccess: (session) => {
      setErrorMessage(null);
      setSession(session);
      router.push('/dashboard');
    },
    onError: (error) => {
      const axiosError = error as AxiosError<{ message?: string | string[] }>;
      const payloadMessage = axiosError.response?.data?.message;
      if (Array.isArray(payloadMessage)) {
        setErrorMessage(payloadMessage[0] ?? 'Registration failed. Please try again.');
        return;
      }
      setErrorMessage(payloadMessage ?? 'Registration failed. Please try again.');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
      <Card className="w-full p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Create account</h1>
        <p className="mt-2 text-sm text-slate-600">Provision your SynapseHub identity.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Display name</label>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </div>
          {mutation.isError && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-ocean hover:underline">
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}
