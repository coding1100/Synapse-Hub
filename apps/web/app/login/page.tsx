'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { login } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Card, Input, Button } from '@synapsehub/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('owner@synapsehub.local');
  const [password, setPassword] = useState('password123');
  const router = useRouter();
  const { setSession } = useAuth();

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (session) => {
      setSession(session);
      router.push('/dashboard');
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4 py-12">
      <Card className="w-full p-6">
        <h1 className="font-display text-3xl font-bold text-ink">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to your SynapseHub workspace.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
            <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
            <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          </div>
          {mutation.isError && (
            <p className="text-sm font-semibold text-red-600">Login failed. Check credentials and try again.</p>
          )}
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          No account?{' '}
          <Link href="/register" className="font-semibold text-ocean hover:underline">
            Register
          </Link>
        </p>
      </Card>
    </main>
  );
}