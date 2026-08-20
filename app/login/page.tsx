'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf, Loader2, Eye, EyeOff } from 'lucide-react';
import { safeInternalPath } from '@/lib/auth/redirect';

function nextPathFromWindow() {
  if (typeof window === 'undefined') return '/profile';
  return safeInternalPath(new URLSearchParams(window.location.search).get('redirect'));
}

export default function LoginPage() {
  const { user, login, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nextPath, setNextPath] = useState('/profile');

  useEffect(() => {
    setNextPath(nextPathFromWindow());
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user && !authLoading) {
      router.push(nextPath);
    }
  }, [user, authLoading, router, nextPath]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-cream dark:bg-forest-deep flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-forest" />
      </div>
    );
  }

  // Don't render form if already logged in (prevents flash)
  if (user) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      router.push(nextPath);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-cream dark:bg-forest-deep flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md border-forest/10 shadow-lift rounded-3xl dark:border-sage/20 dark:bg-forest">
        <CardHeader className="text-center pt-10">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-forest rounded-full flex items-center justify-center">
              <Leaf className="h-6 w-6 text-cream" />
            </div>
          </div>
          <p className="eyebrow mb-2">Welcome back</p>
          <CardTitle className="font-serif text-3xl font-medium text-forest dark:text-cream">Sign in</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Continue your care, on any device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="dark:text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="dark:bg-[#2a3a2b] dark:border-[#3d523e] dark:text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="dark:text-gray-300">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="dark:bg-[#2a3a2b] dark:border-[#3d523e] dark:text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-forest hover:bg-forest-mist text-cream"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link href={`/signup?redirect=${encodeURIComponent(nextPath)}`} className="text-bronze hover:underline font-medium">
              Get Started
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}