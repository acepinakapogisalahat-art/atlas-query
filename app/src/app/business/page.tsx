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
  listing_name?: string;
  listing_image?: string | null;
};

type ReviewRow = {
  review_id: string;
  user_id: string;
  listing_id: string;
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-5 h-5'}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function SectionHeader({ title, helper }: { title: string; helper?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {helper && <span className="text-sm text-slate-500">{helper}</span>}
    </div>
  );
}

function StatTile({ label, value, icon, trend }: { label: string; value: string; icon?: React.ReactNode; trend?: string }) {
  return (
    <div className="card-hover p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          {icon}
        </div>
        {trend && (
          <span className="badge-green">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11l4-4 4 4M6 7v10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {trend}
          </span>
        )}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

function statusChip(status: string | null) {
  const s = status ?? 'pending';
  if (s === 'confirmed') return <span className="badge-green">Confirmed</span>;
  if (s === 'rejected') return <span className="badge-red">Rejected</span>;
  if (s === 'cancelled') return <span className="badge-slate">Cancelled</span>;
  return <span className="badge-amber">Pending</span>;
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
      const { data: bk } = await supabase
        .from('bookings').select('*').in('listing_id', ids).order('booking_id', { ascending: false });
      const rows = (bk ?? []) as BookingRow[];
      
      // Enrich with booker names and listing details
      const uids = [...new Set(rows.map((b) => b.user_id))];
      if (uids.length) {
        const { data: us } = await supabase.from('app_users').select('user_id, name').in('user_id', uids);
        const nm: Record<string, string> = {};
        (us ?? []).forEach((u: any) => { nm[u.user_id] = u.name; });
        rows.forEach((b) => { b.booker_name = nm[b.user_id] ?? 'Traveler'; });
      }
      
      const lm: Record<string, { name: string; image_url: string | null }> = {};
      own.forEach((l) => { lm[l.listing_id] = { name: l.name, image_url: l.image_url }; });
      rows.forEach((b) => {
        b.listing_name = lm[b.listing_id]?.name;
        b.listing_image = lm[b.listing_id]?.image_url;
      });
      
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

    const { data: appRows } = await supabase
      .from('business_applications').select('*').eq('user_id', uid).limit(1);
    setApplication((appRows ?? [])[0] ?? null);

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
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <p className="mt-4 text-sm text-slate-500">Loading your business dashboard…</p>
        </div>
      </main>
    );
  }

  if (!role.authId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="card p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Business hub</h1>
          <p className="text-slate-500 text-sm">
            <Link href="/login" className="text-blue-600 underline hover:text-blue-700">Sign in</Link> to manage your listings, bookings, and reviews.
          </p>
        </div>
      </main>
    );
  }

  const isManager = role.isOwner || role.isAdmin;

  if (!isManager) {
    const appStatus = application?.status ?? null;
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="card p-8 max-w-md text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            {appStatus === 'pending' ? 'Application under review' : 'Publisher access required'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {appStatus === 'pending'
              ? 'Your business owner application is being reviewed. You will get full business tools once approved.'
              : appStatus === 'rejected'
                ? 'Your previous application was not approved. You may submit a new application with updated details.'
                : 'The business hub is for approved business owners. Apply to list your place on TravelMate.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {appStatus !== 'pending' && (
              <Link href="/apply" className="btn-primary">
                {appStatus === 'rejected' ? 'Reapply now' : 'Apply now'}
              </Link>
            )}
            <Link href="/" className="btn-secondary">
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Business hub</h1>
            <p className="mt-1 text-sm text-slate-500">
              {role.isAdmin
                ? 'Platform-wide bookings, reviews, and listing performance'
                : 'Bookings, reviews, and performance across your listings'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {role.isAdmin ? (
              <span className="badge bg-slate-900 text-white">
                Administrator · platform-wide view
              </span>
            ) : (
              <span className="badge-blue">
                Approved publisher{role.ownerId ? ` · ${role.ownerId}` : ''}
              </span>
            )}
            <Link
              href={role.isAdmin ? '/admin' : '/owner'}
              className="btn-primary"
            >
              {role.isAdmin ? 'Admin manager' : 'Manage listings'}
            </Link>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatTile 
            label="Active listings" 
            value={String(listings.length)} 
            icon={<Store className="w-6 h-6" />} 
          />
          <StatTile
            label="Average rating"
            value={avgAll != null ? avgAll.toFixed(1) : '—'}
            icon={avgAll != null ? <Star className="w-6 h-6 text-amber-500" filled /> : <Star className="w-6 h-6" />}
          />
          <StatTile 
            label="Total reviews" 
            value={String(reviewCount)}
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>}
          />
          <StatTile 
            label="Pending requests" 
            value={String(pending.length)} 
            icon={<Calendar className="w-6 h-6" />}
          />
        </div>

        {/* Bookings | Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 items-start">
          <section className="card p-6">
            <SectionHeader 
              title="Booking requests" 
              helper={`${confirmed.length} confirmed · ${pending.length} pending`} 
            />
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-500">
                  No booking requests yet. They appear here when travelers request dates.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div key={b.booking_id} className="card-hover p-4">
                    <div className="flex gap-4">
                      <div className="shrink-0">
                        {b.listing_image ? (
                          <img src={b.listing_image} alt="" className="w-20 h-20 rounded-xl object-cover" />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center">
                            <Store className="w-8 h-8 text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{b.listing_name ?? b.listing_id}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {b.booker_name ?? 'Traveler'} · {b.guests ?? 1} guest{(b.guests ?? 1) === 1 ? '' : 's'}
                            </p>
                          </div>
                          {statusChip(b.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <span>{fmtDate(b.check_in)} → {fmtDate(b.check_out)}</span>
                        </div>
                        {b.special_requests && (
                          <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 line-clamp-2">
                            "{b.special_requests}"
                          </p>
                        )}
                        {(b.status ?? 'pending') === 'pending' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              type="button"
                              onClick={() => decide(b.booking_id, 'confirmed')}
                              disabled={busyId === b.booking_id}
                              className="btn-primary flex-1"
                            >
                              <Check className="w-4 h-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => decide(b.booking_id, 'rejected')}
                              disabled={busyId === b.booking_id}
                              className="btn-secondary flex-1"
                            >
                              <Close className="w-4 h-4" />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card p-6">
            <SectionHeader title="Recent reviews" helper={`${reviewCount} total`} />
            {reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-500">
                  No reviews yet on your listings.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.review_id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 text-sm">{r.user_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          on {listingMap.get(r.listing_id)?.name ?? r.listing_id} · {fmtDate(r.submission_date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-4 h-4 text-amber-500" filled />
                        <span className="text-sm font-bold text-slate-900">{Number(r.rating).toFixed(1)}</span>
                      </div>
                    </div>
                    {r.title && <p className="font-medium text-slate-800 text-sm mb-1">{r.title}</p>}
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{r.review_text}</p>
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
            <div className="card p-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No listings yet</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Publish your first place to start receiving bookings and reviews.
              </p>
              <Link href="/owner" className="btn-primary">
                Publish a listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l) => (
                <div key={l.listing_id} className="card-hover overflow-hidden">
                  <div className="relative h-40 bg-slate-200">
                    {l.image_url ? (
                      <img src={l.image_url} alt="" className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                        <span className="text-sm font-semibold uppercase tracking-wider text-slate-400">{l.listing_type}</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 badge bg-white/95 text-slate-700 backdrop-blur-sm shadow-sm">
                      {l.listing_type}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 mb-3 truncate">{l.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
                      <span className="flex items-center gap-1 font-semibold text-amber-600">
                        <Star className="w-4 h-4" filled />
                        {l.average_rating != null ? Number(l.average_rating).toFixed(1) : 'New'}
                      </span>
                      <span>{reviewCounts[l.listing_id] ?? 0} reviews</span>
                      <span>{bookingsByListing[l.listing_id] ?? 0} bookings</span>
                    </div>
                    <Link
                      href={`/listing/${l.listing_id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                    >
                      View public page
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
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