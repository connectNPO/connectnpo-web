'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { org_name: orgName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-sm border border-border rounded-xl p-6 bg-white">
          <h1 className="text-lg font-semibold text-foreground mb-2">Check your email</h1>
          <p className="text-sm text-muted">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Click the link to activate your account.
          </p>
          <Link
            href="/login"
            className="block text-center mt-5 text-sm border border-border rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Create an account</h1>
          <p className="text-sm text-muted mt-2">Financial Dashboard for Nonprofits</p>
        </div>

        <form onSubmit={handleSubmit} className="border border-border rounded-xl p-6 bg-white space-y-4">
          <div>
            <label htmlFor="orgName" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1.5">
              Organization name
            </label>
            <input
              id="orgName"
              type="text"
              required
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground"
              placeholder="Your nonprofit's name"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground"
              placeholder="you@organization.org"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs uppercase tracking-wider text-muted font-medium mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-foreground"
              placeholder="At least 8 characters"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-negative bg-red-50 border border-negative/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm bg-foreground text-white rounded-lg px-4 py-2 hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-foreground underline hover:text-gray-800">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
