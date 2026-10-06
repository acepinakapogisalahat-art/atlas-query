// app/src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Footer from '@/components/Footer';
import SearchDropdown from '@/components/SearchDropdown';
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
  description: string | null;
  destination: { destination_name: string; region_country: string } | null;
};

type ForecastDay = { day: string; temp: number };

type TripData = {
  trip_id: string;
  trip_name: string | null;
  start_date: string | null;
  end_date: string | null;
  items: string[];
};

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
    const [trips, setTrips] = useState<TripData[]>([]);
  const [showTripModal, setShowTripModal] = useState(false);
  const [descMap, setDescMap] = useState<Record<string, string>>({});
  const [subtypeMap, setSubtypeMap] = useState<Record<string, { label: string; value: string }>>({});
    const [destExtra, setDestExtra] = useState<Record<string, { count: number; top: string[] }>>({});
  const [hover, setHover] = useState<
    | { kind: 'listing'; id: string; rect: { top: number; bottom: number; left: number; width: number } }
    | { kind: 'destination'; name: string; rect: { top: number; bottom: number; left: number; width: number } }
    | null
  >(null);
  const hoverTimer = useRef<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
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
          setUserId(profile.user_id);
          setFirstName(String(profile.name ?? '').split(' ')[0] || null);
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
      
        setTrips(await fetchTrips(uid));
      }

            const [
        { data: dests },
        { data: listings },
        { data: exploreRows },
        { data: attrs },
        { data: hotelRows },
        { data: restRows },
      ] = await Promise.all([
        supabase.from('destinations').select('destination_id, destination_name, region_country'),
        supabase.from('listings').select('destination_id, average_rating'),
        supabase
          .from('listings')
          .select('listing_id, name, listing_type, image_url, average_rating, description, destination:destination_id(destination_name, region_country)'),
        supabase.from('attractions').select('attraction_id, activity_name'),
        supabase.from('hotels').select('hotel_id, star_rating'),
        supabase.from('restaurants').select('restaurant_id, cuisine_type'),
      ]);
           setExplore((exploreRows as unknown as ExploreCard[]) ?? []);

      const dDesc: Record<string, string> = {};
      const dExtra: Record<string, { count: number; top: string[] }> = {};
      (exploreRows ?? []).forEach((r: any) => {
        dDesc[r.listing_id] = r.description ?? '';
        const dn = r.destination?.destination_name;
        if (dn) {
          const e = (dExtra[dn] ??= { count: 0, top: [] });
          e.count += 1;
          if (e.top.length < 3) e.top.push(r.name);
        }
      });
      setDescMap(dDesc);
      setDestExtra(dExtra);

      const sMap: Record<string, { label: string; value: string }> = {};
      (attrs ?? []).forEach((a: any) => {
        if (a.activity_name) sMap[a.attraction_id] = { label: 'Activity', value: a.activity_name };
      });
      (hotelRows ?? []).forEach((h: any) => {
        if (h.star_rating) sMap[h.hotel_id] = { label: 'Star rating', value: String(h.star_rating) };
      });
      (restRows ?? []).forEach((r: any) => {
        if (r.cuisine_type) sMap[r.restaurant_id] = { label: 'Cuisine', value: r.cuisine_type };
      });
      setSubtypeMap(sMap);

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

  function startHover(
    payload: { kind: 'listing'; id: string } | { kind: 'destination'; name: string },
    el: HTMLElement
  ) {
    clearTimeout(hoverTimer.current);
    const r = el.getBoundingClientRect();
    const rect = { top: r.top, bottom: r.bottom, left: r.left, width: r.width };
    hoverTimer.current = setTimeout(() => setHover({ ...payload, rect } as any), 350);
  }

  function cancelHover() {
    clearTimeout(hoverTimer.current);
    setHover(null);
  }

  function popoverStyle(rect: { top: number; bottom: number; left: number; width: number }) {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const center = rect.left + rect.width / 2;
    const left = Math.min(Math.max(center, 176), vw - 176);
    const above = rect.top > 280;
    return above
      ? { top: rect.top - 10, left, transform: 'translate(-50%, -100%)' }
      : { top: rect.bottom + 10, left, transform: 'translate(-50%, 0)' };
  }

     async function fetchTrips(uid: string): Promise<TripData[]> {
    const { data: t } = await supabase
      .from('trips').select('*').eq('user_id', uid)
      .order('start_date', { ascending: false });
    const rows = (t ?? []) as any[];
    if (!rows.length) return [];
    const ids = rows.map((r) => r.trip_id);
    const { data: items } = await supabase.from('trip_items').select('*').in('trip_id', ids);
    const listingIds = [...new Set((items ?? []).map((i: any) => i.listing_id).filter(Boolean))];
    const nameMap: Record<string, string> = {};
    if (listingIds.length) {
      const { data: ls } = await supabase.from('listings').select('listing_id, name').in('listing_id', listingIds);
      (ls ?? []).forEach((l: any) => { nameMap[l.listing_id] = l.name; });
    }
    const map: Record<string, string[]> = {};
    (items ?? []).forEach((i: any) => { (map[i.trip_id] ??= []).push(nameMap[i.listing_id] ?? i.listing_id); });
    return rows.map((r) => ({
      trip_id: r.trip_id,
      trip_name: r.trip_name ?? r.name ?? null,
      start_date: r.start_date ?? null,
      end_date: r.end_date ?? null,
      items: map[r.trip_id] ?? [],
    }));
  }

 

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

    const hoverListing =
    hover?.kind === 'listing' ? explore.find((l) => l.listing_id === hover.id) ?? null : null;
  const hoverDest =
    hover?.kind === 'destination' ? trending.find((t) => t.name === hover.name) ?? null : null;

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
            <SearchDropdown
              query={query}
              onQueryChange={setQuery}
              onSubmit={(q) => goSearch(undefined, q)}
              userId={userId}
            />
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
                onMouseEnter={(e) => startHover({ kind: 'listing', id: l.listing_id }, e.currentTarget)}
                onMouseLeave={cancelHover}
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold text-slate-900">Your trips</h2>
            <span className="text-xs text-slate-400">
              {trips.length === 0
                ? 'Start planning your next story'
                : `${trips.length} trip${trips.length === 1 ? '' : 's'} · ${trips.filter((t) => isUpcoming(t)).length} upcoming`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => (userId ? setShowTripModal(true) : router.push('/login'))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
          >
            <PlusIcon className="w-4 h-4" />
            New trip
          </button>
        </div>

        {trips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapIcon className="w-7 h-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No trips yet — your next story starts here</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Create a trip, then save places you love from search results. Everything stays organized in one place.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              {userId ? (
                <button
                  type="button"
                  onClick={() => setShowTripModal(true)}
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
                >
                  Create your first trip
                </button>
              ) : (
                <Link
                  href="/signup"
                  className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                >
                  Create a free account
                </Link>
              )}
              <Link
                href="/search"
                className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition"
              >
                Browse places
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trips.map((t) => (
              <TripCardView key={t.trip_id} t={t} />
            ))}
            <button
              type="button"
              onClick={() => setShowTripModal(true)}
              className="rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 hover:border-blue-400 hover:bg-blue-50/40 transition flex flex-col items-center justify-center gap-2 p-8 text-slate-400 hover:text-blue-600 min-h-[10rem]"
            >
              <PlusIcon className="w-6 h-6" />
              <span className="text-sm font-medium">Plan a new trip</span>
            </button>
          </div>
        )}
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
                className="group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition flex flex-col"
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
                <PlaceOverlay
                  type={r.listing?.listing_type ?? 'Place'}
                  description={descMap[r.listing?.listing_id ?? ''] || null}
                  fact={subtypeMap[r.listing?.listing_id ?? '']}
                  footer="Click for full details"
                />
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
            <button
              type="button"
              onClick={() => (userId ? setShowTripModal(true) : router.push('/login'))}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700 transition"
            >
              Plan a trip
              <Chevron className="w-4 h-4 text-slate-300" />
            </button>
           
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
              className="group relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition flex flex-col"
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
              <PlaceOverlay
                type="Destination"
                description={`${t.country} · ${t.rating.toFixed(1)} average rating · ${destExtra[t.name]?.count ?? 0} listing${(destExtra[t.name]?.count ?? 0) === 1 ? '' : 's'}`}
                fact={
                  destExtra[t.name]?.top?.length
                    ? { label: 'Popular here', value: destExtra[t.name].top.join(', ') }
                    : undefined
                }
                footer="Click to view listings"
              />
            </Link>
          ))}
        </div>
      </section>
        
              {hover && (hoverListing || hoverDest) && (
        <div className="fixed z-50 w-80 pointer-events-none" style={popoverStyle(hover.rect)}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex flex-col gap-2">
            {hoverListing && (
              <>
                <div className="flex items-center gap-3">
                  {hoverListing.image_url ? (
                    <img src={hoverListing.image_url} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">{hoverListing.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {hoverListing.destination?.destination_name}, {hoverListing.destination?.region_country}
                    </p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wider">
                    {hoverListing.listing_type}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="w-4 h-4" />
                  {hoverListing.average_rating != null ? Number(hoverListing.average_rating).toFixed(1) : 'Not rated yet'}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">
                  {descMap[hoverListing.listing_id] || 'No description yet — click to see reviews and photos.'}
                </p>
                {subtypeMap[hoverListing.listing_id] && (
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">
                      {subtypeMap[hoverListing.listing_id].label}:{' '}
                    </span>
                    {subtypeMap[hoverListing.listing_id].value}
                  </p>
                )}
                <p className="text-[11px] font-medium text-blue-600">Click to open full page →</p>
              </>
            )}
            {hoverDest && (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center shrink-0 text-blue-600">
                    <MapIcon className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 text-sm truncate">{hoverDest.name}</p>
                    <p className="text-xs text-slate-500 truncate">{hoverDest.country}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase tracking-wider">
                    Destination
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                  <Star className="w-4 h-4" />
                  {hoverDest.rating.toFixed(1)} average rating
                </div>
                <p className="text-xs text-slate-600">
                  {destExtra[hoverDest.name]?.count ?? 0} listing{(destExtra[hoverDest.name]?.count ?? 0) === 1 ? '' : 's'} on TravelMate
                </p>
                {destExtra[hoverDest.name]?.top?.length ? (
                  <p className="text-[11px] text-slate-500">
                    <span className="font-semibold uppercase tracking-wider text-slate-400">Popular here: </span>
                    {destExtra[hoverDest.name].top.join(', ')}
                  </p>
                ) : null}
                <p className="text-[11px] font-medium text-blue-600">Click to view listings →</p>
              </>
            )}
          </div>
        </div>
      )}

      {showTripModal && userId && (
        <NewTripModal
          userId={userId}
          onClose={() => setShowTripModal(false)}
          onCreated={async () => {
            setShowTripModal(false);
            if (userId) setTrips(await fetchTrips(userId));
          }}
        />
      )}
      
      <Footer />
    </main>
  );
}

function isUpcoming(t: { end_date: string | null }) {
  const today = new Date().toISOString().slice(0, 10);
  return t.end_date ? t.end_date >= today : true;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function MapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" strokeLinecap="round" />
    </svg>
  );
}

function TripCardView({ t }: { t: TripData }) {
  const up = isUpcoming(t);
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-900 truncate">{t.trip_name ?? `Trip ${t.trip_id}`}</p>
        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${up ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {up ? 'Upcoming' : 'Completed'}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{fmtDate(t.start_date)} → {fmtDate(t.end_date)}</p>
      <div className="mt-3 flex-1">
        {t.items.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {t.items.slice(0, 3).map((name, i) => (
              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs truncate max-w-[10rem]">{name}</span>
            ))}
            {t.items.length > 3 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">+{t.items.length - 3} more</span>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400">No places saved yet — add some from search.</p>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-slate-400">{t.items.length} place{t.items.length === 1 ? '' : 's'}</span>
        <Link href="/search" className="text-xs font-medium text-blue-600 hover:text-blue-700">Add places</Link>
      </div>
    </div>
  );
}

function NewTripModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    setBusy(true);
    try {
      if (!name.trim()) throw new Error('Give your trip a name.');
      if (start && end && end < start) throw new Error('End date must be after the start date.');
      const { data: tripId, error: idErr } = await supabase.rpc('new_trip_id');
      if (idErr) throw idErr;
      const { error } = await supabase.from('trips').insert({
        trip_id: tripId as string,
        user_id: userId,
        trip_name: name.trim(),
        start_date: start || null,
        end_date: end || null,
      });
      if (error) throw error;
      onCreated();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not create the trip.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Plan a new trip</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 transition">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">{err}</p>}
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-700">Trip name</label>
              <span className="text-xs text-slate-400">{name.length}/100</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g., Japan Spring Adventure"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start date</label>
              <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">End date</label>
              <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" />
            </div>
          </div>
          <p className="text-xs text-slate-400">Dates are optional — trips appear here and on your profile.</p>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 transition">
            Cancel
          </button>
          <button type="button" onClick={create} disabled={busy}
            className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60">
            {busy ? 'Creating…' : 'Create trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlaceOverlay({
  type,
  description,
  fact,
  footer,
}: {
  type: string;
  description: string | null;
  fact?: { label: string; value: string };
  footer: string;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-2 bg-slate-900/90 backdrop-blur-sm p-4 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
      <span className="self-start px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold uppercase tracking-wider">
        {type}
      </span>
      {description ? (
        <p className="text-xs leading-relaxed text-slate-100 line-clamp-4">{description}</p>
      ) : (
        <p className="text-xs text-slate-300">No description yet — click to see reviews and photos.</p>
      )}
      {fact && (
        <p className="text-[11px] text-slate-200">
          <span className="font-semibold uppercase tracking-wider text-slate-400">{fact.label}: </span>
          {fact.value}
        </p>
      )}
      <span className="mt-auto text-[11px] font-medium text-blue-300">{footer} →</span>
    </div>
  );
}