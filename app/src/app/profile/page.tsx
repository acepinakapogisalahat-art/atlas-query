// app/src/app/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type TripRow = Record<string, any>;

const SEX_OPTIONS = ['Male', 'Female', 'Other'];
const TRAVEL_PREFS = ['Culture & Food', 'Adventure', 'Relaxation', 'Nightlife'];
const BUDGETS = ['Budget', 'Mid-range', 'Luxury'];

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition';

function pill(active: boolean) {
  return `px-3.5 py-1.5 rounded-full text-sm border transition ${
    active
      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
  }`;
}

function fmt(d: any) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default function ProfilePage() {
  const supabase = createClient();
  const role = useRole();
  const [profile, setProfile] = useState<any>(null);
  const [name, setName] = useState('');
  const [sex, setSex] = useState('');
  const [location, setLocation] = useState('');
  const [prefs, setPrefs] = useState<any>(null);
  const [travelPref, setTravelPref] = useState('');
  const [budget, setBudget] = useState('');
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [tripItems, setTripItems] = useState<Record<string, string[]>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!role.loading && role.userId) load(role.userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.userId]);

  async function load(uid: string) {
    const { data: p } = await supabase.from('app_users').select('*').eq('user_id', uid).maybeSingle();
    setProfile(p);
    if (p) {
      setName(p.name ?? '');
      setSex(p.sex ?? '');
      setLocation(p.current_location ?? '');
    }
    const { data: pref } = await supabase.from('user_preferences').select('*').eq('user_id', uid).maybeSingle();
    setPrefs(pref);
    if (pref) {
      setTravelPref(pref.travel_preference ?? '');
      setBudget(pref.budget_range ?? '');
    }
    const { data: t } = await supabase
      .from('trips').select('*').eq('user_id', uid).order('start_date', { ascending: false });
    const rows = (t ?? []) as TripRow[];
    setTrips(rows);
    if (rows.length) {
      const ids = rows.map((r) => r.trip_id);
      const { data: items } = await supabase.from('trip_items').select('*').in('trip_id', ids);
      const listingIds = [...new Set((items ?? []).map((i: any) => i.listing_id).filter(Boolean))];
      const nameMap: Record<string, string> = {};
      if (listingIds.length) {
        const { data: ls } = await supabase.from('listings').select('listing_id, name').in('listing_id', listingIds);
        (ls ?? []).forEach((l: any) => { nameMap[l.listing_id] = l.name; });
      }
      const map: Record<string, string[]> = {};
      (items ?? []).forEach((i: any) => {
        (map[i.trip_id] ??= []).push(nameMap[i.listing_id] ?? i.listing_id);
      });
      setTripItems(map);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    const { error } = await supabase
      .from('app_users')
      .update({ name: name.trim(), sex: sex || null, current_location: location.trim() || null })
      .eq('user_id', role.userId);
    if (error) setErr(error.message);
    else setMsg('Profile updated.');
    setBusy(false);
  }

  async function savePrefs() {
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (!travelPref || !budget) throw new Error('Pick both a travel style and a budget range.');
      if (prefs) {
        const { error } = await supabase
          .from('user_preferences')
          .update({ travel_preference: travelPref, budget_range: budget })
          .eq('preference_id', prefs.preference_id);
        if (error) throw error;
      } else {
        const { data: existing } = await supabase.from('user_preferences').select('preference_id');
        const nums = (existing ?? [])
          .map((r: any) => parseInt(String(r.preference_id).replace(/\D/g, ''), 10))
          .filter((n: number) => !isNaN(n));
        const nextId = `PRF-${String((nums.length ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
        const { error } = await supabase.from('user_preferences').insert({
          preference_id: nextId,
          user_id: role.userId,
          travel_preference: travelPref,
          budget_range: budget,
        });
        if (error) throw error;
      }
      setMsg('Travel preferences saved — Process 2 complete.');
      await load(role.userId!);
    } catch (e2: any) {
      setErr(e2?.message ?? 'Could not save preferences.');
    }
    setBusy(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = trips.filter((t) => (t.end_date ? t.end_date >= today : true));
  const completed = trips.filter((t) => (t.end_date ? t.end_date < today : false));

  if (role.loading) return <main className="p-8 text-center">Loading your profile…</main>;
  if (!role.authId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Your profile</h1>
          <p className="text-slate-500 text-sm">
            <Link href="/login" className="text-blue-600 underline">Sign in</Link> to view and edit your profile.
          </p>
        </div>
      </main>
    );
  }

  function TripCard({ t }: { t: TripRow }) {
    const isUp = t.end_date ? t.end_date >= today : true;
    const items = tripItems[t.trip_id] ?? [];
    return (
      <div className="border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 truncate">{t.trip_name ?? t.name ?? `Trip ${t.trip_id}`}</p>
          <p className="text-xs text-slate-400 mt-0.5">{fmt(t.start_date)} → {fmt(t.end_date)}</p>
          {items.length > 0 && (
            <p className="text-xs text-slate-500 mt-1 truncate">
              {items.slice(0, 3).join(' · ')}{items.length > 3 ? ` +${items.length - 3} more` : ''}
            </p>
          )}
        </div>
        <span
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
            isUp ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isUp ? 'Upcoming' : 'Completed'}
        </span>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Your profile</h1>
            <p className="mt-1 text-sm text-slate-500">{profile?.email ?? '—'}</p>
          </div>
          <div className="flex gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">Traveler</span>
            {role.isOwner && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">Owner</span>}
            {role.isAdmin && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-white">Admin</span>}
          </div>
        </div>

        {msg && <p className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm mb-6">{msg}</p>}
        {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-6">{err}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: personal info + trips */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Personal information</h2>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Full name</label>
                    <span className="text-xs text-slate-400">{name.length}/50</span>
                  </div>
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} className={inputCls} required />
                </div>
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-1.5">Sex</span>
                  <div className="flex gap-2">
                    {SEX_OPTIONS.map((s) => (
                      <button key={s} type="button" onClick={() => setSex(s)} className={pill(sex === s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Current location</label>
                    <span className="text-xs text-slate-400">{location.length}/100</span>
                  </div>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} maxLength={100} placeholder="City, Country" className={inputCls} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                  <input value={profile?.email ?? ''} disabled className={`${inputCls} bg-slate-50 text-slate-400 cursor-not-allowed`} />
                  <p className="mt-1 text-xs text-slate-400">Email is your sign-in identity and can't be changed here.</p>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm disabled:opacity-60"
                >
                  Save changes
                </button>
              </form>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-base font-semibold text-slate-900">Your trips</h2>
                <span className="text-xs text-slate-400">{trips.length} total · {upcoming.length} upcoming</span>
              </div>
              {trips.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-500 mb-4">No trips yet — your adventures will appear here.</p>
                  <Link href="/search" className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">
                    Start planning
                  </Link>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Upcoming</h3>
                    <div className="space-y-3">
                      {upcoming.map((t) => <TripCard key={t.trip_id} t={t} />)}
                      {upcoming.length === 0 && <p className="text-sm text-slate-400">Nothing scheduled.</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Completed</h3>
                    <div className="space-y-3">
                      {completed.map((t) => <TripCard key={t.trip_id} t={t} />)}
                      {completed.length === 0 && <p className="text-sm text-slate-400">No past trips yet.</p>}
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right: preferences + account */}
          <div className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-base font-semibold text-slate-900">Travel preferences</h2>
              </div>
              <p className="text-xs text-slate-400 mb-4">Process 2 – powers your future recommendations.</p>
              <div className="space-y-4">
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-1.5">Travel style</span>
                  <div className="flex flex-wrap gap-2">
                    {TRAVEL_PREFS.map((p) => (
                      <button key={p} type="button" onClick={() => setTravelPref(p)} className={pill(travelPref === p)}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-medium text-slate-700 mb-1.5">Budget range</span>
                  <div className="flex flex-wrap gap-2">
                    {BUDGETS.map((b) => (
                      <button key={b} type="button" onClick={() => setBudget(b)} className={pill(budget === b)}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={savePrefs}
                  disabled={busy}
                  className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition disabled:opacity-60"
                >
                  Save preferences
                </button>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Account</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">User ID</dt>
                  <dd className="font-mono text-slate-700">{role.userId}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-400">Role</dt>
                  <dd className="text-slate-700">{role.isAdmin ? 'Administrator' : role.isOwner ? 'Business owner' : 'Traveler'}</dd>
                </div>
                {role.isOwner && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-400">Owner ID</dt>
                    <dd className="font-mono text-slate-700">{role.ownerId}</dd>
                  </div>
                )}
              </dl>
              <div className="mt-4 space-y-2">
                {role.isOwner && (
                  <Link href="/owner" className="block px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition">
                    Manage my listings
                  </Link>
                )}
                {role.isAdmin && (
                  <Link href="/admin" className="block px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition">
                    Admin manager
                  </Link>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}