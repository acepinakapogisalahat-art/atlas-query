// app/src/app/my-trips/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type TripItemLite = { name: string; listing_id: string | null; planned_date: string | null; isNote: boolean };
type TripRow = {
  trip_id: string;
  trip_name: string | null;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  items: TripItemLite[];
  placesCount: number;
  reviewedCount: number;
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

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function getTripStatus(t: { start_date: string | null; end_date: string | null }): string {
  const today = new Date().toISOString().slice(0, 10);
  if (!t.start_date || !t.end_date) return 'upcoming';
  if (today > t.end_date) return 'finished';
  if (today >= t.start_date && today <= t.end_date) return 'ongoing';
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

function StatTile({ label, value, accent }: { label: string; value: string; accent?: 'blue' | 'amber' | 'emerald' | 'slate' }) {
  const ring =
    accent === 'blue' ? 'border-blue-200 bg-blue-50/40'
    : accent === 'amber' ? 'border-amber-200 bg-amber-50/40'
    : accent === 'emerald' ? 'border-emerald-200 bg-emerald-50/40'
    : 'border-slate-200 bg-white';
  return (
    <div className={`rounded-2xl p-5 shadow-sm border text-center ${ring}`}>
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
  const [tripFilter, setTripFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'finished'>('all');
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
    const allListingIds = new Set<string>();

    if (tripIds.length) {
      const { data: items } = await supabase.from('trip_items').select('*').in('trip_id', tripIds);
      const listingIds = [...new Set((items ?? []).map((i: any) => i.listing_id).filter((id: any) => id && id !== 'NOTE'))] as string[];
      listingIds.forEach((id) => allListingIds.add(id));
      const nameMap: Record<string, string> = {};
      if (listingIds.length) {
        const { data: ls } = await supabase.from('listings').select('listing_id, name').in('listing_id', listingIds);
        (ls ?? []).forEach((l: any) => { nameMap[l.listing_id] = l.name; });
      }
      (items ?? []).forEach((i: any) => {
        const isNote = i.listing_id == null || i.listing_id === 'NOTE';
        (itemsByTrip[i.trip_id] ??= []).push({
          name: isNote ? (i.notes ?? 'Note') : nameMap[i.listing_id] ?? i.listing_id,
          listing_id: isNote ? null : i.listing_id,
          planned_date: i.planned_date ?? null,
          isNote,
        });
      });
    }

    // Which listings has this user reviewed?
    const reviewedSet = new Set<string>();
    if (allListingIds.size) {
      const { data: revs } = await supabase
        .from('reviews')
        .select('listing_id')
        .eq('user_id', uid)
        .in('listing_id', [...allListingIds]);
      (revs ?? []).forEach((r: any) => reviewedSet.add(r.listing_id));
    }

    setTrips(
      rows.map((r) => {
        const items = itemsByTrip[r.trip_id] ?? [];
        const placeIds = [...new Set(items.filter((it) => it.listing_id).map((it) => it.listing_id as string))];
        return {
          trip_id: r.trip_id,
          trip_name: r.trip_name ?? null,
          start_date: r.start_date ?? null,
          end_date: r.end_date ?? null,
          status: r.status ?? null,
          items,
          placesCount: placeIds.length,
          reviewedCount: placeIds.filter((id) => reviewedSet.has(id)).length,
        };
      })
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
      <main className="min-h-screen bg-slate-50 flex items-center justify-center pb-16 page-enter">
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

  const needsReview = (t: TripRow) => getTripStatus(t) === 'finished' && t.placesCount > 0 && t.reviewedCount < t.placesCount;
  const fullyReviewed = (t: TripRow) => getTripStatus(t) === 'finished' && t.placesCount > 0 && t.reviewedCount >= t.placesCount;

  // Active first → finished needing review → fully reviewed (gray) last
  const sortedTrips = [...trips].sort((a, b) => {
    const rank = (t: TripRow) => (getTripStatus(t) !== 'finished' ? 0 : needsReview(t) ? 1 : 2);
    return rank(a) - rank(b) || (b.start_date ?? '').localeCompare(a.start_date ?? '');
  });

  const activeTrips = trips.filter((t) => getTripStatus(t) !== 'finished');
  const finishedTrips = trips.filter((t) => getTripStatus(t) === 'finished');
  const pendingBookings = bookings.filter((b) => (b.status ?? 'pending') === 'pending');
  const pendingReviews = trips.filter(needsReview).length;

  const filteredTrips = sortedTrips.filter((t) => tripFilter === 'all' || getTripStatus(t) === tripFilter);
  const filterCount = (f: typeof tripFilter) =>
    f === 'all' ? trips.length : trips.filter((t) => getTripStatus(t) === f).length;

  const tabCls = (on: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition ${
      on ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

  const filterCls = (on: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
      on ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
    }`;

  return (
    <main className="min-h-screen bg-slate-50 pb-16 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">My trips & bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Everything you've planned, booked, and reviewed — in one place.</p>
          </div>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
            ← Back to dashboard
          </Link>
        </div>

        {/* Review alert */}
        {pendingReviews > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-400 text-white flex items-center justify-center shrink-0 shadow-sm">
              <StarIcon className="w-5 h-5" />
            </span>
            <p className="flex-1 text-sm font-medium text-amber-800">
              {pendingReviews} finished trip{pendingReviews === 1 ? '' : 's'} still need{pendingReviews === 1 ? 's' : ''} reviews — tap "Review trip" below to rate the places you visited.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8 opacity-0 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <StatTile label="Active trips" value={String(activeTrips.length)} accent="blue" />
          <StatTile label="Finished trips" value={String(finishedTrips.length)} accent="slate" />
          <StatTile label="Bookings" value={String(bookings.length)} accent="emerald" />
          <StatTile label="Awaiting reply" value={String(pendingBookings.length)} accent="amber" />
          <StatTile label="To review" value={String(pendingReviews)} accent={pendingReviews > 0 ? 'amber' : 'slate'} />
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
            <>
              <div className="flex flex-wrap gap-2 mb-5">
                {(['all', 'upcoming', 'ongoing', 'finished'] as const).map((f) => (
                  <button key={f} type="button" onClick={() => setTripFilter(f)} className={filterCls(tripFilter === f)}>
                    {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({filterCount(f)})
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                {filteredTrips.map((t) => {
                  const st = getTripStatus(t);
                  const nr = needsReview(t);
                  const fr = fullyReviewed(t);
                  const progress = t.placesCount > 0 ? Math.round((t.reviewedCount / t.placesCount) * 100) : 0;
                  const placeItems = t.items.filter((it) => !it.isNote);
                  return (
                    <div
                      key={t.trip_id}
                      className={`border rounded-2xl p-5 shadow-sm transition flex flex-col ${
                        fr
                          ? 'border-slate-200 bg-slate-50/80 opacity-70 saturate-[.75] hover:opacity-90'
                          : 'bg-white border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className={`font-semibold truncate ${fr ? 'text-slate-500' : 'text-slate-900'}`}>{t.trip_name ?? `Trip ${t.trip_id}`}</p>
                        {tripChip(st)}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{fmtDate(t.start_date)} → {fmtDate(t.end_date)}</p>

                      <div className="mt-3 flex-1">
                        {placeItems.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {placeItems.slice(0, 3).map((it, i) => (
                              <span key={i} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs truncate max-w-[10rem]">
                                {it.name}
                              </span>
                            ))}
                            {placeItems.length > 3 && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">+{placeItems.length - 3} more</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">No places saved yet.</p>
                        )}
                      </div>

                      {/* Review progress for finished trips */}
                      {st === 'finished' && t.placesCount > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
                            <span>Reviews</span>
                            <span>{t.reviewedCount}/{t.placesCount}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${fr ? 'bg-emerald-500' : 'bg-amber-500'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-400">
                          {placeItems.length} place{placeItems.length === 1 ? '' : 's'}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {nr && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Needs review
                            </span>
                          )}
                          {fr && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                              <CheckIcon className="w-3 h-3" />
                              Reviewed
                            </span>
                          )}
                          {nr ? (
                            <Link
                              href={`/my-trips/${t.trip_id}/review`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition shadow-sm"
                            >
                              <StarIcon className="w-3.5 h-3.5" />
                              Review trip
                            </Link>
                          ) : (
                            <Link href={`/?trip=${t.trip_id}`} className="text-xs font-medium text-blue-600 hover:text-blue-700">
                              Open in planner →
                            </Link>
                          )}
                        </div>
                      </div>

                      {nr && (
                        <Link href={`/?trip=${t.trip_id}`} className="mt-2 text-[11px] font-medium text-slate-500 hover:text-slate-700">
                          Or open in planner
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              {filteredTrips.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
                  <p className="text-sm text-slate-500">No trips match this filter.</p>
                </div>
              )}
            </>
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