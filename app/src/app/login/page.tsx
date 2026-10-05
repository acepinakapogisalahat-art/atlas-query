// app/src/app/login/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AuthShell from '@/components/AuthShell';

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Guarantee empty fields: wipe anything the browser injected on load
  useEffect(() => {
    const clear = () => {
      if (emailRef.current) emailRef.current.value = '';
      if (passwordRef.current) passwordRef.current.value = '';
      setEmail('');
      setPassword('');
    };
    clear();
    const t = setTimeout(clear, 60);
    return () => clearTimeout(t);
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'Email or password is incorrect.' : err.message);
      setBusy(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  async function handleForgot() {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError('Enter your email first, then tap "Forgot password?".');
      return;
    }
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (err) setError(err.message);
    else setNotice('Password reset email sent — check your inbox.');
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your journey."
      footer={
        <>
          New to TravelMate?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
        <input type="text" name="decoy-user" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        <input type="password" name="decoy-pass" autoComplete="current-password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        {error && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">{error}</p>}
        {notice && (
          <p className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm">{notice}</p>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            required
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <button type="button" onClick={handleForgot} className="text-xs font-medium text-blue-600 hover:text-blue-700">
              Forgot password?
            </button>
          </div>
          <input
            ref={passwordRef}
            id="password"
            type="password"
            required
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  );
}