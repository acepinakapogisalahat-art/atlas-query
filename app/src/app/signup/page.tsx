// app/src/app/signup/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { createClient } from '@/utils/supabase/client';

const inputCls =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', sex: '', homeCity: '', password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [field]: e.target.value });

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Signup failed — no user returned.');

      // FIX: real table name is app_users (not USERS)
            // Live schema: user_id is varchar(20) (USR-style); the UUID lives in auth_user_id
      const userId = `USR-${data.user.id.slice(0, 8)}`;
      const { error: profileError } = await supabase.from('app_users').insert({
        user_id: userId,
        name: `${form.firstName} ${form.lastName}`.trim(),
        password_hash: 'MANAGED_BY_SUPABASE_AUTH',
        email: form.email,
        sex: form.sex || null,
        current_location: form.homeCity || null,
        auth_user_id: data.user.id,
      });
      if (profileError) throw profileError;

      router.push('/login');
    } catch (err) {
      // FIX: Supabase errors are plain objects — read .message directly
      const msg =
        (err as { message?: string })?.message ||
        (err instanceof Error ? err.message : 'Unexpected error during signup.');
      console.error('Signup failed:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Hi, Welcome to Travelmate!" subtitle="Start your journey now.">
      <form onSubmit={handleSignup} className="space-y-4">
        {error && <p className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">First Name</label>
            <input required value={form.firstName} onChange={set('firstName')} className={inputCls} placeholder="Juan" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input required value={form.lastName} onChange={set('lastName')} className={inputCls} placeholder="Dela Cruz" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input required type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="name@example.com" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Sex</label>
            <select value={form.sex} onChange={set('sex')} className={inputCls}>
              <option value="">Prefer not to say</option>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Home City</label>
            <input value={form.homeCity} onChange={set('homeCity')} className={inputCls} placeholder="Optional" />
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input required type="password" minLength={6} value={form.password} onChange={set('password')} className={inputCls} placeholder="••••••••" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md disabled:opacity-60">
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}