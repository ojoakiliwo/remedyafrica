// app/verify-email/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/client';
import { applyActionCode, reload, sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'idle'>('idle');
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const mode = url.searchParams.get('mode');
    const oobCode = url.searchParams.get('oobCode');

    if (mode === 'verifyEmail' && oobCode) {
      setStatus('loading');
      applyActionCode(auth, oobCode)
        .then(() => {
          setStatus('success');
          toast.success('Email verified successfully!');
          if (auth.currentUser) {
            reload(auth.currentUser);
          }
          setTimeout(() => router.push('/dashboard'), 3000);
        })
        .catch((err) => {
          console.error('Verification error:', err);
          setStatus('error');
          toast.error('Invalid or expired verification link.');
        });
    }
  }, [router]);

  const handleResend = async () => {
    if (!auth.currentUser) {
      toast.error('Please log in first.');
      return;
    }
    setResending(true);
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/verify-email`,
      });
      toast.success('Verification email sent! Check your inbox.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend email.');
    } finally {
      setResending(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-bronze mx-auto mb-4" />
          <p className="text-gray-600">Verifying your email...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-forest mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-6">
            Your email has been verified. Redirecting you to your dashboard...
          </p>
          <Link href="/dashboard">
            <Button className="bg-forest hover:bg-forest-mist">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-bronze" />
        </div>
        <h2 className="text-2xl font-bold text-forest mb-2">Verify Your Email</h2>
        <p className="text-gray-600 mb-2">
          We've sent a verification link to your email address.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Click the link to verify your account. If you don't see it, check your spam folder.
        </p>

        {status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-red-800 text-sm">The verification link is invalid or expired.</p>
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={handleResend}
            disabled={resending}
            variant="outline"
            className="w-full"
          >
            {resending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>
          <Link href="/login">
            <Button className="w-full bg-forest hover:bg-forest-mist">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}