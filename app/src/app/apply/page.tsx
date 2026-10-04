// app/src/app/apply/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRole } from '@/utils/supabase/role';
import { createClient } from '@/utils/supabase/client';

const inputCls =
  'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm';

export default function ApplyPage() {
  const role = useRole();
  const supabase = createClient();
  const [company, setCompany] = useState('');
  const [bizType, setBizType] = useState('Hotel');
  const [email, setEmail] = useState('');
  const [pitch, setPitch] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (!role.userId) throw new Error('No traveler profile found for this account.');
      const { data: id, error: idErr } = await supabase.rpc('new_application_id');
      if (idErr) throw idErr;
      const { error } = await supabase.from('business_applications').insert({
        application_id: id as string,
        user_id: role.userId,
        company_name: company.trim(),
        business_type: bizType,
        contact_email: email.trim(),
        pitch: pitch.trim() || null,
      });
      if (error) throw error;
      setMsg('Application submitted — status: pending review.');
      setCompany(''); setPitch('');
      await role.refresh();
    } catch (e2: any) {
      setErr(
        e2?.code === '23505'
          ? 'BR-025: You already have a pending application.'
          : e2?.message ?? 'Submission failed.'
      );
    } finally {
      setBusy(false);
    }
  }

  if (role.loading) return <main className="p-8 text-center">Checking your account…</main>;

  if (!role.authId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Become a TravelMate publisher</h1>
          <p className="text-gray-500">
            <Link href="/login" className="text-blue-600 underline">Sign in</Link> to apply as a business owner.
          </p>
        </div>
      </main>
    );
  }

  if (!role.userId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Traveler profile required</h1>
          <p className="text-sm text-gray-500">
            This account has no app_users profile (admin-only accounts cannot apply). Sign up as a normal user first.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List your place on TravelMate</h1>
        <p className="text-sm text-gray-500 mb-6">
          Process 5a – Business Owner Application. Approved owners can publish and manage their own listings (Process 5).
        </p>

        {msg && <p className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">{msg}</p>}
        {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{err}</p>}

        {role.isOwner ? (
          <div className="bg-white border border-green-200 rounded-xl p-6 text-center">
            <p className="text-4xl mb-2">🎉</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">You are an approved publisher</h2>
            <p className="text-sm text-gray-500 mb-4">Owner ID: {role.ownerId}. Manage your listings in your dashboard.</p>
            <Link href="/owner" className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700">
              Go to My Listings
            </Link>
          </div>
        ) : role.application?.status === 'pending' ? (
          <div className="bg-white border border-amber-200 rounded-xl p-6 text-center">
            <p className="text-4xl mb-2">⏳</p>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Application under review</h2>
            <p className="text-sm text-gray-500">
              {role.application.application_id} submitted on {role.application.submitted_at}. Our admin team will review it
              shortly (BR-025: one pending application at a time).
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            {role.application?.status === 'rejected' && (
              <p className="bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-4 py-3 text-sm mb-4">
                Your previous application was not approved. You may reapply with more details (BR-028).
              </p>
            )}
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Company / place name</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Harbor View Inn" className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Business type</label>
                <select value={bizType} onChange={(e) => setBizType(e.target.value)} className={inputCls}>
                  <option>Hotel</option>
                  <option>Restaurant</option>
                  <option>Attraction</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Contact email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Tell us about your place (optional)</label>
                <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={4} placeholder="What makes it special?" className={inputCls} />
              </div>
              <button type="submit" disabled={busy}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-60">
                {busy ? 'Submitting…' : 'Submit application'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}