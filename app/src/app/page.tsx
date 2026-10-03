// app/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Footer from '@/components/Footer';

type Rec = {
  recommendation_score: number;
  recommendation_reason: string | null;
  listing: {
    name: string;
    listing_type: string;
    destination: { destination_name: string; region_country: string } | null;
  } | null;
};

const REC_SELECT =
  'recommendation_score, recommendation_reason, listing:listing_id(name, listing_type, destination:destination_id(destination_name, region_country))';

const ACTIVITIES = ['Culture & Food', 'Adventure', 'Relaxation', 'Nightlife'];
const BUDGETS = ['Budget', 'Mid-range', 'Luxury'];
const OUTLOOK = [
  { day: 'Mon', temp: 24 },
  { day: 'Tue', temp: 24 },
  { day: 'Wed', temp: 25 },
  { day: 'Thu', temp: 23 },
  { day: 'Fri', temp: 24 },
];

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [trending, setTrending] = useState<{ name: string; country: string; rating: number }[]>([]);
  const [query, setQuery] = useState('');
  const [activity, setActivity] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      // Personalization: who is logged in?
      const { data: session } = await supabase.auth.getSession();
      const authId = session.session?.user?.id ?? null;
      let uid: string | null = null;
      if (authId) {
        const { data: profile } = await supabase
          .from('app_users')
          .select('user_id, name')
          .eq('auth_user_id', authId)
          .maybeSingle();
        if (profile) {
          uid = profile.user_id;
          setFirstName(String(profile.name ?? '').split(' ')[0] || null);
        }
      }

      // Recommendation engine: personalized first, global fallback
      let rq = supabase.from('recommendations').select(REC_SELECT);
      if (uid) rq = rq.eq('user_id', uid);
      const { data: recData } = await rq.order('recommendation_score', { ascending: false }).limit(4);
      let rows = (recData as Rec[]) ?? [];
      if (rows.length === 0) {
        const { data: globalRecs } = await supabase
          .from('recommendations')
          .select(REC_SELECT)
          .order('recommendation_score', { ascending: false })
          .limit(4);
        rows = (globalRecs as Rec[]) ?? [];
      }
      setRecs(rows);

      // Trending destinations: average listing rating per destination
      const [{ data: dests }, { data: listings }] = await Promise.all([
        supabase.from('destinations').select('destination_id, destination_name, region_country'),
        supabase.from('listings').select('destination_id, average_rating'),
      ]);
      const dMap = new Map<string, { destination_name: string; region_country: string }>();
      (dests ?? []).forEach((d: any) => dMap.set(d.destination_id, d));
      const agg = new Map<string, { sum: number; count: number }>();
      (listings ?? []).forEach((l: any) => {
        if (l.average_rating == null) return;
        const a = agg.get(l.destination_id) ?? { sum: 0, count: 0 };
        a.sum += Number(l.average_rating);
        a.count += 1;
        agg.set(l.destination_id, a);
      });
      const trend = [...agg.entries()]
        .map(([id, a]) => {
          const d = dMap.get(id);
          if (!d) return null;
          const m = String(d.region_country ?? '').match(/\(([^)]+)\)/);
          return {
            name: d.destination_name,
            country: m ? m[1] : d.region_country,
            rating: Math.round((a.sum / a.count) * 10) / 10,
          };
        })
        .filter(Boolean)
        .sort((x: any, y: any) => y.rating - x.rating)
        .slice(0, 4) as { name: string; country: string; rating: number }[];
      setTrending(trend);
    }
    load();
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  function goSearch(e?: React.FormEvent) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (activity) params.set('activity', activity);
    if (budget) params.set('budget', budget);
    router.push(`/search?${params.toString()}`);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Hero + search */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-xs font-bold tracking-[0.2em] text-blue-600 uppercase mb-3">
            Algorithmic · Travel Advisor
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-1 text-gray-500">
            {firstName
              ? 'Your personalized travel dashboard'
              : 'Sign in for personalized picks — or start exploring below.'}
          </p>

          <form onSubmit={goSearch} className="mt-6 flex flex-col md:flex-row gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Where to? Try "Kyoto" or "Palawan"'
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">Activity</span>
            {ACTIVITIES.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setActivity(activity === a ? null : a)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  activity === a
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {a}
              </button>
            ))}
            <span className="text-xs font-semibold text-gray-400 uppercase ml-4">Budget</span>
            {BUDGETS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBudget(budget === b ? null : b)}
                className={`px-3 py-1.5 rounded-full text-sm border transition ${
                  budget === b
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1 w-full">
        {/* Now Boarding + Trending */}
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Now Boarding</h2>
            <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-1">
              RECOMMENDATION ENGINE · LIVE
            </span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Region</th>
                  <th className="px-4 py-3">Match</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recs.map((r, i) => {
                  const dest = r.listing?.destination;
                  const pct = Math.round(Number(r.recommendation_score) * 100);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{r.listing?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{dest?.region_country ?? '—'}</td>
                      <td className="px-4 py-3 font-semibold text-blue-600">{pct}%</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            pct >= 90 ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {pct >= 90 ? 'Ready' : 'Plan now'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {recs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      No recommendations yet — run a search!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="text-lg font-bold text-gray-900 mt-8 mb-1">Trending · updated hourly</h2>
          <p className="text-sm text-gray-500 mb-3">Where travelers like you are headed</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {trending.map((t) => (
              <div key={t.name} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                <p className="font-bold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500 uppercase tracking-wide">{t.country}</p>
                <p className="mt-2 text-sm font-semibold text-yellow-600">★ {t.rating.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5-day outlook */}
        <aside>
          <h2 className="text-lg font-bold text-gray-900 mb-3">5-day outlook</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            {OUTLOOK.map((o) => (
              <div key={o.day} className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{o.day}</span>
                <span className="text-gray-500">{o.temp}°C</span>
              </div>
            ))}
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              Live weather telemetry is Business Challenge #3 — placeholder feed for now.
            </p>
          </div>
        </aside>
      </div>

      <Footer />
    </main>
  );
}