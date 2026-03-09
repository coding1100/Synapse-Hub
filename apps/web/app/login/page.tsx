'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { toast } from 'sonner';
import { AuthShell } from '@/components/auth-shell';
import { resolveApiError } from '@/lib/http-error';
import { login } from '@/lib/queries';
import { useAuth } from '@/providers/auth-provider';
import { Input, Button } from '@synapsehub/ui';

export default function LoginPage() {
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
    mutationFn: () => login(email, password),
    onSuccess: (session) => {
      setErrorMessage(null);
      setSession(session);
      toast.success('Welcome back');
      router.push(resolveNextPath(nextPath));
    },
    onError: (error) => {
      const message = resolveApiError(error, 'Login failed. Check credentials and try again.');
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
      title="Login"
      subtitle="Sign in to your SynapseHub workspace."
      footerLabel="No account?"
      footerHref="/register"
      footerLinkLabel="Register"
    >
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Email</label>
          <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Password</label>
          <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
          <div className="mt-2 text-right text-xs">
            <Link href="/forgot-password" className="font-semibold text-blue-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        {mutation.isError && <p className="text-sm font-semibold text-red-600">{errorMessage}</p>}
        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          <LogIn size={15} className="mr-1" />
          {mutation.isPending ? 'Signing in...' : 'Sign in'}
        </Button>
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
