// app/src/app/listing/[listing_id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type Review = {
  review_id: string;
  rating: number;
  title: string | null;
  review_text: string | null;
  visit_date: string | null;
  helpful_votes_count: number | null;
  photo_url: string | null;
  user_id: string;
  user_name?: string;
};

type Trip = {
  trip_id: string;
  trip_name: string;
  start_date: string | null;
  end_date: string | null;
};

function Star({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function ChevronLeft({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? 'w-4 h-4'}>
      <path
        fillRule="evenodd"
        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.24a.75.75 0 010-1.08l4.5-4.24a.75.75 0 011.06.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Pin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M12 21s-7-5.1-7-11a7 7 0 1114 0c0 5.9-7 11-7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ThumbUp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-3.5 h-3.5'}>
      <path d="M7 10v11" strokeLinecap="round" />
      <path d="M7 10l4.2-6.6c.4-.6 1.3-.6 1.7 0 .2.3.3.7.2 1.1L12.6 8H18a2 2 0 012 2.4l-1.3 6.5A2 2 0 0116.7 19H7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Plus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-4 h-4'}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
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

function Camera({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="13.5" r="3.5" />
    </svg>
  );
}

function Close({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-5 h-5'}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-5 h-5'}>
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
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

function SafeImg({ src, alt, type }: { src: string | null; alt: string; type: string }) {
  const [failed, setFailed] = useState(false);
  const usable = !!src && !failed;
  return usable ? (
    <img src={src!} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
      <Camera className="w-6 h-6 text-slate-400" />
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{type}</span>
    </div>
  );
}

function DetailTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value}</p>
    </div>
  );
}

function fmtTimeShort(t: string) {
  const [h, m] = t.split(':');
  const hr = parseInt(h, 10);
  const ampm = hr >= 12 ? 'PM' : 'AM';
  const hr12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${hr12}:${m} ${ampm}`;
}

function fmtDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const role = useRole();
  const listingId = params.listing_id as string;

  // Hide traveler-only actions (book, add to trip, review) from owners/admins
  const isManager = role.isOwner || role.isAdmin;

  const [listing, setListing] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [subtypeDetails, setSubtypeDetails] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [showAddToTrip, setShowAddToTrip] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [inTripCount, setInTripCount] = useState(0);
  const [scheduleInfo, setScheduleInfo] = useState<{ open_time: string | null; close_time: string | null } | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    const t = setTimeout(() => window.scrollTo(0, 0), 50);
    return () => clearTimeout(t);
  }, [listingId]);

  useEffect(() => {
    async function load() {
      const { data: listingData } = await supabase
        .from('listings').select('*').eq('listing_id', listingId).maybeSingle();
      if (!listingData) { setLoading(false); return; }
      setListing(listingData);

      const { data: destData } = await supabase
        .from('destinations').select('*')
        .eq('destination_id', listingData.destination_id).maybeSingle();
      setDestination(destData);

      let subtypeTable = '';
      let subtypeIdCol = '';
      if (listingData.listing_type === 'Attraction') { subtypeTable = 'attractions'; subtypeIdCol = 'attraction_id'; }
      else if (listingData.listing_type === 'Hotel') { subtypeTable = 'hotels'; subtypeIdCol = 'hotel_id'; }
      else if (listingData.listing_type === 'Restaurant') { subtypeTable = 'restaurants'; subtypeIdCol = 'restaurant_id'; }
      if (subtypeTable) {
        const { data: sub } = await supabase
          .from(subtypeTable).select('*').eq(subtypeIdCol, listingId).maybeSingle();
        setSubtypeDetails(sub);
        if (sub?.schedule_id) {
          const { data: sch } = await supabase
            .from('schedules').select('open_time, close_time').eq('schedule_id', sub.schedule_id).maybeSingle();
          setScheduleInfo(sch ?? null);
        }
      }

      const { data: photosData } = await supabase
        .from('photos').select('*').eq('listing_id', listingId)
        .order('upload_date').limit(4);
      setPhotos(photosData || []);

      const { data: reviewsData } = await supabase
        .from('reviews').select('*').eq('listing_id', listingId)
        .order('submission_date', { ascending: false });
      const revs = (reviewsData || []) as Review[];
      const userIds = [...new Set(revs.map((r) => r.user_id))];
      const nameMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: users } = await supabase
          .from('app_users').select('user_id, name').in('user_id', userIds);
        (users || []).forEach((u: any) => { nameMap[u.user_id] = u.name; });
      }
      setReviews(revs.map((r) => ({ ...r, user_name: nameMap[r.user_id] })));

      const { data: session } = await supabase.auth.getSession();
      const authId = session.session?.user?.id;
      if (authId) {
        const { data: profile } = await supabase
          .from('app_users').select('user_id').eq('auth_user_id', authId).maybeSingle();
        const uid = profile?.user_id ?? null;
        setUserId(uid);
        if (uid) {
          const { data: myItems } = await supabase
            .from('trip_items')
            .select('trip_id, trip:trips(user_id)')
            .eq('listing_id', listingId);
          const mine = (myItems ?? []).filter((r: any) => r.trip?.user_id === uid);
          setInTripCount(new Set(mine.map((r: any) => r.trip_id)).size);
        }
      }

      setLoading(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId, refreshKey]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading listing…</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-5xl font-semibold tracking-tight text-slate-900">404</p>
          <h1 className="mt-3 text-xl font-semibold text-slate-900">Listing not found</h1>
          <p className="mt-2 text-sm text-slate-500">This place may have been removed or the link is incorrect.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/search" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
              Search places
            </Link>
            <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 transition">
              Go back
            </button>
          </div>
        </div>
      </main>
    );
  }

  const gallery = photos.length > 0
    ? photos
    : listing.image_url
      ? [{ photo_id: 'main', photo_url: listing.image_url, caption: 'Main image' }]
      : [];
  const safeIndex = Math.min(activePhoto, Math.max(gallery.length - 1, 0));
  const hero = gallery[safeIndex];
  const avg = listing.average_rating != null ? Number(listing.average_rating) : null;

  return (
    <main className="min-h-screen bg-slate-50 pb-16 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 transition mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to results
        </button>

        {/* Two-column header: info left, gallery right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start mb-10">
          {/* LEFT — info */}
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 mb-4">
              {listing.listing_type}
            </span>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900">{listing.name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
              <span className="flex items-center gap-1 font-semibold text-amber-600">
                <Star className="w-4 h-4" filled />
                {avg != null ? avg.toFixed(1) : 'New'}
              </span>
              <span className="text-slate-300">·</span>
              <span>{reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
              {destination && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1">
                    <Pin className="w-4 h-4 text-slate-400" />
                    {destination.destination_name}, {destination.region_country}
                  </span>
                </>
              )}
            </div>

            {listing.address && <p className="mt-3 text-sm text-slate-500">{listing.address}</p>}

            {subtypeDetails?.coordinates && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(subtypeDetails.coordinates)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600 hover:bg-slate-200 transition"
              >
                <Pin className="w-3.5 h-3.5" />
                Open in Google Maps
              </a>
            )}

            <p className="mt-5 text-slate-600 leading-relaxed line-clamp-4">
              {listing.description ?? 'No description provided yet.'}
            </p>

            {/* Quick facts */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Budget</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{listing.budget_tier || '—'}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Best for</p>
                <p className="text-sm font-medium text-slate-800 mt-0.5">{listing.activity_tag || '—'}</p>
              </div>
              {listing.listing_type === 'Attraction' && subtypeDetails && (
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Activity</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{subtypeDetails.activity_name || '—'}</p>
                </div>
              )}
              {listing.listing_type === 'Attraction' && (
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Open hours</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">
                    {scheduleInfo?.open_time && scheduleInfo?.close_time
                      ? `${fmtTimeShort(scheduleInfo.open_time)} – ${fmtTimeShort(scheduleInfo.close_time)}`
                      : 'Open daily'}
                  </p>
                </div>
              )}
              {listing.listing_type === 'Hotel' && subtypeDetails && (
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Star rating</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{subtypeDetails.star_rating || '—'}</p>
                </div>
              )}
              {listing.listing_type === 'Restaurant' && subtypeDetails && (
                <div className="bg-white border border-slate-200 rounded-xl p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cuisine</p>
                  <p className="text-sm font-medium text-slate-800 mt-0.5">{subtypeDetails.cuisine_type || '—'}</p>
                </div>
              )}
            </div>

            {/* Traveler actions — hidden for owners/admins */}
            {!isManager && (
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    if (!userId) router.push('/login');
                    else setShowAddToTrip(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40 transition shadow-sm"
                >
                  {inTripCount > 0 ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {inTripCount > 0 ? `In ${inTripCount} trip${inTripCount === 1 ? '' : 's'}` : 'Add to trip'}
                </button>
                <button
                  onClick={() => {
                    if (!userId) router.push('/login');
                    else setShowBooking(true);
                  }}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
                >
                  <Calendar className="w-4 h-4" />
                  Book now
                </button>
              </div>
            )}
          </div>

          {/* RIGHT — gallery */}
          <div>
            {gallery.length === 0 ? (
              <div className="h-80 md:h-[26rem] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col items-center justify-center gap-3">
                <Camera className="w-8 h-8 text-slate-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">No photos yet</span>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setLightbox(safeIndex)}
                  className="relative block w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 shadow-sm group"
                  aria-label="Open photo viewer"
                >
                  <SafeImg src={hero?.photo_url ?? null} alt={hero?.caption ?? listing.name} type={listing.listing_type} />
                  {hero?.caption && (
                    <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs p-4 text-left">
                      {hero.caption}
                    </span>
                  )}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/50 text-white text-[11px] font-medium backdrop-blur">
                    {safeIndex + 1} / {gallery.length}
                  </span>
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-medium backdrop-blur group-hover:bg-black/70 transition">
                    <Camera className="w-3.5 h-3.5" />
                    View full screen
                  </span>
                </button>

                {gallery.length > 1 && (
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {gallery.map((p, i) => (
                      <button
                        key={p.photo_id ?? i}
                        onClick={() => setActivePhoto(i)}
                        aria-label={`Show photo ${i + 1}`}
                        className={`aspect-[4/3] rounded-xl overflow-hidden border-2 transition ${
                          i === safeIndex ? 'border-blue-600 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <SafeImg src={p.photo_url} alt={`Photo ${i + 1}`} type={listing.listing_type} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* About | Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10 items-start">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
            <SectionHeader title="About this place" />
            <p className="text-slate-600 leading-relaxed">{listing.description ?? 'No description provided yet.'}</p>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm h-full">
            <SectionHeader title="Listing details" helper={listing.listing_type} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {listing.listing_type === 'Attraction' && subtypeDetails && (
                <>
                  <DetailTile label="Activity" value={subtypeDetails.activity_name || 'N/A'} />
                  <DetailTile
                    label="Open hours"
                    value={
                      scheduleInfo?.open_time && scheduleInfo?.close_time
                        ? `${fmtTimeShort(scheduleInfo.open_time)} – ${fmtTimeShort(scheduleInfo.close_time)} daily`
                        : 'Open daily'
                    }
                  />
                  <DetailTile label="Best for" value={listing.activity_tag || 'Culture & Food'} />
                </>
              )}
              {listing.listing_type === 'Hotel' && subtypeDetails && (
                <>
                  <DetailTile label="Star rating" value={subtypeDetails.star_rating || 'N/A'} />
                  <DetailTile label="Address" value={subtypeDetails.address || listing.address || 'N/A'} />
                </>
              )}
              {listing.listing_type === 'Restaurant' && subtypeDetails && (
                <>
                  <DetailTile label="Cuisine" value={subtypeDetails.cuisine_type || 'N/A'} />
                  <DetailTile label="Address" value={subtypeDetails.address || listing.address || 'N/A'} />
                </>
              )}
              {!subtypeDetails && <DetailTile label="Details" value="Coming soon" />}
            </div>
          </section>
        </div>

        {/* Write review | Reviews */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Review form — travelers only */}
          {!isManager ? (
            <ReviewForm listingId={listingId} onSubmitted={() => setRefreshKey((k) => k + 1)} />
          ) : (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <SectionHeader title="Write a review" helper="Manager view" />
              <p className="text-sm text-slate-500">
                Traveler actions (bookings, trip additions, reviews) are hidden for your role.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Link href="/business" className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition">
                  Open business hub
                </Link>
                {role.isAdmin && (
                  <Link href="/admin" className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 transition">
                    Admin manager
                  </Link>
                )}
              </div>
            </section>
          )}

          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <SectionHeader title="Reviews" helper={`${reviews.length} total`} />
            <div className="flex items-center gap-3 mb-5">
              <span className="text-4xl font-semibold tracking-tight text-slate-900">
                {avg != null ? avg.toFixed(1) : '—'}
              </span>
              <div>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className="w-4 h-4 text-amber-500" filled={avg != null && n <= Math.round(avg)} />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">Average from {reviews.length} traveler{reviews.length === 1 ? '' : 's'}</p>
              </div>
            </div>
            <div className="space-y-5 max-h-[560px] overflow-y-auto pr-2">
              {reviews.length === 0 && (
                <p className="text-sm text-slate-500">No reviews yet — be the first to share your experience.</p>
              )}
              {reviews.map((review) => (
                <div key={review.review_id} className="border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-9 h-9 shrink-0 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold flex items-center justify-center">
                        {(review.user_name ?? 'T').trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{review.user_name || 'TravelMate user'}</p>
                        <p className="text-xs text-slate-400">
                          Visited {review.visit_date ? new Date(review.visit_date).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="w-3.5 h-3.5 text-amber-500" filled={n <= review.rating} />
                      ))}
                    </div>
                  </div>
                  {review.title && <p className="font-medium text-slate-800 text-sm mb-1">{review.title}</p>}
                  <p className="text-sm text-slate-600 leading-relaxed">{review.review_text}</p>
                  {review.photo_url && (
                    <img
                      src={review.photo_url}
                      alt="Photo from this review"
                      className="mt-3 rounded-xl max-h-44 object-cover border border-slate-200"
                    />
                  )}
                  {review.helpful_votes_count != null && review.helpful_votes_count > 0 && (
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                      <ThumbUp className="w-3.5 h-3.5" />
                      {review.helpful_votes_count} found this helpful
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Add to Trip Modal — travelers only */}
      {!isManager && showAddToTrip && userId && (
        <AddToTripModal
          listingId={listingId}
          userId={userId}
          listingName={listing.name}
          onClose={() => setShowAddToTrip(false)}
          onSuccess={() => {
            setShowAddToTrip(false);
            setInTripCount((c) => c + 1);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Booking Modal — travelers only */}
      {!isManager && showBooking && userId && (
        <BookingModal
          listingId={listingId}
          userId={userId}
          listingName={listing.name}
          onClose={() => setShowBooking(false)}
          onSuccess={() => {
            setShowBooking(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      )}

      {/* Lightbox viewer */}
      {lightbox != null && gallery.length > 0 && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
            {lightbox + 1} / {gallery.length}
          </span>
          <button
            aria-label="Close viewer"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center"
          >
            <Close className="w-5 h-5" />
          </button>
          {gallery.length > 1 && (
            <>
              <button
                aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}
                className="absolute left-3 md:left-8 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}
                className="absolute right-3 md:right-8 w-11 h-11 rounded-full bg-white/10 text-white hover:bg-white/20 transition flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5 rotate-180" />
              </button>
            </>
          )}
          <div className="max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-900">
              <SafeImg src={gallery[lightbox]?.photo_url ?? null} alt={gallery[lightbox]?.caption ?? listing.name} type={listing.listing_type} />
            </div>
            {gallery[lightbox]?.caption && (
              <p className="text-center text-white/70 text-sm mt-3">{gallery[lightbox].caption}</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function AddToTripModal({
  listingId,
  userId,
  listingName,
  onClose,
  onSuccess,
}: {
  listingId: string;
  userId: string;
  listingName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [trips, setTrips] = useState<(Trip & { count: number; has: boolean })[]>([]);
  const [selected, setSelected] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('trips')
        .select('*, trip_items(trip_item_id, listing_id)')
        .eq('user_id', userId)
        .order('start_date', { ascending: false });
      setTrips(
        ((data ?? []) as any[]).map((t) => ({
          trip_id: t.trip_id,
          trip_name: t.trip_name ?? `Trip ${t.trip_id}`,
          start_date: t.start_date ?? null,
          end_date: t.end_date ?? null,
          count: (t.trip_items ?? []).length,
          has: (t.trip_items ?? []).some((i: any) => i.listing_id === listingId),
        }))
      );
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, listingId]);

  async function handleAdd() {
    setErr(null);
    setBusy(true);
    try {
      let tripId = selected;
      if (!tripId && showNew) {
        if (!newName.trim()) throw new Error('Give the new trip a name.');
        if (newStart && newEnd && newEnd < newStart) throw new Error('End date must be after the start date.');
        const { data: newId, error: idErr } = await supabase.rpc('new_trip_id');
        if (idErr) throw idErr;
        const { error: tripErr } = await supabase.from('trips').insert({
          trip_id: newId as string,
          user_id: userId,
          trip_name: newName.trim(),
          start_date: newStart || null,
          end_date: newEnd || null,
        });
        if (tripErr) throw tripErr;
        tripId = newId as string;
      }
      if (!tripId) throw new Error('Pick a trip or create a new one.');
      const { error } = await supabase.from('trip_items').insert({
        trip_item_id: `ITI-${Date.now().toString().slice(-8)}`,
        trip_id: tripId,
        listing_id: listingId,
        sequence_no: 999,
        planned_date: null,
        start_time: null,
        notes: null,
      });
      if (error) throw error;
      setDone(trips.find((t) => t.trip_id === tripId)?.trip_name ?? (newName.trim() || 'your trip'));
      setTimeout(onSuccess, 1200);
    } catch (e: any) {
      setErr(e?.message ?? 'Could not add to trip.');
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl max-h-[85vh] overflow-y-auto animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Add to trip</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <Close className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Added to {done}</h4>
            <p className="text-sm text-slate-500">Find it under your itinerary in the trip planner.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-4">
              Adding: <span className="font-medium text-slate-900">{listingName}</span>
            </p>
            {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">{err}</p>}

            {trips.length > 0 && (
              <div className="space-y-2 mb-4">
                {trips.map((t) => (
                  <button
                    key={t.trip_id}
                    type="button"
                    disabled={t.has}
                    onClick={() => { setSelected(t.trip_id); setShowNew(false); }}
                    className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                      selected === t.trip_id ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'
                    } ${t.has ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === t.trip_id ? 'border-blue-600' : 'border-slate-300'}`}>
                      {selected === t.trip_id && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">{t.trip_name}</p>
                      <p className="text-xs text-slate-400">
                        {fmtDate(t.start_date)} → {fmtDate(t.end_date)} · {t.count} place{t.count === 1 ? '' : 's'}
                      </p>
                    </div>
                    {t.has && <span className="shrink-0 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">Already added</span>}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => { setShowNew(!showNew); if (!showNew) setSelected(''); }}
              className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-blue-400 hover:text-blue-600 transition mb-4"
            >
              <Plus className="w-4 h-4" />
              {showNew ? 'Hide new trip form' : 'Create a new trip'}
            </button>

            {showNew && (
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Trip name</label>
                    <span className="text-xs text-slate-400">{newName.length}/100</span>
                  </div>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={100}
                    placeholder="e.g., Summer in La Union"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Start date</label>
                    <input type="date" value={newStart} max={newEnd || undefined} onChange={(e) => setNewStart(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">End date</label>
                    <input type="date" value={newEnd} min={newStart || undefined} onChange={(e) => setNewEnd(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 transition">
                Cancel
              </button>
              <button type="button" onClick={handleAdd} disabled={busy || (!selected && !(showNew && newName.trim()))}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60">
                {busy ? 'Adding…' : 'Add to trip'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BookingModal({
  listingId,
  userId,
  listingName,
  onClose,
  onSuccess,
}: {
  listingId: string;
  userId: string;
  listingName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [requests, setRequests] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleBook() {
    setErr(null);
    setBusy(true);
    try {
      if (!checkIn || !checkOut) throw new Error('Please select check-in and check-out dates.');
      if (new Date(checkOut) <= new Date(checkIn)) throw new Error('Check-out must be after check-in.');

      const { data: nextId, error: idErr } = await supabase.rpc('new_booking_id');
      if (idErr) throw idErr;

      const { error } = await supabase.from('bookings').insert({
        booking_id: nextId as string,
        listing_id: listingId,
        user_id: userId,
        check_in: checkIn,
        check_out: checkOut,
        guests,
        special_requests: requests.trim() || null,
        status: 'pending',
      });
      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (e: any) {
      setErr(e?.message ?? 'Could not submit booking.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Book now</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <Close className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Booking: <span className="font-medium text-slate-900">{listingName}</span></p>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">Booking request sent!</h4>
            <p className="text-sm text-slate-500">The owner will review your request and get back to you soon.</p>
          </div>
        ) : (
          <>
            {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">{err}</p>}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().slice(0, 10)}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Guests</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Special requests (optional)</label>
                <textarea
                  value={requests}
                  onChange={(e) => setRequests(e.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="e.g., Early check-in, specific room preference"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:border-slate-400 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={busy || !checkIn || !checkOut}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60"
              >
                {busy ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ReviewForm({ listingId, onSubmitted }: { listingId: string; onSubmitted: () => void }) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function who() {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id ?? null;
      if (uid) {
        const { data: profile } = await supabase
          .from('app_users').select('user_id').eq('auth_user_id', uid).maybeSingle();
        setUserId(profile?.user_id ?? null);
      }
      setChecked(true);
    }
    who();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!userId) { setErr('Please sign in to submit a review.'); return; }
    if (rating < 1) { setErr('Pick a star rating from 1 to 5.'); return; }
    setBusy(true);
    try {
      const { data: dup } = await supabase
        .from('reviews').select('review_id')
        .eq('listing_id', listingId).eq('user_id', userId).maybeSingle();
      if (dup) throw new Error('BR-011: You already reviewed this listing.');

      const reviewId = `REV-${Date.now().toString().slice(-8)}`;

      let photoUrl: string | null = null;
      if (photo) {
        const path = `reviews/${reviewId}/${Date.now()}-${photo.name}`;
        const { error: upErr } = await supabase.storage.from('Media').upload(path, photo);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('Media').getPublicUrl(path);
        photoUrl = pub.publicUrl;
      }

      const { error } = await supabase.from('reviews').insert({
        review_id: reviewId,
        listing_id: listingId,
        user_id: userId,
        rating,
        title: title || null,
        review_text: text,
        visit_date: visitDate || null,
        submission_date: new Date().toISOString().slice(0, 10),
        helpful_votes_count: 0,
        photo_url: photoUrl,
      });
      if (error) throw error;

      await supabase.rpc('recalc_listing_rating', { p_listing_id: listingId });

      setMsg('Review published — average rating recalculated.');
      setRating(0); setTitle(''); setText(''); setVisitDate(''); setPhoto(null);
      onSubmitted();
    } catch (e2: any) {
      setErr(e2?.message ?? 'Could not submit review.');
    } finally {
      setBusy(false);
    }
  }

  if (!checked) return null;
  if (!userId) {
    return (
      <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <SectionHeader title="Write a review" helper="Sign in required" />
        <p className="text-sm text-slate-500">
          <Link href="/login" className="text-blue-600 underline hover:text-blue-700">Sign in</Link> to share your experience at this place.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <SectionHeader title="Write a review" helper="One review per traveler (BR-011)" />
      {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">{err}</p>}
      {msg && <p className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm mb-4">{msg}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your rating</label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} stars`}
                className={`p-1.5 rounded-xl transition hover:scale-110 ${n <= rating ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-slate-400'}`}
              >
                <Star className="w-7 h-7" filled={n <= rating} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Title (optional)</label>
            <span className="text-xs text-slate-400">{title.length}/50</span>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={50}
            placeholder="A short headline"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
          />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Your review</label>
            <span className="text-xs text-slate-400">{text.length}/300</span>
          </div>
          <textarea
            required
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            maxLength={300}
            placeholder="What was your experience like? Would you recommend this place?"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Photo (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Visit date (optional)</label>
            <input
              type="date"
              value={visitDate}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60"
        >
          {busy ? 'Publishing…' : 'Publish review'}
        </button>
      </form>
    </section>
  );
}