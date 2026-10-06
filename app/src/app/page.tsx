// app/src/app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Footer from '@/components/Footer';
import SmartSearch from '@/components/SmartSearch';
import { useRole } from '@/utils/supabase/role';

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
  destination: { destination_id: string; destination_name: string; region_country: string } | null;
};

type ForecastDay = { day: string; temp: number };

type TripItem = {
  key: string;
  listing_id: string;
  name: string;
  destination_id: string | null;
  destination_name: string | null;
  region_country: string | null;
  listing_type: string | null;
  rating: number | null;
  planned_date: string | null;
  start_time: string | null;
  sequence_no: number | null;
  raw: any;
};

type TripData = {
  trip_id: string;
  trip_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  stops: { label: string; days: number }[];
  items: TripItem[];
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

const byRating = (a: ExploreCard, b: ExploreCard) => (b.average_rating ?? -1) - (a.average_rating ?? -1);

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

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-3.5 h-3.5'}>
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-3.5 h-3.5'}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SectionHeader({ title, helper }: { title: string; helper: string }) {
  return (
    <div className="flex items-baseline justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <span className="text-sm text-slate-500">{helper}</span>
      </div>
    </div>
  );
}

function getTripStatus(t: { start_date: string | null; end_date: string | null; status: string | null }): string {
  if (t.status && ['upcoming', 'ongoing', 'finished'].includes(t.status)) return t.status;
  const today = new Date().toISOString().slice(0, 10);
  if (!t.start_date || !t.end_date) return 'upcoming';
  if (t.end_date < today) return 'finished';
  if (t.start_date <= today && t.end_date >= today) return 'ongoing';
  return 'upcoming';
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function extractStopLabel(regionCountry: string | null): string | null {
  if (!regionCountry) return null;
  let cleaned = regionCountry.replace(/[()]/g, '').trim();
  cleaned = cleaned
    .replace(/\s+(Philippines|PH|Pilipinas|Japan|JP|Australia|AU|USA|US|Canada|CA|United Kingdom|UK|Thailand|South Korea|Korea|Vietnam|Indonesia|Malaysia|Singapore|China|India|France|Italy|Spain|Germany|Switzerland|New Zealand|NZ)$/i, '')
    .trim();
  const parts = cleaned.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length >= 2) return parts[parts.length - 2] || parts[0];
  return parts[0];
}

export default function HomePage() {
  const router = useRouter();
  const supabase = createClient();
  const role = useRole();
  const [routing, setRouting] = useState<boolean | null>(null);

  // Owners, admins, and pending applicants get the Business Hub — never the traveler dashboard
  useEffect(() => {
    async function route() {
      if (role.loading) return;
      if (!role.authId) {
        setRouting(false);
        return;
      }
      if (role.isOwner || role.isAdmin) {
        router.replace('/business');
        return;
      }
      if (role.userId) {
        const { data, error } = await supabase
          .from('business_applications')
          .select('status')
          .eq('user_id', role.userId)
          .limit(1);
        const st = !error ? (data?.[0]?.status ?? null) : null;
        if (st === 'pending') {
          router.replace('/business');
          return;
        }
      }
      setRouting(false);
    }
    route();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.authId, role.isOwner, role.isAdmin, role.userId]);
  
  const [firstName, setFirstName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [hasPersonal, setHasPersonal] = useState(false);
  const [explore, setExplore] = useState<ExploreCard[]>([]);
  const [exploreType, setExploreType] = useState<(typeof EXPLORE_TABS)[number]>('All');
  const [trending, setTrending] = useState<{ name: string; country: string; rating: number }[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [forecast, setForecast] = useState<ForecastDay[]>(FALLBACK_OUTLOOK);
  const [forecastLocation, setForecastLocation] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const [trips, setTrips] = useState<TripData[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showTripModal, setShowTripModal] = useState(false);
  const [showEditTripModal, setShowEditTripModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [plannerQuery, setPlannerQuery] = useState('');
  const [plannerErr, setPlannerErr] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [startName, setStartName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startBusy, setStartBusy] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [destPickerOpen, setDestPickerOpen] = useState(false);
  const [destSearch, setDestSearch] = useState('');
  const [allDests, setAllDests] = useState<{ destination_name: string; region_country: string }[]>([]);
  const [schedMap, setSchedMap] = useState<Record<string, { open: string; close: string }>>({});
  const [setupCollapsed, setSetupCollapsed] = useState(false);

  const [descMap, setDescMap] = useState<Record<string, string>>({});
  const [subtypeMap, setSubtypeMap] = useState<Record<string, { label: string; value: string }>>({});
  const [destExtra, setDestExtra] = useState<Record<string, { count: number; top: string[] }>>({});
  const [hover, setHover] = useState<
    | { kind: 'listing'; id: string; rect: { top: number; bottom: number; left: number; width: number } }
    | { kind: 'destination'; name: string; rect: { top: number; bottom: number; left: number; width: number } }
    | null
  >(null);
  const hoverTimer = useRef<any>(null);
  const searchParams = useSearchParams();

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

  async function fetchTrips(uid: string): Promise<TripData[]> {
    const { data: t } = await supabase
      .from('trips').select('*').eq('user_id', uid)
      .order('start_date', { ascending: false });
    const rows = (t ?? []) as any[];
    if (!rows.length) return [];
    const ids = rows.map((r) => r.trip_id);
    const { data: items } = await supabase.from('trip_items').select('*').in('trip_id', ids);
    const listingIds = [...new Set((items ?? []).map((i: any) => i.listing_id).filter(Boolean))];
    const lMap: Record<string, { name: string; destination_id: string | null; destination_name: string | null; region_country: string | null; listing_type: string | null; average_rating: number | null }> = {};
    if (listingIds.length) {
      const { data: ls } = await supabase
        .from('listings')
        .select('listing_id, name, listing_type, average_rating, destination:destination_id(destination_id, destination_name, region_country)')
        .in('listing_id', listingIds);
      (ls ?? []).forEach((l: any) => {
        lMap[l.listing_id] = {
          name: l.name,
          destination_id: l.destination?.destination_id ?? null,
          destination_name: l.destination?.destination_name ?? null,
          region_country: l.destination?.region_country ?? null,
          listing_type: l.listing_type ?? null,
          average_rating: l.average_rating != null ? Number(l.average_rating) : null,
        };
      });
    }
    const map: Record<string, TripItem[]> = {};
    (items ?? []).forEach((i: any) => {
      (map[i.trip_id] ??= []).push({
        key: i.trip_item_id ?? i.item_id ?? i.id ?? `${i.trip_id}|${i.listing_id}`,
        listing_id: i.listing_id,
        destination_id: lMap[i.listing_id]?.destination_id ?? null,
        name: lMap[i.listing_id]?.name ?? i.listing_id,
        destination_name: lMap[i.listing_id]?.destination_name ?? null,
        region_country: lMap[i.listing_id]?.region_country ?? null,
        listing_type: lMap[i.listing_id]?.listing_type ?? null,
        rating: lMap[i.listing_id]?.average_rating ?? null,
        planned_date: i.planned_date ?? null,
        start_time: i.start_time ?? null,
        sequence_no: i.sequence_no ?? null,
        raw: i,
      });
    });
    return rows.map((r) => ({
      trip_id: r.trip_id,
      trip_name: r.trip_name ?? r.name ?? null,
      start_date: r.start_date ?? null,
      end_date: r.end_date ?? null,
      status: r.status ?? null,
      stops: Array.isArray(r.stops) ? (r.stops as { label: string; days: number }[]) : [],
      items: map[r.trip_id] ?? [],
    }));
  }

  async function refreshTrips() {
    if (userId) setTrips(await fetchTrips(userId));
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
        setTrips(await fetchTrips(uid));
      }

      const [
        { data: dests },
        { data: listings },
        { data: exploreRows },
        { data: attrs },
        { data: hotelRows },
        { data: restRows },
        { data: schedRows },
      ] = await Promise.all([
        supabase.from('destinations').select('destination_id, destination_name, region_country'),
        supabase.from('listings').select('destination_id, average_rating'),
        supabase
          .from('listings')
          .select('listing_id, name, listing_type, image_url, average_rating, description, destination:destination_id(destination_id, destination_name, region_country)'),
        supabase.from('attractions').select('attraction_id, activity_name, schedule_id'),
        supabase.from('hotels').select('hotel_id, star_rating'),
        supabase.from('restaurants').select('restaurant_id, cuisine_type'),
        supabase.from('schedules').select('schedule_id, open_time, close_time'),
      ]);
      setExplore((exploreRows as unknown as ExploreCard[]) ?? []);
      setAllDests((dests ?? []) as { destination_name: string; region_country: string }[]);

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

      const schRows: Record<string, { open: string; close: string }> = {};
      const schList = (schedRows ?? []) as any[];
      const schById = new Map(schList.map((s: any) => [s.schedule_id, s]));
      (attrs ?? []).forEach((a: any) => {
        const s = a.schedule_id ? schById.get(a.schedule_id) : null;
        if (s) schRows[a.attraction_id] = { open: String(s.open_time ?? '00:00:00').slice(0, 5), close: String(s.close_time ?? '23:59:00').slice(0, 5) };
      });
      setSchedMap(schRows);

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

  function goSearch(q?: string) {
    const params = new URLSearchParams();
    const finalQuery = (q ?? query).trim();
    if (finalQuery) params.set('q', finalQuery);
    router.push(`/search?${params.toString()}`);
  }

  async function createTrip(name: string, start: string, end: string): Promise<string> {
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
    return tripId as string;
  }

  async function handleStartCreate(e: React.FormEvent) {
    e.preventDefault();
    setPlannerErr(null);
    setStartBusy(true);
    try {
      const id = await createTrip(startName, startDate, endDate);
      await refreshTrips();
      setSelectedTripId(id);
      setStartName(''); setStartDate(''); setEndDate('');
    } catch (err: any) {
      setPlannerErr(err?.message ?? 'Could not create the trip.');
    }
    setStartBusy(false);
  }

  async function updateTripStatus(status: string) {
    const trip = selectedTrip;
    if (!trip) return;
    const { error } = await supabase.from('trips').update({ status }).eq('trip_id', trip.trip_id);
    if (error) setPlannerErr(error.message);
    else await refreshTrips();
  }

  async function deleteTrip(tripId: string) {
    const { error: itemsErr } = await supabase.from('trip_items').delete().eq('trip_id', tripId);
    if (itemsErr) {
      setPlannerErr(itemsErr.message);
      return;
    }
    const { error } = await supabase.from('trips').delete().eq('trip_id', tripId);
    if (error) setPlannerErr(error.message);
    else {
      await refreshTrips();
      setShowDeleteConfirm(null);
      if (selectedTripId === tripId) setSelectedTripId(null);
    }
  }

  async function addItem(listingId: string) {
    const trip = selectedTrip;
    if (!trip) return;
    setPlannerErr(null);
    setAddingId(listingId);
    try {
      if (trip.items.length >= capacity) {
        throw new Error(
          tripDays
            ? `Trip full: ${tripDays} day${tripDays === 1 ? '' : 's'} fit ${capacity} places (3 per day). Extend the dates or remove a place.`
            : 'Starter limit reached (6 places). Set trip dates to unlock more slots.'
        );
      }

      // Auto-create stop if no stops exist
      if (trip.stops.length === 0) {
        const listing = addList.find((l) => l.listing_id === listingId);
        if (listing) {
          const stopLabel = extractStopLabel(listing.destination?.region_country ?? null);
          if (stopLabel) {
            await saveStops([{ label: stopLabel, days: tripDays ?? 1 }]);
          }
        }
      }

      const { error } = await supabase.from('trip_items').insert({
        trip_item_id: `ITI-${Date.now().toString().slice(-8)}`,
        trip_id: trip.trip_id,
        listing_id: listingId,
        sequence_no: (trip.items.length ?? 0) + 1,
        planned_date: null,
        start_time: null,
        notes: null,
      });
      if (error) throw error;
      await refreshTrips();
    } catch (err: any) {
      setPlannerErr(err?.message ?? 'Could not add this place.');
    }
    setAddingId(null);
  }

  async function removeItem(it: TripItem) {
    const { error } = await supabase.from('trip_items').delete().eq('trip_item_id', it.key);
    if (!error) await refreshTrips();
  }

  function stopsFor(date: string) {
    return (selectedTrip?.items ?? [])
      .filter((i) => i.planned_date === date)
      .sort((a, b) => (a.sequence_no ?? 0) - (b.sequence_no ?? 0));
  }

  function slotLabel(it: TripItem) {
    const t = it.start_time ?? '';
    if (t.startsWith('09')) return 'Morning';
    if (t.startsWith('13')) return 'Afternoon';
    if (t.startsWith('18')) return 'Evening';
    return ['Morning', 'Afternoon', 'Evening'][(it.sequence_no ?? 1) - 1] ?? 'Stop';
  }

  function fmtTime(t: string | null) {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 === 0 ? 12 : hr % 12;
    return `${hr12}:${m} ${ampm}`;
  }

  async function updateTripDates(start: string, end: string) {
    const trip = selectedTrip;
    if (!trip) return;
    if (start && end && end < start) {
      setPlannerErr('End date must be after the start date.');
      return;
    }
    setPlannerErr(null);
    const { error } = await supabase
      .from('trips')
      .update({ start_date: start || null, end_date: end || null })
      .eq('trip_id', trip.trip_id);
    if (error) setPlannerErr(error.message);
    else await refreshTrips();
  }

  function pickSlotTimes(type: string | null, listingId: string): string[] {
    if (type === 'Restaurant') return ['12:00:00', '18:00:00'];
    const base = ['09:00:00', '13:00:00'];
    const sched = schedMap[listingId];
    if (!sched) return base;
    const ok = base.filter((s) => sched.open <= s.slice(0, 5) && s.slice(0, 5) < sched.close);
    return ok.length ? ok : base;
  }

  async function autoPlan() {
    const trip = selectedTrip;
    if (!trip) return;
    setPlannerErr(null);
    if (!trip.start_date || !trip.end_date) {
      setPlannerErr('Set the trip dates above first — the planner needs days to fill.');
      return;
    }
    if (tripStops.length === 0) {
      setPlannerErr('Add a destination stop first (e.g., "La Union"), then add places inside it.');
      return;
    }
    if (trip.items.length === 0) {
      setPlannerErr('Add at least one place first.');
      return;
    }
    setPlanning(true);
    try {
      const allDays: string[] = [];
      const d0 = new Date(trip.start_date + 'T00:00:00');
      const d1 = new Date(trip.end_date + 'T00:00:00');
      for (const d = new Date(d0); d <= d1; d.setDate(d.getDate() + 1)) allDays.push(d.toISOString().slice(0, 10));

      const blocks = new Map<string, string[]>();
      let cursor = 0;
      for (const s of tripStops) {
        const n = Math.max(1, s.days || 1);
        blocks.set(s.label, allDays.slice(cursor, cursor + n));
        cursor += n;
      }

      const typeRank: Record<string, number> = { Attraction: 0, Restaurant: 1, Hotel: 2 };
      const assignments: { item: TripItem; date: string; time: string; seq: number }[] = [];

      for (const s of tripStops) {
        const days = blocks.get(s.label) ?? [];
        if (!days.length) continue;
        const items = trip.items
          .filter((i) => matchesStop(i, s.label))
          .sort((a, b) => {
            const ta = typeRank[a.listing_type ?? ''] ?? 3;
            const tb = typeRank[b.listing_type ?? ''] ?? 3;
            if (ta !== tb) return ta - tb;
            return (b.rating ?? -1) - (a.rating ?? -1);
          });
        let dayIdx = 0;
        let used = 0;
        for (const item of items) {
          if (item.listing_type === 'Hotel') continue;
          const allowed = pickSlotTimes(item.listing_type, item.listing_id);
          if (used >= 3) {
            dayIdx += 1;
            used = 0;
          }
          if (dayIdx >= days.length) dayIdx = days.length - 1;
          const time = allowed[Math.min(used, allowed.length - 1)];
          assignments.push({ item, date: days[dayIdx], time, seq: used + 1 });
          used += 1;
        }
      }

      const assignedKeys = new Set(assignments.map((a) => a.item.key));
      const leftovers = trip.items.filter((i) => !assignedKeys.has(i.key) && i.listing_type !== 'Hotel');
      if (leftovers.length) {
        const restDays = allDays.slice(cursor);
        const days = restDays.length ? restDays : allDays;
        let dayIdx = 0;
        let used = 0;
        for (const item of leftovers.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1))) {
          const allowed = pickSlotTimes(item.listing_type, item.listing_id);
          if (used >= 3) {
            dayIdx += 1;
            used = 0;
          }
          if (dayIdx >= days.length) dayIdx = days.length - 1;
          assignments.push({ item, date: days[dayIdx], time: allowed[Math.min(used, allowed.length - 1)], seq: used + 1 });
          used += 1;
        }
      }

      for (const a of assignments) {
        const { error } = await supabase
          .from('trip_items')
          .update({ planned_date: a.date, start_time: a.time, sequence_no: a.seq })
          .eq('trip_item_id', a.item.key);
        if (error) throw error;
      }
      await refreshTrips();
    } catch (err: any) {
      setPlannerErr(err?.message ?? 'Could not auto-plan this trip.');
    }
    setPlanning(false);
  }

  async function clearPlan() {
    const trip = selectedTrip;
    if (!trip) return;
    const { error } = await supabase
      .from('trip_items')
      .update({ planned_date: null, start_time: null, sequence_no: null })
      .eq('trip_id', trip.trip_id);
    if (!error) await refreshTrips();
    else setPlannerErr(error.message);
  }

  const selectedTrip = trips.find((t) => t.trip_id === selectedTripId) ?? trips[0] ?? null;
  const inTripIds = new Set(selectedTrip?.items.map((i) => i.listing_id) ?? []);

  function matchesStop(dest: { destination_name?: string | null; region_country?: string | null } | null, label: string) {
    const l = label.trim().toLowerCase();
    if (!l || !dest) return false;
    return (
      (dest.region_country ?? '').toLowerCase().includes(l) ||
      (dest.destination_name ?? '').toLowerCase().includes(l)
    );
  }

  const tripStops = (selectedTrip?.stops ?? []) as { label: string; days: number }[];

  function stopItemCount(label: string) {
    return (selectedTrip?.items ?? []).filter((i) => matchesStop(i, label)).length;
  }

  async function saveStops(next: { label: string; days: number }[]) {
    const trip = selectedTrip;
    if (!trip) return;
    const { error } = await supabase.from('trips').update({ stops: next }).eq('trip_id', trip.trip_id);
    if (error) setPlannerErr(error.message);
    else await refreshTrips();
  }

  async function addStop(label: string) {
    const clean = label.trim();
    if (clean.length < 2) return;
    if (tripStops.some((s) => s.label.toLowerCase() === clean.toLowerCase())) {
      setPlannerErr('That stop is already in the trip.');
      return;
    }
    setPlannerErr(null);
    await saveStops([...tripStops, { label: clean, days: 1 }]);
    setDestPickerOpen(false);
    setDestSearch('');
  }

  async function removeStop(label: string) {
    await saveStops(tripStops.filter((s) => s.label !== label));
  }

  async function setStopDays(label: string, days: number) {
    await saveStops(tripStops.map((s) => (s.label === label ? { ...s, days: Math.max(1, days) } : s)));
  }

  const tripDays =
    selectedTrip?.start_date && selectedTrip?.end_date
      ? Math.max(
          1,
          Math.round(
            (new Date(selectedTrip.end_date + 'T00:00:00').getTime() -
              new Date(selectedTrip.start_date + 'T00:00:00').getTime()) /
              86400000
          ) + 1
        )
      : null;
  const totalAllocated = tripStops.reduce((sum, s) => sum + (s.days || 1), 0);
  const capacity = tripStops.length > 0 ? totalAllocated * 3 : tripDays ? tripDays * 3 : 6;

  const plannedDates = selectedTrip
    ? ([...new Set(selectedTrip.items.map((i) => i.planned_date).filter(Boolean))] as string[]).sort()
    : [];
  const unscheduledCount = selectedTrip ? selectedTrip.items.filter((i) => !i.planned_date).length : 0;

  const previewCount =
    destSearch.trim().length >= 2 ? explore.filter((l) => matchesStop(l.destination, destSearch)).length : 0;

  const regionSuggestions = (() => {
    const q = destSearch.trim().toLowerCase();
    if (q.length < 2) return [] as string[];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const d of allDests) {
      const region = (d.region_country ?? '').trim();
      if (region && region.toLowerCase().includes(q) && !seen.has(region.toLowerCase())) {
        seen.add(region.toLowerCase());
        out.push(region);
      }
      if (out.length >= 4) break;
    }
    return out;
  })();

  const suggestions: ExploreCard[] = (() => {
    const pool =
      tripStops.length > 0 ? explore.filter((l) => tripStops.some((s) => matchesStop(l.destination, s.label))) : explore;
    return pool.filter((l) => !inTripIds.has(l.listing_id)).sort(byRating).slice(0, 6);
  })();

  const plannerMatches =
    plannerQuery.trim().length >= 2
      ? explore
          .filter(
            (l) =>
              !inTripIds.has(l.listing_id) &&
              (tripStops.length === 0 || tripStops.some((s) => matchesStop(l.destination, s.label))) &&
              `${l.name} ${l.destination?.destination_name ?? ''} ${l.destination?.region_country ?? ''}`
                .toLowerCase()
                .includes(plannerQuery.trim().toLowerCase())
          )
          .slice(0, 5)
      : [];

  const addList = plannerMatches.length > 0 ? plannerMatches : suggestions;

  useEffect(() => {
    if (selectedTrip && selectedTrip.stops.length > 0 && selectedTrip.items.length > 0 && plannedDates.length > 0) {
      setSetupCollapsed(true);
    }
  }, [selectedTrip?.trip_id, plannedDates.length]);

  // Deep link from /my-trips: /?trip=TRP-001 selects that trip
  useEffect(() => {
    const t = searchParams.get('trip');
    if (t && trips.some((x) => x.trip_id === t)) setSelectedTripId(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trips]);

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

  const chip = (active: boolean) =>
    `px-3.5 py-1.5 rounded-full text-sm border transition ${
      active
        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

  const hoverListing = hover?.kind === 'listing' ? explore.find((l) => l.listing_id === hover.id) ?? null : null;
  const hoverDest = hover?.kind === 'destination' ? trending.find((t) => t.name === hover.name) ?? null : null;

  const exploreList = explore
    .filter((l) => exploreType === 'All' || l.listing_type === exploreType)
    .sort(byRating);

  if (role.authId && routing === null) {
    return (
      <main className="min-h-screen bg-slate-50 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Hero skeleton */}
          <div className="bg-gradient-to-b from-blue-50/60 via-white to-white border-b border-slate-200 mb-8 animate-fade-in">
            <div className="pt-16 pb-12">
              <div className="h-12 shimmer rounded-xl w-96 mx-auto" />
              <div className="h-6 shimmer rounded-lg w-[600px] mx-auto mt-4" />
              <div className="h-16 shimmer rounded-2xl w-full max-w-3xl mx-auto mt-8" />
            </div>
          </div>

          {/* Trip planner skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-6 animate-fade-in-up" style={{ animationDelay: '150ms', opacity: 0 }}>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-white border border-slate-200 rounded-2xl shimmer" />
              ))}
            </div>
            <div className="h-96 bg-white border border-slate-200 rounded-2xl shimmer" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col page-enter">
            {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50/70 via-white to-white border-b border-slate-200/60">
        {/* Soft decorative glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 -right-24 w-96 h-96 rounded-full bg-indigo-100/50 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-24">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 text-blue-700 text-sm font-semibold mb-6">
              <SparkleIcon className="w-4 h-4" />
              Your journey starts here
            </span>
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-5">
              {greeting}
              {firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="mt-2 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {firstName
                ? 'Where will your next story begin? Search below, or jump straight into your picks.'
                : 'Explore hand-rated places around the world — or create a free account for personal picks.'}
            </p>

            <div className="mt-10 max-w-3xl mx-auto">
              <SmartSearch placeholder='Where to? Try "Japan", "Kyoto", or "Palawan"' />
            </div>

            {recent.length > 0 && (
              <div className="mt-7 flex items-center justify-center gap-3 flex-wrap">
                <span className="text-sm font-semibold text-slate-500">Recent:</span>
                {recent.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => goSearch(q)}
                    className="px-5 py-2.5 rounded-full text-sm font-semibold bg-white text-slate-700 border border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition shadow-sm btn-press"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trip Planner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 w-full">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Trip planner</h2>
            <span className="text-sm text-slate-500">Dates, itineraries, and smart place suggestions</span>
          </div>
          {userId && (
            <Link href="/my-trips" className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap flex items-center gap-1">
              My trips & bookings
              <Chevron className="w-4 h-4" />
            </Link>
          )}
        </div>

        {!userId ? (
          <div className="card-hover p-12 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center mb-6 shadow-lg">
              <MapIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Plan trips with a free account</h3>
            <p className="text-base text-slate-600 max-w-md mx-auto mb-8">
              Save places into dated itineraries and get suggestions tailored to each destination.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/signup" className="btn-primary">
                Create a free account
              </Link>
              <Link href="/login" className="btn-secondary">
                Sign in
              </Link>
            </div>
          </div>
        ) : trips.length === 0 ? (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 md:p-12 text-white shadow-2xl">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10" />
            <div className="absolute -bottom-24 -left-10 w-72 h-72 rounded-full bg-white/5" />
            <div className="relative">
              <h3 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Where to next?</h3>
              <p className="text-blue-100 max-w-lg text-base md:text-lg mb-8">
                Create a trip, pick your dates, and we'll suggest the best-rated places to fill your itinerary.
              </p>
              <form onSubmit={handleStartCreate} className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-4">
                <div>
                  <input
                    value={startName}
                    onChange={(e) => setStartName(e.target.value)}
                    maxLength={100}
                    placeholder="Trip name — e.g., Japan Spring Adventure"
                    className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:ring-2 focus:ring-white/60 outline-none transition backdrop-blur-sm"
                  />
                  <p className="text-xs text-blue-200 mt-2 text-right">{startName.length}/100</p>
                </div>
                <input
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/60 outline-none transition backdrop-blur-sm [color-scheme:dark]"
                />
                <input
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-5 py-4 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-white/60 outline-none transition backdrop-blur-sm [color-scheme:dark]"
                />
                <button
                  type="submit"
                  disabled={startBusy}
                  className="px-8 py-4 rounded-xl bg-white text-blue-700 text-base font-semibold hover:bg-blue-50 active:bg-blue-100 transition shadow-lg disabled:opacity-60 btn-press"
                >
                  {startBusy ? 'Creating…' : 'Start planning'}
                </button>
              </form>
              {plannerErr && <p className="mt-4 text-sm text-red-200 bg-red-500/20 rounded-xl px-4 py-3">{plannerErr}</p>}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6">
            {/* Trip List Sidebar */}
            <div className="space-y-3">
              {trips.map((t) => {
                const sel = selectedTrip?.trip_id === t.trip_id;
                const status = getTripStatus(t);
                return (
                  <div key={t.trip_id} className="relative">
                    <button
                      type="button"
                      onClick={() => setSelectedTripId(t.trip_id)}
                      className={`w-full text-left rounded-2xl border-2 p-5 transition-all ${
                        sel
                          ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/50 ring-2 ring-blue-600/20 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-bold text-slate-900 truncate text-base">{t.trip_name ?? `Trip ${t.trip_id}`}</p>
                        <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${
                          status === 'finished' ? 'bg-slate-100 text-slate-700' :
                          status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {status === 'finished' ? 'Finished' : status === 'ongoing' ? 'Ongoing' : 'Upcoming'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mb-1">{fmtDate(t.start_date)} → {fmtDate(t.end_date)}</p>
                      <p className="text-sm text-slate-600 font-medium">{t.items.length} place{t.items.length === 1 ? '' : 's'}</p>
                    </button>
                    {sel && (
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowEditTripModal(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition"
                        >
                          <EditIcon className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(t.trip_id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 transition"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setShowTripModal(true)}
                className="w-full rounded-2xl border-2 border-dashed border-slate-300 bg-white/50 hover:border-blue-400 hover:bg-blue-50/60 transition flex items-center justify-center gap-2 p-6 text-slate-500 hover:text-blue-600 text-base font-medium"
              >
                <PlusIcon className="w-5 h-5" />
                New trip
              </button>
            </div>

            {/* Trip Details Panel */}
            {selectedTrip && (
              <div className="card-hover p-8">
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-slate-900">{selectedTrip.trip_name ?? `Trip ${selectedTrip.trip_id}`}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <select
                          value={getTripStatus(selectedTrip)}
                          onChange={(e) => updateTripStatus(e.target.value)}
                          className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-600 outline-none transition bg-white"
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="ongoing">Ongoing</option>
                          <option value="finished">Finished</option>
                        </select>
                        <span className="text-sm text-slate-500">
                          {fmtDate(selectedTrip.start_date)} → {fmtDate(selectedTrip.end_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (selectedTrip.items.length / capacity) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-slate-600 font-medium">
                      {selectedTrip.items.length}/{capacity} slots
                      {tripDays ? ` · ${tripDays} days` : ' · set dates for more'}
                    </span>
                  </div>
                </div>

                {plannerErr && <p className="mt-4 bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm">{plannerErr}</p>}

                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setSetupCollapsed(!setupCollapsed)}
                    className="w-full flex items-center justify-between py-3 text-left group"
                  >
                    <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Trip setup</h4>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition ${setupCollapsed ? '-rotate-90' : ''}`} />
                  </button>
                  
                  {!setupCollapsed && (
                    <>
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <input
                          type="date"
                          value={selectedTrip.start_date ?? ''}
                          max={selectedTrip.end_date || undefined}
                          onChange={(e) => updateTripDates(e.target.value, selectedTrip.end_date ?? '')}
                          className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition bg-white"
                        />
                        <span className="text-sm text-slate-400 font-medium">→</span>
                        <input
                          type="date"
                          value={selectedTrip.end_date ?? ''}
                          min={selectedTrip.start_date || undefined}
                          onChange={(e) => updateTripDates(selectedTrip.start_date ?? '', e.target.value)}
                          className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-700 focus:ring-2 focus:ring-blue-600 outline-none transition bg-white"
                        />
                      </div>

                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Destination stops</h4>
                          <button
                            type="button"
                            onClick={() => setDestPickerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition btn-press shadow-sm"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add stop
                          </button>
                        </div>
                        {tripStops.length === 0 ? (
                          <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-6 py-8 text-center">
                            No stops yet — add a province, city, or country (e.g., "La Union") to scope place suggestions.
                          </p>
                        ) : (
                          <>
                            <div className="space-y-3">
                              {tripStops.map((s) => (
                                <div key={s.label} className="flex items-center gap-4 rounded-xl border border-slate-200 px-5 py-4 bg-white hover:shadow-sm transition">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-slate-900 text-base truncate">{s.label}</p>
                                    <p className="text-xs text-slate-500 mt-1 truncate">
                                      {stopItemCount(s.label)} of your places fall inside this stop
                                    </p>
                                  </div>
                                  <label className="text-sm text-slate-600 shrink-0 font-medium">Days</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={tripDays ?? 60}
                                    value={s.days}
                                    onChange={(e) => setStopDays(s.label, parseInt(e.target.value) || 1)}
                                    className="w-20 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 outline-none transition bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeStop(s.label)}
                                    aria-label={`Remove ${s.label}`}
                                    className="w-9 h-9 shrink-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center"
                                  >
                                    <CloseIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            {tripDays != null && totalAllocated !== tripDays && (
                              <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                Allocated days ({totalAllocated}) don't match trip length ({tripDays}) — the planner follows your allocation.
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">Itinerary</h4>
                          {selectedTrip.items.length === 0 ? (
                            <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-6 py-8 text-center">
                              No places yet — add some from the right.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {selectedTrip.items.map((it, idx) => (
                                <div key={it.key} className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3.5 bg-white hover:shadow-sm transition">
                                  <span className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-sm">
                                    {idx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/listing/${it.listing_id}`} className="block font-semibold text-slate-900 text-base truncate hover:text-blue-700 transition">
                                      {it.name}
                                    </Link>
                                    {it.destination_name && <p className="text-xs text-slate-500 truncate mt-0.5">{it.destination_name}</p>}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(it)}
                                    aria-label={`Remove ${it.name}`}
                                    className="w-9 h-9 shrink-0 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition flex items-center justify-center"
                                  >
                                    <CloseIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4">
                            {plannerMatches.length > 0 ? 'Search results' : 'Suggested for this trip'}
                          </h4>
                          <div className="mb-4">
                            <input
                              value={plannerQuery}
                              onChange={(e) => setPlannerQuery(e.target.value)}
                              maxLength={50}
                              placeholder="Add any place — type to search…"
                              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
                            />
                            <p className="text-xs text-slate-500 text-right mt-2">{plannerQuery.length}/50</p>
                          </div>
                          <div className="space-y-3">
                            {addList.length === 0 && (
                              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-6 py-8 text-center">
                                Nothing matches — try another keyword.
                              </p>
                            )}
                            {addList.map((l) => (
                              <div key={l.listing_id} className="flex items-center gap-4 rounded-xl border border-slate-200 px-4 py-3.5 bg-white hover:shadow-sm transition">
                                {l.image_url ? (
                                  <img src={l.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm" />
                                ) : (
                                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 flex items-center justify-center text-slate-400 font-bold text-xl">
                                    {l.listing_type.charAt(0)}
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-slate-900 text-base truncate">{l.name}</p>
                                  <p className="text-xs text-slate-500 truncate mt-0.5">
                                    {l.destination?.destination_name}
                                    {l.average_rating != null ? ` · ★ ${Number(l.average_rating).toFixed(1)}` : ''}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => addItem(l.listing_id)}
                                  disabled={addingId === l.listing_id}
                                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition disabled:opacity-60 btn-press shadow-sm"
                                >
                                  <PlusIcon className="w-4 h-4" />
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedTrip.items.length > 0 && (
                  <div className={`${setupCollapsed ? 'mt-6' : 'mt-10'} border-t border-slate-200 pt-8`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h4 className="text-xl font-bold text-slate-900 mb-1">Day-by-day roadmap</h4>
                        <p className="text-sm text-slate-500">
                          {plannedDates.length > 0
                            ? `Planned by TravelMate — morning, afternoon & evening slots${
                                unscheduledCount > 0
                                  ? ` · ${unscheduledCount} new place${unscheduledCount === 1 ? '' : 's'} waiting to be planned`
                                  : ''
                              }`
                            : 'Not scheduled yet — press "Plan automatically" to build your days'}
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={autoPlan}
                          disabled={planning}
                          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 active:bg-slate-700 transition shadow-lg disabled:opacity-60 btn-press"
                        >
                          <SparkleIcon className="w-5 h-5" />
                          {planning ? 'Planning…' : 'Plan automatically'}
                        </button>
                        {plannedDates.length > 0 && (
                          <button
                            type="button"
                            onClick={clearPlan}
                            className="px-5 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
                          >
                            Clear schedule
                          </button>
                        )}
                      </div>
                    </div>

                    {plannedDates.length > 0 ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                          <SummaryTile label="Days" value={String(plannedDates.length)} />
                          <SummaryTile label="Places" value={String(selectedTrip.items.length)} />
                          <SummaryTile
                            label="Destinations"
                            value={String(new Set(selectedTrip.items.map((i) => i.destination_name).filter(Boolean)).size)}
                          />
                          <SummaryTile label="Pace" value={`${(selectedTrip.items.length / plannedDates.length).toFixed(1)}/day`} />
                        </div>

                        <div className="relative pl-8">
                          <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full" />
                          {plannedDates.map((date, di) => (
                            <div key={date} className="relative mb-10 last:mb-0">
                              <span className="absolute -left-8 top-1 w-6 h-6 rounded-full border-4 border-blue-600 bg-white shadow-lg" />
                              <div className="flex items-baseline gap-4 mb-4">
                                <p className="text-lg font-bold text-slate-900">Day {di + 1}</p>
                                <p className="text-sm text-slate-500 font-medium">{fmtDate(date)}</p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {stopsFor(date).map((it) => (
                                  <Link
                                    key={it.key}
                                    href={`/listing/${it.listing_id}`}
                                    className="card-hover p-5 transition-all"
                                  >
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm">
                                        {slotLabel(it)}
                                      </span>
                                      <span className="text-xs text-slate-500 font-medium">{fmtTime(it.start_time)}</span>
                                    </div>
                                    <p className="font-bold text-slate-900 text-base truncate mb-1">{it.name}</p>
                                    <p className="text-xs text-slate-500 truncate">
                                      {it.listing_type ?? 'Place'}
                                      {it.destination_name ? ` · ${it.destination_name}` : ''}
                                    </p>
                                    {it.rating != null && (
                                      <p className="mt-2 flex items-center gap-1 text-sm font-bold text-amber-600">
                                        <Star className="w-4 h-4" />
                                        {Number(it.rating).toFixed(1)}
                                      </p>
                                    )}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-slate-100 p-10 text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                          <SparkleIcon className="w-8 h-8" />
                        </div>
                        <p className="text-base text-slate-700 font-medium mb-2">Ready to plan your itinerary?</p>
                        <p className="text-sm text-slate-500">
                          Add places, then press <span className="font-bold text-slate-900">Plan automatically</span> — TravelMate
                          assigns mornings, afternoons and evenings across your dates, keeping same-area places together.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Explore Places */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Explore places</h2>
            <p className="text-sm text-slate-500">
              Discover {exploreList.length} curated destinations from our community
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXPLORE_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setExploreType(t)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
                  exploreType === t
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 hover:shadow-sm'
                }`}
              >
                {t === 'All' ? 'All places' : `${t}s`}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
            {exploreList.map((l) => (
              <Link
                key={l.listing_id}
                href={`/listing/${l.listing_id}`}
                onMouseEnter={(e) => startHover({ kind: 'listing', id: l.listing_id }, e.currentTarget)}
                onMouseLeave={cancelHover}
                className={`w-[360px] shrink-0 snap-start group card-hover card-lift overflow-hidden animate-once animate-fade-in-up delay-${Math.min(exploreList.indexOf(l), 7)}`}
              >
                <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                  {l.image_url ? (
                    <img
                      src={l.image_url}
                      alt={l.name}
                      className="w-full h-full object-cover img-zoom"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                      <span className="text-5xl font-bold text-blue-300">{l.listing_type.charAt(0)}</span>
                    </div>
                  )}
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  {/* Type badge */}
                  <div className="absolute top-5 left-5">
                    <span className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider bg-white/95 text-slate-700 shadow-lg backdrop-blur-sm">
                      {l.listing_type}
                    </span>
                  </div>

                  {/* Rating badge */}
                  {l.average_rating != null && (
                    <div className="absolute top-5 right-5">
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/80 backdrop-blur-sm text-white text-sm font-bold shadow-lg">
                        <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                        </svg>
                        {Number(l.average_rating).toFixed(1)}
                      </div>
                    </div>
                  )}

                  {/* Bottom info overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-bold text-white text-2xl leading-tight mb-2 line-clamp-2">
                      {l.name}
                    </h3>
                    <div className="flex items-center gap-2 text-white/95 text-base font-medium">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M12 21s-7-5.1-7-11a7 7 0 1114 0c0 5.9-7 11-7 11z" strokeLinecap="round" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                      <span className="truncate">
                        {l.destination?.destination_name}, {l.destination?.region_country}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-6">
                  <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-5">
                    {subtypeMap[l.listing_id]
                      ? subtypeMap[l.listing_id].value
                      : (l.description ?? '').slice(0, 80) || 'Discover this amazing place and create unforgettable memories'}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="badge-blue font-semibold">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
                        </svg>
                        {l.average_rating != null ? Number(l.average_rating).toFixed(1) : 'New'}
                      </span>
                    </div>
                    <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:text-blue-700 transition">
                      View details
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
            {exploreList.length === 0 && (
              <div className="w-full text-center py-16">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <MapIcon className="w-10 h-10" />
                </div>
                <p className="text-base text-slate-600 font-medium mb-2">No listings yet</p>
                <p className="text-sm text-slate-500">Check back soon for amazing destinations!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 w-full">
        <SectionHeader
          title={hasPersonal ? 'Top picks for you' : 'Community favorites'}
          helper={hasPersonal ? 'From your recommendation profile' : 'Most-recommended places across TravelMate'}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recs.map((r, i) => {
            const dest = r.listing?.destination;
            const pct = Math.round(Number(r.recommendation_score) * 100);
            return (
              <Link
                key={r.listing?.listing_id ?? i}
                href={`/listing/${r.listing?.listing_id}`}
                className="group relative overflow-hidden card-hover p-6 animate-once animate-fade-in-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-lg truncate group-hover:text-blue-700 transition mb-1">
                      {r.listing?.name ?? '—'}
                    </p>
                    <p className="text-sm text-slate-500 truncate">{dest?.region_country ?? '—'}</p>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm ${
                      pct >= 90 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                    }`}
                  >
                    {pct >= 90 ? 'Excellent match' : 'Good match'}
                  </span>
                </div>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-lg font-bold text-blue-700">{pct}%</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm text-slate-600 truncate">{r.recommendation_reason ?? 'Community favorite'}</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-500 group-hover:text-blue-600 transition whitespace-nowrap">
                    View place
                    <Chevron className="w-4 h-4" />
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
            <div className="md:col-span-2 card-hover px-8 py-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 flex items-center justify-center mb-4">
                <SparkleIcon className="w-10 h-10" />
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">No recommendations yet</p>
              <p className="text-sm text-slate-500">Run a search to build your profile and get personalized picks.</p>
            </div>
          )}
        </div>
      </section>

      {/* Forecast + Quick Actions */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        <div className="card-hover p-8 flex flex-col">
          <SectionHeader
            title="5-day forecast"
            helper={forecastLocation ? `Live · ${forecastLocation}` : 'Sample data'}
          />
          <div className="grid grid-cols-5 gap-3 text-center">
            {forecast.map((o, i) => (
              <div key={`${o.day}-${i}`} className="rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 py-4 hover:shadow-md transition">
                <p className="text-sm font-semibold text-slate-500 mb-1">{o.day}</p>
                <p className="text-xl font-bold text-slate-900">{o.temp}°</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-slate-500">
            {forecastLocation
              ? 'Live telemetry via Open-Meteo (Mission 1, Challenge 3).'
              : 'Set your current location in Profile for live weather.'}
          </p>
        </div>

        <div className="card-hover p-8 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick actions</h2>
          <div className="space-y-3 flex-1 flex flex-col justify-between gap-3">
            <Link
              href="/my-trips"
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-slate-200 text-base font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition shadow-sm"
            >
              My trips & bookings
              <Chevron className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/search"
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-slate-200 text-base font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition shadow-sm"
            >
              Search destinations
              <Chevron className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/owner"
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-slate-200 text-base font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition shadow-sm"
            >
              Manage my listings
              <Chevron className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/apply"
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-slate-200 text-base font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition shadow-sm"
            >
              List your place
              <Chevron className="w-5 h-5 text-slate-400" />
            </Link>
            <Link
              href="/profile"
              className="flex items-center justify-between px-5 py-4 rounded-xl border border-slate-200 text-base font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition shadow-sm"
            >
              Your profile & preferences
              <Chevron className="w-5 h-5 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 w-full">
        <SectionHeader title="Trending destinations" helper="Highest-rated across our listings" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {trending.map((t, i) => (
            <Link
              key={t.name}
              href={`/search?q=${encodeURIComponent(t.name)}`}
              onMouseEnter={(e) => startHover({ kind: 'destination', name: t.name }, e.currentTarget)}
              onMouseLeave={cancelHover}
              className="group relative overflow-hidden card-hover card-lift p-6 animate-once animate-fade-in-up"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-400">#{i + 1}</span>
                <span className="flex items-center gap-1.5 text-base font-bold text-amber-600">
                  <Star className="w-5 h-5" />
                  {t.rating.toFixed(1)}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-900 leading-snug group-hover:text-blue-700 transition mb-2">{t.name}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">{t.country}</p>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-500 group-hover:text-blue-600 transition">
                View listings
                <Chevron className="w-4 h-4" />
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

      {/* Hover Popovers */}
      {hover && (hoverListing || hoverDest) && (
        <div className="fixed z-50 w-80 pointer-events-none" style={popoverStyle(hover.rect)}>
          <div className="card-hover shadow-2xl p-5 flex flex-col gap-3 animate-scale-in">
            {hoverListing && (
              <>
                <div className="flex items-center gap-4">
                  {hoverListing.image_url ? (
                    <img src={hoverListing.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 shadow-md" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shrink-0 flex items-center justify-center text-slate-400 font-bold text-2xl">
                      {hoverListing.listing_type.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-base truncate mb-0.5">{hoverListing.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {hoverListing.destination?.destination_name}, {hoverListing.destination?.region_country}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    {hoverListing.listing_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-base font-bold text-amber-600">
                  <Star className="w-5 h-5" />
                  {hoverListing.average_rating != null ? Number(hoverListing.average_rating).toFixed(1) : 'Not rated yet'}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                  {descMap[hoverListing.listing_id] || 'No description yet — click to see reviews and photos.'}
                </p>
                {subtypeMap[hoverListing.listing_id] && (
                  <p className="text-xs text-slate-600">
                    <span className="font-bold uppercase tracking-wider text-slate-500">
                      {subtypeMap[hoverListing.listing_id].label}:{' '}
                    </span>
                    {subtypeMap[hoverListing.listing_id].value}
                  </p>
                )}
                <p className="text-xs font-semibold text-blue-600">Click to open full page →</p>
              </>
            )}
            {hoverDest && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 text-white shadow-lg">
                    <MapIcon className="w-8 h-8" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 text-base truncate mb-0.5">{hoverDest.name}</p>
                    <p className="text-sm text-slate-500 truncate">{hoverDest.country}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                    Destination
                  </span>
                </div>
                <div className="flex items-center gap-2 text-base font-bold text-amber-600">
                  <Star className="w-5 h-5" />
                  {hoverDest.rating.toFixed(1)} average rating
                </div>
                <p className="text-sm text-slate-600">
                  {destExtra[hoverDest.name]?.count ?? 0} listing{(destExtra[hoverDest.name]?.count ?? 0) === 1 ? '' : 's'} on TravelMate
                </p>
                {destExtra[hoverDest.name]?.top?.length ? (
                  <p className="text-xs text-slate-600">
                    <span className="font-bold uppercase tracking-wider text-slate-500">Popular here: </span>
                    {destExtra[hoverDest.name].top.join(', ')}
                  </p>
                ) : null}
                <p className="text-xs font-semibold text-blue-600">Click to view listings →</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Destination Picker Modal */}
      {destPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setDestPickerOpen(false)}>
          <div className="card-hover p-8 max-w-md w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add destination stop</h3>
              <button type="button" onClick={() => setDestPickerOpen(false)} className="text-slate-400 hover:text-slate-600 transition">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="mb-4">
              <input
                value={destSearch}
                onChange={(e) => setDestSearch(e.target.value)}
                maxLength={50}
                placeholder="Search province, city, or country…"
                autoFocus
                className="w-full px-5 py-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
              />
              <p className="text-xs text-slate-500 text-right mt-2">{destSearch.length}/50</p>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              {destSearch.trim().length >= 2 ? (
                <>
                  <span className="font-bold text-slate-900">{previewCount}</span> place{previewCount === 1 ? '' : 's'} in the catalog fall inside "{destSearch.trim()}"
                </>
              ) : (
                'Type a province, city, or country — e.g., "La Union", "Kyoto", "Japan".'
              )}
            </p>
            {regionSuggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {regionSuggestions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDestSearch(r)}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-800 transition"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              disabled={destSearch.trim().length < 2}
              onClick={() => addStop(destSearch)}
              className="w-full py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 active:bg-blue-800 transition shadow-lg disabled:opacity-60 btn-press"
            >
              Add stop "{destSearch.trim() || '…'}"
            </button>
          </div>
        </div>
      )}

      {/* New Trip Modal */}
      {showTripModal && userId && (
        <NewTripModal
          userId={userId}
          onClose={() => setShowTripModal(false)}
          onCreated={async (id) => {
            setShowTripModal(false);
            await refreshTrips();
            setSelectedTripId(id);
          }}
        />
      )}

      {/* Edit Trip Modal */}
      {showEditTripModal && selectedTrip && (
        <EditTripModal
          trip={selectedTrip}
          onClose={() => setShowEditTripModal(false)}
          onUpdated={async () => {
            setShowEditTripModal(false);
            await refreshTrips();
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowDeleteConfirm(null)}>
          <div className="card-hover p-8 max-w-md w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-900 mb-4">Delete this trip?</h3>
            <p className="text-sm text-slate-600 mb-8">
              This will permanently delete the trip and all its places. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 py-4 rounded-xl border border-slate-300 bg-white text-base font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteTrip(showDeleteConfirm)}
                className="flex-1 py-4 rounded-xl bg-red-600 text-white text-base font-semibold hover:bg-red-700 active:bg-red-800 transition shadow-lg btn-press"
              >
                Delete trip
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}

function NewTripModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: (id: string) => void }) {
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
      onCreated(tripId as string);
    } catch (e: any) {
      setErr(e?.message ?? 'Could not create the trip.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="card-hover p-8 max-w-md w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Plan a new trip</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-6">{err}</p>}
        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Trip name</label>
              <span className="text-xs text-slate-500">{name.length}/100</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              placeholder="e.g., Japan Spring Adventure"
              className="w-full px-5 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start date</label>
              <input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">End date</label>
              <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white" />
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <button type="button" onClick={onClose}
            className="flex-1 py-4 rounded-xl border border-slate-300 bg-white text-base font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={create} disabled={busy}
            className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 active:bg-blue-800 transition shadow-lg disabled:opacity-60 btn-press">
            {busy ? 'Creating…' : 'Create trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditTripModal({ trip, onClose, onUpdated }: { trip: TripData; onClose: () => void; onUpdated: () => void }) {
  const supabase = createClient();
  const [name, setName] = useState(trip.trip_name ?? '');
  const [start, setStart] = useState(trip.start_date ?? '');
  const [end, setEnd] = useState(trip.end_date ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function update() {
    setErr(null);
    setBusy(true);
    try {
      if (!name.trim()) throw new Error('Give your trip a name.');
      if (start && end && end < start) throw new Error('End date must be after the start date.');
      const { error } = await supabase
        .from('trips')
        .update({ trip_name: name.trim(), start_date: start || null, end_date: end || null })
        .eq('trip_id', trip.trip_id);
      if (error) throw error;
      onUpdated();
    } catch (e: any) {
      setErr(e?.message ?? 'Could not update the trip.');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="card-hover p-8 max-w-md w-full shadow-2xl animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Edit trip</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600 transition">
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-6">{err}</p>}
        <div className="space-y-5">
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="block text-sm font-semibold text-slate-700">Trip name</label>
              <span className="text-xs text-slate-500">{name.length}/100</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-5 py-3.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Start date</label>
              <input type="date" value={start} max={end || undefined} onChange={(e) => setStart(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">End date</label>
              <input type="date" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition bg-white" />
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-8">
          <button type="button" onClick={onClose}
            className="flex-1 py-4 rounded-xl border border-slate-300 bg-white text-base font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button type="button" onClick={update} disabled={busy}
            className="flex-1 py-4 rounded-xl bg-blue-600 text-white text-base font-semibold hover:bg-blue-700 active:bg-blue-800 transition shadow-lg disabled:opacity-60 btn-press">
            {busy ? 'Updating…' : 'Update trip'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? 'w-4 h-4'}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <circle cx="19" cy="18" r="2" opacity=".6" />
    </svg>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-5 text-center hover:shadow-md transition">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">{label}</p>
      <p className="text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function PlaceOverlay({ type, description, fact, footer }: { type: string; description: string | null; fact?: { label: string; value: string }; footer: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 bg-slate-900/95 backdrop-blur-md p-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
      <span className="self-start px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">{type}</span>
      {description ? (
        <p className="text-sm leading-relaxed text-slate-100 line-clamp-4">{description}</p>
      ) : (
        <p className="text-sm text-slate-300">No description yet — click to see reviews and photos.</p>
      )}
      {fact && (
        <p className="text-xs text-slate-200">
          <span className="font-bold uppercase tracking-wider text-slate-400">{fact.label}: </span>
          {fact.value}
        </p>
      )}
      <span className="mt-auto text-xs font-semibold text-blue-300">{footer} →</span>
    </div>
  );
}