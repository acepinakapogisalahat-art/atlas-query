// app/src/app/login/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { createClient } from '@/utils/supabase/client';

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push('/');
  }

  async function handleForgot() {
    setError(null);
    setNotice(null);
    if (!email) {
      setError('Type your email first, then tap "Forgot password?".');
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError(error.message);
    else setNotice('Password reset email sent — check your inbox.');
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your journey">
      <form onSubmit={handleLogin} className="space-y-6">
        {error && <p className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</p>}
        {notice && <p className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm">{notice}</p>}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input id="email" required type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="name@example.com" />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input id="password" required type="password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md disabled:opacity-60">
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
        <div className="flex flex-col items-center space-y-4">
          <Link href="/signup"
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition text-center">
            Create Account
          </Link>
          <button type="button" onClick={handleForgot} className="text-sm text-gray-500 hover:text-blue-600">
            Forgot password?
          </button>
        </div>
      </form>
    </AuthShell>
  );
}