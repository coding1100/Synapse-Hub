'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { UserPlus2 } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth-shell';
import { resolveApiError } from '@/lib/http-error';
import { register } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Input, Button } from '@synapsehub/ui';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  const { setSession, isLoaded, isAuthenticated } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get('next'));
  }, []);

  useEffect(() => {
    if (isLoaded && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoaded, router]);

  const mutation = useMutation({
    mutationFn: () => register(email, password, displayName),
    onSuccess: (session) => {
      setErrorMessage(null);
      setSession(session);
      toast.success('Account created. Verification email sent.');
      router.push(resolveNextPath(nextPath));
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Registration failed. Please try again.');
      setErrorMessage(message);
      toast.error(message);
    },
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    mutation.mutate();
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Set up your SynapseHub identity and get started."
      footerLabel="Already have an account?"
      footerHref="/login"
      footerLinkLabel="Sign in"
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-app-ink">Display name</label>
          <Input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-app-ink">Email address</label>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-app-ink">Password</label>
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
        </div>
        {mutation.isError && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          <UserPlus2 size={15} className="mr-1" />
          {mutation.isPending ? 'Creating account...' : 'Register'}
        </Button>
        <p className="text-center text-xs text-app-muted">
          We will send an email verification link after registration.
        </p>
      </form>
    </AuthShell>
  );
}

function resolveNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith('/')) {
    return '/dashboard';
  }

  if (nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}
