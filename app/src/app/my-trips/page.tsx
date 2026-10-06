// app/src/app/my-trips/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type TripItemLite = { name: string; listing_id: string; planned_date: string | null };
type TripRow = {
  trip_id: string;
  trip_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  items: TripItemLite[];
};
type BookingRow = {
  booking_id: string;
  listing_id: string;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  special_requests: string | null;
  status: string | null;
  listing_name?: string;
  listing_type?: string;
  image_url?: string | null;
};

function MapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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

function tripChip(status: string) {
  const cls =
    status === 'finished' ? 'bg-slate-100 text-slate-600' : status === 'ongoing' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700';
  const label = status === 'finished' ? 'Finished' : status === 'ongoing' ? 'Ongoing' : 'Upcoming';
  return <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{label}</span>;
}

function bookingChip(status: string | null) {
  const s = status ?? 'pending';
  const cls =
    s === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : s === 'rejected' ? 'bg-rose-50 text-rose-700' : s === 'cancelled' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700';
  return <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${cls}`}>{s}</span>;
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function MyTripsPage() {
  const supabase = createClient();
  const role = useRole();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [tab, setTab] = useState<'trips' | 'bookings'>('trips');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!role.loading && role.userId) load(role.userId);
    if (!role.loading && !role.userId) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.userId]);

  // Managers (owners/admins) have no traveler trips — send them to the hub
  useEffect(() => {
    if (!role.loading && (role.isOwner || role.isAdmin)) router.replace('/business');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.isOwner, role.isAdmin]);

  async function load(uid: string) {
    const { data: t } = await supabase.from('trips').select('*').eq('user_id', uid).order('start_date', { ascending: false });
    const rows = (t ?? []) as any[];
    const tripIds = rows.map((r) => r.trip_id);
    const itemsByTrip: Record<string, TripItemLite[]> = {};
    if (tripIds.length) {
      const { data: items } = await supabase.from('trip_items').select('*').in('trip_id', tripIds);
      const listingIds = [...new Set((items ?? []).map((i: any) => i.listing_id).filter(Boolean))];
      const nameMap: Record<string, string> = {};
      if (listingIds.length) {
        const { data: ls } = await supabase.from('listings').select('listing_id, name').in('listing_id', listingIds);
        (ls ?? []).forEach((l: any) => { nameMap[l.listing_id] = l.name; });
      }
      (items ?? []).forEach((i: any) => {
        (itemsByTrip[i.trip_id] ??= []).push({
          name: nameMap[i.listing_id] ?? i.listing_id,
          listing_id: i.listing_id,
          planned_date: i.planned_date ?? null,
        });
      });
    }
    setTrips(
      rows.map((r) => ({
        trip_id: r.trip_id,
        trip_name: r.trip_name ?? null,
        start_date: r.start_date ?? null,
        end_date: r.end_date ?? null,
        status: r.status ?? null,
        items: itemsByTrip[r.trip_id] ?? [],
      }))
    );

    const { data: b } = await supabase.from('bookings').select('*').eq('user_id', uid).order('booking_id', { ascending: false });
    const brows = (b ?? []) as BookingRow[];
    const lids = [...new Set(brows.map((x) => x.listing_id))];
    if (lids.length) {
      const { data: ls } = await supabase.from('listings').select('listing_id, name, listing_type, image_url').in('listing_id', lids);
      const lm: Record<string, any> = {};
      (ls ?? []).forEach((l: any) => { lm[l.listing_id] = l; });
      brows.forEach((x) => {
        x.listing_name = lm[x.listing_id]?.name;
        x.listing_type = lm[x.listing_id]?.listing_type;
        x.image_url = lm[x.listing_id]?.image_url;
      });
    }
    setBookings(brows);
    setLoading(false);
  }

  async function cancelBooking(id: string) {
    setBusyId(id);
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('booking_id', id);
    if (!error && role.userId) await load(role.userId);
    setBusyId(null);
  }

  if (role.loading || loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading your trips…</p>
      </main>
    );
  }

  if (!role.authId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">My trips & bookings</h1>
          <p className="text-slate-500 text-sm">
            <Link href="/login" className="text-blue-600 underline">Sign in</Link> to see your trips and booking requests.
          </p>
        </div>
      </main>
    );
  }

  const activeTrips = trips.filter((t) => getTripStatus(t) !== 'finished');
  const finishedTrips = trips.filter((t) => getTripStatus(t) === 'finished');
  const pendingBookings = bookings.filter((b) => (b.status ?? 'pending') === 'pending');

  const tabCls = (on: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition ${
      on ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My trips & bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Everything you've planned and requested, in one place.</p>
          </div>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
            ← Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatTile label="Active trips" value={String(activeTrips.length)} />
          <StatTile label="Finished trips" value={String(finishedTrips.length)} />
          <StatTile label="Bookings" value={String(bookings.length)} />
          <StatTile label="Awaiting reply" value={String(pendingBookings.length)} />
        </div>

        <div className="flex gap-2 mb-6">
          <button type="button" onClick={() => setTab('trips')} className={tabCls(tab === 'trips')}>
            Trips ({trips.length})
          </button>
          <button type="button" onClick={() => setTab('bookings')} className={tabCls(tab === 'bookings')}>
            Bookings ({bookings.length})
          </button>
        </div>

        {tab === 'trips' ? (
          trips.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapIcon className="w-7 h-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No trips yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Create your first trip on the dashboard and start saving places into a day-by-day plan.
              </p>
              <Link href="/" className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                Open trip planner
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map((t) => {
                const st = getTripStatus(t);
                return (
                  <div key={t.trip_id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold text-slate-900 truncate">{t.trip_name ?? `Trip ${t.trip_id}`}</p>
                      {tripChip(st)}
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{fmtDate(t.start_date)} → {fmtDate(t.end_date)}</p>
                    <div className="mt-3 flex-1">
                      {t.items.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {t.items.slice(0, 3).map((it, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs truncate max-w-[10rem]">
                              {it.name}
                            </span>
                          ))}
                          {t.items.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">+{t.items.length - 3} more</span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No places saved yet.</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{t.items.length} place{t.items.length === 1 ? '' : 's'}</span>
                      <Link href={`/?trip=${t.trip_id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                        Open in planner →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : bookings.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">No booking requests yet</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              When you request dates on a listing, the request and its status will show up here.
            </p>
            <Link href="/search" className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              Browse places
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.booking_id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {b.image_url ? (
                    <img src={b.image_url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-slate-100 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{b.listing_name ?? b.listing_id}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {b.listing_type ?? 'Place'} · {fmtDate(b.check_in)} → {fmtDate(b.check_out)} · {b.guests ?? 1} guest{(b.guests ?? 1) === 1 ? '' : 's'}
                    </p>
                    {b.special_requests && <p className="text-xs text-slate-500 mt-1 truncate">"{b.special_requests}"</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {bookingChip(b.status)}
                  <Link href={`/listing/${b.listing_id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                    View listing
                  </Link>
                  {(b.status ?? 'pending') === 'pending' && (
                    <button
                      type="button"
                      onClick={() => cancelBooking(b.booking_id)}
                      disabled={busyId === b.booking_id}
                      className="text-xs font-medium text-slate-500 hover:text-rose-600 transition disabled:opacity-60"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}