// app/src/app/signup/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import AuthShell from '@/components/AuthShell';

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition';

const SEX_OPTIONS = ['Male', 'Female', 'Other'];

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [sex, setSex] = useState('');
  const [location, setLocation] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const locationRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Guarantee empty fields: wipe anything the browser injected on load
  useEffect(() => {
    const clear = () => {
      if (nameRef.current) nameRef.current.value = '';
      if (emailRef.current) emailRef.current.value = '';
      if (locationRef.current) locationRef.current.value = '';
      if (passwordRef.current) passwordRef.current.value = '';
      setName('');
      setEmail('');
      setLocation('');
      setPassword('');
      setSex('');
    };
    clear();
    const t = setTimeout(clear, 60);
    return () => clearTimeout(t);
  }, []);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    if (!sex) {
      setError('Please select a Sex option to complete your registration profile.');
      setBusy(false);
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setBusy(false);
      return;
    }
    const { data, error: err } = await supabase.auth.signUp({ email: email.trim(), password });
    if (err) {
      setError(
        err.message.includes('already registered')
          ? 'That email is already registered — try signing in instead.'
          : err.message
      );
      setBusy(false);
      return;
    }
    const authId = data.user?.id ?? null;
    if (!authId) {
      setError('Could not create the account. Please try again.');
      setBusy(false);
      return;
    }
    const userId = `USR-${Math.random().toString(16).slice(2, 10)}`;
    const { error: profileErr } = await supabase.from('app_users').insert({
      user_id: userId,
      name: name.trim(),
      password_hash: 'MANAGED_BY_SUPABASE_AUTH',
      email: email.trim(),
      sex,
      current_location: location.trim() || null,
      auth_user_id: authId,
    });
    if (profileErr) {
      setError(`Account created, but profile setup failed: ${profileErr.message}`);
      setBusy(false);
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join TravelMate and start planning your next story."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSignup} className="space-y-4" autoComplete="off">
        {/* Decoy fields absorb browser autofill heuristics (incl. "suggest strong password") */}
        <input type="text" name="decoy-user" autoComplete="username" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        <input type="password" name="decoy-pass" autoComplete="new-password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />

        {error && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">{error}</p>}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full name
          </label>
          <input
            ref={nameRef}
            id="name"
            required
            maxLength={40}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Juan Dela Cruz"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
            Email
          </label>
          <input
            ref={emailRef}
            id="email"
            type="email"
            required
            maxLength={35}
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <span className="block text-sm font-medium text-slate-700 mb-1.5">Sex</span>
          <div className="flex gap-2">
            {SEX_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSex(s)}
                className={`px-4 py-2 rounded-full text-sm border transition ${
                  sex === s
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
            Current location <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            ref={locationRef}
            id="location"
            maxLength={40}
            autoComplete="off"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Manila, Philippines"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
            Password
          </label>
          <input
            ref={passwordRef}
            id="password"
            type="password"
            required
            maxLength={20}
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className={inputCls}
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60"
        >
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  );
}