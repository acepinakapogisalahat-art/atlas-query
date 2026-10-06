// app/src/app/business/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type OwnListing = {
  listing_id: string;
  name: string;
  listing_type: string;
  image_url: string | null;
  average_rating: number | null;
};

type BookingRow = {
  booking_id: string;
  listing_id: string;
  user_id: string;
  check_in: string | null;
  check_out: string | null;
  guests: number | null;
  special_requests: string | null;
  status: string | null;
  booker_name?: string;
};

type ReviewRow = {
  review_id: string;
  listing_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  submission_date: string | null;
  user_name?: string;
};

function Star({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Close({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function Store({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-5 h-5'}>
      <path d="M4 10v10h16V10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 6l1.5-3h15L21 6c0 1.7-1.3 3-3 3s-3-1.3-3-3c0 1.7-1.3 3-3 3S9 7.7 9 6c0 1.7-1.3 3-3 3S3 7.7 3 6z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 20v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Calendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeader({ title, helper }: { title: string; helper?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-4">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {helper && <span className="text-xs text-slate-400">{helper}</span>}
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
      <p className="text-lg font-semibold text-slate-900 flex items-center justify-center gap-1.5">
        {icon}
        {value}
      </p>
    </div>
  );
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function statusChip(status: string | null) {
  const s = status ?? 'pending';
  const cls =
    s === 'confirmed'
      ? 'bg-emerald-50 text-emerald-700'
      : s === 'rejected'
        ? 'bg-rose-50 text-rose-700'
        : s === 'cancelled'
          ? 'bg-slate-100 text-slate-600'
          : 'bg-amber-50 text-amber-700';
  return <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${cls}`}>{s}</span>;
}

export default function BusinessPage() {
  const supabase = createClient();
  const role = useRole();
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<OwnListing[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [application, setApplication] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!role.loading && role.userId) load(role.userId, role.isAdmin);
    if (!role.loading && !role.userId) setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.userId, role.isAdmin]);

  async function load(uid: string, admin: boolean) {
    let lsQuery = supabase
      .from('listings')
      .select('listing_id, name, listing_type, image_url, average_rating');
    if (!admin) lsQuery = lsQuery.eq('uploaded_by', uid);
    const { data: ls } = await lsQuery;
    const own = (ls ?? []) as OwnListing[];
    setListings(own);
    const ids = own.map((l) => l.listing_id);

    if (ids.length) {
      const { data: bk, error: bkErr } = await supabase
        .from('bookings').select('*').in('listing_id', ids).order('booking_id', { ascending: false });
      if (bkErr) console.error('bookings error:', bkErr);
      const rows = (bk ?? []) as BookingRow[];
      const uids = [...new Set(rows.map((b) => b.user_id))];
      if (uids.length) {
        const { data: us } = await supabase.from('app_users').select('user_id, name').in('user_id', uids);
        const nm: Record<string, string> = {};
        (us ?? []).forEach((u: any) => { nm[u.user_id] = u.name; });
        rows.forEach((b) => { b.booker_name = nm[b.user_id] ?? 'Traveler'; });
      }
      setBookings(rows);

      const { data: rv } = await supabase
        .from('reviews').select('*').in('listing_id', ids).order('submission_date', { ascending: false });
      const revs = (rv ?? []) as ReviewRow[];
      setReviewCount(revs.length);
      const counts: Record<string, number> = {};
      revs.forEach((r) => { counts[r.listing_id] = (counts[r.listing_id] ?? 0) + 1; });
      setReviewCounts(counts);
      const ruids = [...new Set(revs.map((r) => r.user_id))];
      if (ruids.length) {
        const { data: us2 } = await supabase.from('app_users').select('user_id, name').in('user_id', ruids);
        const nm2: Record<string, string> = {};
        (us2 ?? []).forEach((u: any) => { nm2[u.user_id] = u.name; });
        revs.forEach((r) => { r.user_name = nm2[r.user_id] ?? 'TravelMate user'; });
      }
      setReviews(revs.slice(0, 6));
    }

    const { data: appRows, error: appErr } = await supabase
      .from('business_applications').select('*').eq('user_id', uid).limit(1);
    if (!appErr) setApplication((appRows ?? [])[0] ?? null);

    setLoading(false);
  }

  async function decide(bookingId: string, status: 'confirmed' | 'rejected') {
    setBusyId(bookingId);
    const { error } = await supabase.from('bookings').update({ status }).eq('booking_id', bookingId);
    if (!error && role.userId) await load(role.userId, role.isAdmin);
    setBusyId(null);
  }

  if (role.loading || loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading your business…</p>
      </main>
    );
  }

  if (!role.authId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">Business hub</h1>
          <p className="text-slate-500 text-sm">
            <Link href="/login" className="text-blue-600 underline">Sign in</Link> to manage your listings, bookings, and reviews.
          </p>
        </div>
      </main>
    );
  }

  if (!role.isOwner) {
    const appStatus = application?.status ?? null;
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">
            {appStatus === 'pending' ? 'Application under review' : 'Publisher access required'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {appStatus === 'pending'
              ? 'Your business owner application is being reviewed by our administrators. You will get full business tools once approved.'
              : appStatus === 'rejected'
                ? 'Your previous application was not approved. You may submit a new application with updated details.'
                : 'The business hub is for approved business owners. Apply to list your place on TravelMate.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {appStatus !== 'pending' && (
              <Link href="/apply" className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm">
                {appStatus === 'rejected' ? 'Reapply now' : 'Apply now'}
              </Link>
            )}
            <Link href="/" className="px-6 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 transition">
              Back to Discover
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const listingMap = new Map(listings.map((l) => [l.listing_id, l]));
  const pending = bookings.filter((b) => (b.status ?? 'pending') === 'pending');
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const bookingsByListing: Record<string, number> = {};
  bookings.forEach((b) => { bookingsByListing[b.listing_id] = (bookingsByListing[b.listing_id] ?? 0) + 1; });
  const rated = listings.map((l) => l.average_rating).filter((v): v is number => v != null);
  const avgAll = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Business hub</h1>
            <p className="mt-1 text-sm text-slate-500">
              {role.isAdmin
                ? 'Platform-wide bookings, reviews, and listing performance.'
                : 'Bookings, reviews, and performance across your listings.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role.isAdmin ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-900 text-white">
                Administrator · platform-wide view
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                Approved publisher{role.ownerId ? ` · ${role.ownerId}` : ''}
              </span>
            )}
            <Link
              href={role.isAdmin ? '/admin' : '/owner'}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
            >
              {role.isAdmin ? 'Admin manager' : 'Manage listings'}
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatTile label="Active listings" value={String(listings.length)} icon={<Store className="w-5 h-5 text-slate-400" />} />
          <StatTile
            label="Average rating"
            value={avgAll != null ? avgAll.toFixed(1) : '—'}
            icon={avgAll != null ? <Star className="w-5 h-5 text-amber-500" filled /> : undefined}
          />
          <StatTile label="Total reviews" value={String(reviewCount)} />
          <StatTile label="Pending requests" value={String(pending.length)} icon={<Calendar className="w-5 h-5 text-amber-500" />} />
        </div>

        {/* Bookings | Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 items-start">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Booking requests" helper={`${confirmed.length} confirmed · ${pending.length} pending`} />
            {bookings.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-8 text-center">
                No booking requests yet — they appear here the moment travelers request dates.
              </p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.booking_id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">
                          {listingMap.get(b.listing_id)?.name ?? b.listing_id}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {b.booker_name ?? 'Traveler'} · {b.guests ?? 1} guest{(b.guests ?? 1) === 1 ? '' : 's'}
                        </p>
                      </div>
                      {statusChip(b.status)}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {fmtDate(b.check_in)} → {fmtDate(b.check_out)}
                    </p>
                    {b.special_requests && (
                      <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
                        "{b.special_requests}"
                      </p>
                    )}
                    {(b.status ?? 'pending') === 'pending' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => decide(b.booking_id, 'confirmed')}
                          disabled={busyId === b.booking_id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition disabled:opacity-60"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => decide(b.booking_id, 'rejected')}
                          disabled={busyId === b.booking_id}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:border-rose-300 hover:text-rose-700 transition disabled:opacity-60"
                        >
                          <Close className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Recent reviews" helper={`${reviewCount} total`} />
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl px-4 py-8 text-center">
                No reviews yet on your listings.
              </p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.review_id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 text-sm truncate">{r.user_name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          on {listingMap.get(r.listing_id)?.name ?? r.listing_id} · {fmtDate(r.submission_date)}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 shrink-0 text-sm font-semibold text-amber-600">
                        <Star className="w-4 h-4" filled />
                        {Number(r.rating).toFixed(1)}
                      </span>
                    </div>
                    {r.title && <p className="mt-2 text-sm font-medium text-slate-800">{r.title}</p>}
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed line-clamp-3">{r.review_text}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Listing performance */}
        <section>
          <SectionHeader title="Your listings" helper={`${listings.length} live`} />
          {listings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 shadow-sm text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Store className="w-7 h-7" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No listings yet</h3>
              <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                Publish your first place to start receiving bookings and reviews.
              </p>
              <Link
                href="/owner"
                className="inline-block mt-6 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition shadow-sm"
              >
                Publish a listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div key={l.listing_id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="relative h-32 bg-slate-200">
                    {l.image_url ? (
                      <img src={l.image_url} alt="" className="w-full h-32 object-cover" />
                    ) : (
                      <div className="w-full h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{l.listing_type}</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/90 text-slate-700">
                      {l.listing_type}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-slate-900 truncate">{l.name}</p>
                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-3.5 h-3.5" filled />
                        {l.average_rating != null ? Number(l.average_rating).toFixed(1) : 'New'}
                      </span>
                      <span>{reviewCounts[l.listing_id] ?? 0} reviews</span>
                      <span>{bookingsByListing[l.listing_id] ?? 0} bookings</span>
                    </div>
                    <Link
                      href={`/listing/${l.listing_id}`}
                      className="mt-3 inline-block text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      View public page →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}