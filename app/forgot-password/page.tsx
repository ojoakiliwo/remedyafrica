// app/forgot-password/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/firebase/client';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim(), {
        url: typeof window !== 'undefined' ? `${window.location.origin}/login` : '',
      });
      setSent(true);
      toast.success('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Password reset error:', error);
      let message = 'Failed to send reset email. Please try again.';
      if (error.code === 'auth/user-not-found') {
        message = 'No account found with this email address.';
      } else if (error.code === 'auth/invalid-email') {
        message = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#2C3E2D] mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-2">
            We've sent a password reset link to:
          </p>
          <p className="font-medium text-[#2C3E2D] mb-6">{email}</p>
          <p className="text-sm text-gray-500 mb-6">
            Click the link in the email to reset your password. If you don't see it, check your spam folder.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => { setSent(false); setEmail(''); }}
              variant="outline"
              className="w-full"
            >
              Send to a different email
            </Button>
            <Link href="/login">
              <Button className="w-full bg-[#97A97C] hover:bg-[#7A8A63]">
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <Link href="/login" className="text-[#97A97C] hover:text-[#7A8A63] text-sm flex items-center gap-1 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-[#97A97C]/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-[#97A97C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2C3E2D]">Reset Your Password</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#2C3E2D] mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#97A97C] outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#97A97C] hover:bg-[#7A8A63] h-12"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-[#97A97C] hover:text-[#7A8A63] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}