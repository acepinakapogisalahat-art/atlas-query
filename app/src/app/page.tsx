// app/src/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Footer from '@/components/Footer';

type Rec = {
  recommendation_score: number;
  recommendation_reason: string | null;
  listing: {
    listing_id: string;
    name: string;
    listing_type: string;
    destination: { destination_name: string; region_country: string } | null;
  } | null;
};

type ExploreCard = {
  listing_id: string;
  name: string;
  listing_type: string;
  image_url: string | null;
  average_rating: number | null;
  destination: { destination_name: string; region_country: string } | null;
};

type ForecastDay = { day: string; temp: number };

const REC_SELECT =
  'recommendation_score, recommendation_reason, listing:listing_id(listing_id, name, listing_type, destination:destination_id(destination_name, region_country))';

const ACTIVITIES = ['Culture & Food', 'Adventure', 'Relaxation', 'Nightlife'];
const BUDGETS = ['Budget', 'Mid-range', 'Luxury'];
const EXPLORE_TABS = ['All', 'Attraction', 'Hotel', 'Restaurant'] as const;

const FALLBACK_OUTLOOK: ForecastDay[] = [
  { day: 'Mon', temp: 24 },
  { day: 'Tue', temp: 24 },
  { day: 'Wed', temp: 25 },
  { day: 'Thu', temp: 23 },
  { day: 'Fri', temp: 24 },
];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-5 h-5'}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? 'w-4 h-4'}>
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06l3.79-3.71-3.79-3.71a.75.75 0 111.04-1.08l4.32 4.24a.75.75 0 010 1.08l-4.32 4.24a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SectionHeader({ title, helper }: { title: string; helper: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      <span className="text-xs text-slate-400">{helper}</span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [hasPersonal, setHasPersonal] = useState(false);
  const [explore, setExplore] = useState<ExploreCard[]>([]);
  const [exploreType, setExploreType] = useState<(typeof EXPLORE_TABS)[number]>('All');
  const [trending, setTrending] = useState<{ name: string; country: string; rating: number }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>(FALLBACK_OUTLOOK);
  const [forecastLocation, setForecastLocation] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [activity, setActivity] = useState<string | null>(null);
  const [budget, setBudget] = useState<string | null>(null);

  // Live 5-day forecast via Open-Meteo (no API key, CORS-friendly)
  async function loadForecast(loc: string | null) {
    if (!loc) {
      setForecast(FALLBACK_OUTLOOK);
      setForecastLocation(null);
      return;
    }
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(loc)}&count=1&language=en&format=json`
      );
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        setForecast(FALLBACK_OUTLOOK);
        setForecastLocation(null);
        return;
      }
      const { latitude, longitude } = geoData.results[0];
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max&timezone=auto`
      );
      const weatherData = await weatherRes.json();
      if (!weatherData.daily || !weatherData.daily.time || !weatherData.daily.temperature_2m_max) {
        setForecast(FALLBACK_OUTLOOK);
        setForecastLocation(null);
        return;
      }
      const days: ForecastDay[] = weatherData.daily.time.slice(0, 5).map((dateStr: string, i: number) => {
        const date = new Date(dateStr);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const temp = Math.round(weatherData.daily.temperature_2m_max[i]);
        return { day: dayName, temp };
      });
      setForecast(days);
      setForecastLocation(geoData.results[0].name);
    } catch {
      setForecast(FALLBACK_OUTLOOK);
      setForecastLocation(null);
    }
  }

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getSession();
      const authId = session.session?.user?.id ?? null;
      let uid: string | null = null;
      if (authId) {
        const { data: profile } = await supabase
          .from('app_users')
          .select('user_id, name, current_location')
          .eq('auth_user_id', authId)
          .maybeSingle();
        if (profile) {
          uid = profile.user_id;
          setFirstName(String(profile.name ?? '').split(' ')[0] || null);
          loadForecast(profile.current_location ?? null);
        }
      }

      let rq = supabase.from('recommendations').select(REC_SELECT);
      if (uid) rq = rq.eq('user_id', uid);
      const { data: recData } = await rq.order('recommendation_score', { ascending: false }).limit(4);
      let rows = (recData as unknown as Rec[]) ?? [];
      if (uid) setHasPersonal(rows.length > 0);
      if (rows.length === 0) {
        const { data: globalRecs } = await supabase
          .from('recommendations')
          .select(REC_SELECT)
          .order('recommendation_score', { ascending: false })
          .limit(4);
        rows = (globalRecs as unknown as Rec[]) ?? [];
      }
      setRecs(rows);

      if (uid) {
        const { data: logs } = await supabase
          .from('search_logs')
          .select('keywords')
          .eq('user_id', uid)
          .order('log_id', { ascending: false })
          .limit(10);
        const seen: string[] = [];
        (logs ?? []).forEach((l: any) => {
          const q = String(l.keywords ?? '').trim();
          if (q && !seen.includes(q)) seen.push(q);
        });
        setRecent(seen.slice(0, 5));
      }

      const [{ data: dests }, { data: listings }, { data: exploreRows }] = await Promise.all([
        supabase.from('destinations').select('destination_id, destination_name, region_country'),
        supabase.from('listings').select('destination_id, average_rating'),
        supabase
          .from('listings')
          .select('listing_id, name, listing_type, image_url, average_rating, destination:destination_id(destination_name, region_country)'),
      ]);
      setExplore((exploreRows as unknown as ExploreCard[]) ?? []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  function goSearch(e?: React.FormEvent, q?: string) {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    const finalQuery = (q ?? query).trim();
    if (finalQuery) params.set('q', finalQuery);
    if (activity) params.set('activity', activity);
    if (budget) params.set('budget', budget);
    router.push(`/search?${params.toString()}`);
  }

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

  const exploreList = explore
    .filter((l) => exploreType === 'All' || l.listing_type === exploreType)
    .sort((a, b) => (b.average_rating ?? -1) - (a.average_rating ?? -1));

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-50/60 via-white to-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900">
            {greeting}
            {firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="mt-3 text-slate-500 max-w-xl">
            {firstName
              ? 'Where will your next story begin? Search below, or jump straight into your picks.'
              : 'Explore hand-rated places around the world — or create a free account for personal picks.'}
          </p>

          <form onSubmit={goSearch} className="mt-8 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                maxLength={100}
                placeholder='Where to? Try "Kyoto" or "Palawan"'
                className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
            >
              Search
            </button>
          </form>

          <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-x-5 gap-y-3">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Activity</span>
            <div className="flex flex-wrap gap-2">
              {ACTIVITIES.map((a) => (
                <button key={a} type="button" onClick={() => setActivity(activity === a ? null : a)} className={chip(activity === a)}>
                  {a}
                </button>
              ))}
            </div>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Budget</span>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => (
                <button key={b} type="button" onClick={() => setBudget(budget === b ? null : b)} className={chip(budget === b)}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {recent.length > 0 && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Recent</span>
              {recent.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => goSearch(undefined, q)}
                  className="px-3 py-1 rounded-full text-xs border border-slate-200 bg-white text-slate-500 hover:border-slate-400 hover:text-slate-800 transition"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Explore rail — full width */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold text-slate-900">Explore places</h2>
            <span className="text-xs text-slate-400">{exploreList.length} live listings · scroll sideways</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPLORE_TABS.map((t) => (
              <button key={t} type="button" onClick={() => setExploreType(t)} className={chip(exploreType === t)}>
                {t === 'All' ? 'All places' : `${t}s`}
              </button>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {exploreList.map((l) => (
              <Link
                key={l.listing_id}
                href={`/listing/${l.listing_id}`}
                className="w-64 shrink-0 snap-start bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition group"
              >
                <div className="relative h-40">
                  {l.image_url ? (
                    <img src={l.image_url} alt="" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{l.listing_type}</span>
                    </div>
                  )}
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/90 text-slate-700">
                    {l.listing_type}
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition">{l.name}</p>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{l.destination?.region_country ?? '—'}</p>
                  <div className="mt-2">
                    {l.average_rating != null ? (
                      <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                        <Star className="w-4 h-4" />
                        {Number(l.average_rating).toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-400">New · not rated yet</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {exploreList.length === 0 && <p className="text-sm text-slate-500 py-8">No listings of this type yet.</p>}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 bottom-4 w-16 bg-gradient-to-l from-slate-50 to-transparent" />
        </div>
      </section>

      {/* Recommendations — 2x2 card grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 w-full">
        <SectionHeader
          title={hasPersonal ? 'Top picks for you' : 'Community favorites'}
          helper={hasPersonal ? 'From your recommendation profile' : 'Most-recommended places across TravelMate'}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recs.map((r, i) => {
            const dest = r.listing?.destination;
            const pct = Math.round(Number(r.recommendation_score) * 100);
            return (
              <Link
                key={r.listing?.listing_id ?? i}
                href={`/listing/${r.listing?.listing_id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition flex flex-col"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate group-hover:text-blue-700 transition">
                      {r.listing?.name ?? '—'}
                    </p>
                    <p className="text-sm text-slate-500 truncate mt-0.5">{dest?.region_country ?? '—'}</p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      pct >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {pct >= 90 ? 'Excellent match' : 'Good match'}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-sm font-semibold text-blue-700">{pct}%</span>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 truncate">{r.recommendation_reason ?? 'Community favorite'}</span>
                  <span className="flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-blue-600 transition whitespace-nowrap">
                    View place
                    <Chevron className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
          {recs.length === 0 && (
            <p className="md:col-span-2 bg-white border border-slate-200 rounded-2xl px-5 py-10 text-center text-sm text-slate-500 shadow-sm">
              No recommendations yet — run a search to build your profile.
            </p>
          )}
        </div>
      </section>

      {/* Forecast + Quick actions — balanced two-up */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <SectionHeader
            title="5-day forecast"
            helper={forecastLocation ? `Live · ${forecastLocation}` : 'Sample data'}
          />
          <div className="grid grid-cols-5 gap-2 text-center">
            {forecast.map((o, i) => (
              <div key={`${o.day}-${i}`} className="rounded-xl bg-slate-50 py-3">
                <p className="text-xs font-medium text-slate-400">{o.day}</p>
                <p className="mt-1 text-sm font-semibold text-slate-800">{o.temp}°</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            {forecastLocation
              ? 'Live telemetry via Open-Meteo (Mission 1, Challenge 3).'
              : 'Set your current location in Profile for live weather.'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Quick actions</h2>
          <div className="space-y-2 flex-1 flex flex-col justify-between gap-2">
            <Link
              href="/search"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 transition"
            >
              Search destinations
              <Chevron className="w-4 h-4 text-slate-300" />
            </Link>
            <Link
              href="/owner"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 transition"
            >
              Manage my listings
              <Chevron className="w-4 h-4 text-slate-300" />
            </Link>
            <Link
              href="/apply"
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 transition"
            >
              List your place
              <Chevron className="w-4 h-4 text-slate-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending — full width */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-14 w-full">
        <SectionHeader title="Trending destinations" helper="Highest-rated across our listings" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trending.map((t, i) => (
            <Link
              key={t.name}
              href={`/search?q=${encodeURIComponent(t.name)}`}
              className="group bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition flex flex-col"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">#{i + 1}</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="w-4 h-4" />
                  {t.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-3 font-semibold text-slate-900 leading-snug group-hover:text-blue-700 transition">{t.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{t.country}</p>
              <span className="mt-4 flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-blue-600 transition">
                View listings
                <Chevron className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}