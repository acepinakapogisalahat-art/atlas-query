// app/src/app/listing/[listing_id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

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

function Star({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const listingId = params.listing_id as string;

  const [listing, setListing] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [subtypeDetails, setSubtypeDetails] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

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

      setLoading(false);
    }
    load();
  }, [listingId, refreshKey]);

  if (loading) return <div className="p-8 text-center">Loading listing...</div>;
  if (!listing) {
    return (
      <div className="p-8 text-center">
        Listing not found.{' '}
        <button onClick={() => router.back()} className="text-blue-600 underline">Go back</button>
      </div>
    );
  }

  const displayPhotos = photos.length > 0
    ? photos
    : [{ photo_id: 'main', photo_url: listing.image_url, caption: 'Main image' }];

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:text-blue-700 mb-6 flex items-center gap-1">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.24a.75.75 0 010-1.08l4.5-4.24a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
          Back to results
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 mb-3">
              {listing.listing_type}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{listing.name}</h1>
            <p className="text-slate-500 mt-2">
              {listing.address}
              {destination ? ` · ${destination.destination_name}, ${destination.region_country}` : ''}
            </p>
            {subtypeDetails?.coordinates && (
              <p className="text-xs text-slate-400 mt-1 font-mono">{subtypeDetails.coordinates}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700 transition">
              + Add to trip
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              Book now
            </button>
          </div>
        </div>

        <div className="mb-10">
          {displayPhotos.slice(0, 1).map((photo) => (
            <div
              key={photo.photo_id ?? 'main'}
              className="h-72 md:h-96 rounded-2xl overflow-hidden relative bg-slate-200 shadow-sm"
            >
              <SafeImg src={photo.photo_url} alt={photo.caption ?? listing.name} type={listing.listing_type} />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent text-white text-xs p-4">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-slate-900 mb-3">About this place</h2>
              <p className="text-slate-600 leading-relaxed">{listing.description}</p>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Listing Details</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {listing.listing_type === 'Attraction' && subtypeDetails && (
                  <>
                    <DetailRow label="Activity" value={subtypeDetails.activity_name || 'N/A'} />
                    <DetailRow label="Schedule" value={subtypeDetails.schedule_id || 'N/A'} />
                    <DetailRow label="Coordinates" value={subtypeDetails.coordinates || 'N/A'} />
                  </>
                )}
                {listing.listing_type === 'Hotel' && subtypeDetails && (
                  <>
                    <DetailRow label="Star Rating" value={subtypeDetails.star_rating || 'N/A'} />
                    <DetailRow label="Address" value={subtypeDetails.address || listing.address} />
                  </>
                )}
                {listing.listing_type === 'Restaurant' && subtypeDetails && (
                  <>
                    <DetailRow label="Cuisine" value={subtypeDetails.cuisine_type || 'N/A'} />
                    <DetailRow label="Address" value={subtypeDetails.address || listing.address} />
                  </>
                )}
                <DetailRow
                  label="Average Rating"
                  value={listing.average_rating != null ? `${Number(listing.average_rating).toFixed(1)} / 5` : 'Not rated yet'}
                />
                <DetailRow
                  label="Date Added"
                  value={listing.date_added ? new Date(listing.date_added).toLocaleDateString() : 'N/A'}
                />
              </div>
            </section>

            <ReviewForm listingId={listingId} onSubmitted={() => setRefreshKey((k) => k + 1)} />
          </div>

          <div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-20">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Reviews</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-slate-900">
                  {listing.average_rating != null ? Number(listing.average_rating).toFixed(1) : '—'}
                </span>
                <Star className="w-5 h-5 text-amber-500" filled />
                <span className="text-sm text-slate-500">
                  ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                </span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet — be the first!</p>}
                {reviews.map((review) => (
                  <div key={review.review_id} className="border-b border-slate-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-900 text-sm">{review.user_name || 'TravelMate user'}</p>
                        <p className="text-xs text-slate-400">
                          Visited {review.visit_date ? new Date(review.visit_date).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} className="w-3.5 h-3.5 text-amber-500" filled={n <= review.rating} />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-medium text-slate-800 text-sm mb-1">{review.title}</p>}
                    <p className="text-sm text-slate-600">{review.review_text}</p>
                    {review.photo_url && (
                      <img src={review.photo_url} alt="Photo from this review"
                        className="mt-2 rounded-lg max-h-44 object-cover border border-slate-200" />
                    )}
                    {review.helpful_votes_count != null && review.helpful_votes_count > 0 && (
                      <p className="text-xs text-slate-400 mt-2">{review.helpful_votes_count} found this helpful</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

function SafeImg({ src, alt, type }: { src: string; alt: string; type: string }) {
  const [failed, setFailed] = useState(false);
  const usable = !!src && !failed;
  return usable ? (
    <img src={src} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-gradient-to-br from-slate-100 to-slate-200">
      <span className="text-xs font-semibold uppercase tracking-wider">{type}</span>
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
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    if (!userId) { setErr('Please sign in to submit a review.'); return; }
    if (rating < 1) { setErr('Pick a star rating from 1 to 5.'); return; }
    setBusy(true);
    try {
      // BR-011: one review per user per listing
      const { data: dup } = await supabase
        .from('reviews').select('review_id')
        .eq('listing_id', listingId).eq('user_id', userId).maybeSingle();
      if (dup) throw new Error('BR-011: You already reviewed this listing.');

      const reviewId = `REV-${Date.now().toString().slice(-8)}`;

      // Optional review photo → Media/reviews/<review_id>/
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

      // Process 4: recalculate the public average score
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
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Write a review</h2>
        <p className="text-sm text-slate-500">
          <a href="/login" className="text-blue-600 underline hover:text-blue-700">Sign in</a> to share your experience at this place.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Write a review</h2>
      {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-4">{err}</p>}
      {msg && <p className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm mb-4">{msg}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Your rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}
                className={`text-2xl transition hover:scale-110 ${n <= rating ? 'text-amber-500' : 'text-slate-300'}`}>
                <Star className="w-6 h-6" filled={n <= rating} />
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Title (optional)</label>
            <span className="text-xs text-slate-400">{title.length}/50</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} placeholder="A short headline"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" />
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Your review</label>
            <span className="text-xs text-slate-400">{text.length}/300</span>
          </div>
          <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={300}
            placeholder="What was your experience like? Would you recommend this place?"
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Add a photo (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Visit date (optional)</label>
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-xl" />
        </div>
        <button type="submit" disabled={busy}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60">
          {busy ? 'Publishing…' : 'Publish review'}
        </button>
      </form>
    </section>
  );
}