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
  user_id: string;
  user_name?: string;
};

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

  const emoji = listing.listing_type === 'Attraction' ? '🏔️' : listing.listing_type === 'Hotel' ? '🏨' : '🍽️';

  return (
    <main className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="text-sm text-blue-600 hover:underline mb-4">
          ← Back to results
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {listing.listing_type}
            </span>
            <h1 className="text-4xl font-bold text-gray-900 mt-2">{listing.name}</h1>
            <p className="text-gray-600 mt-1">
              📍 {listing.address}
              {destination ? `, ${destination.destination_name}, ${destination.region_country}` : ''}
            </p>
            {subtypeDetails?.coordinates && (
              <p className="text-xs text-gray-400 mt-1">{subtypeDetails.coordinates}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition">
              + Add to trip
            </button>
            <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition shadow-sm">
              Book now
            </button>
          </div>
        </div>

        <div className="mb-10">
          {displayPhotos.slice(0, 1).map((photo) => (
            <div
              key={photo.photo_id ?? 'main'}
              className="h-72 md:h-96 rounded-xl overflow-hidden relative bg-gray-200"
            >
              <SafeImg src={photo.photo_url} alt={photo.caption ?? listing.name} emoji={emoji} />
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">About this place</h2>
              <p className="text-gray-600 leading-relaxed">{listing.description}</p>
            </section>

            <section className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Listing Details</h2>
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
                  value={listing.average_rating != null ? `${Number(listing.average_rating).toFixed(1)} ★` : 'Not rated yet'}
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-20">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-gray-900">
                  {listing.average_rating != null ? Number(listing.average_rating).toFixed(1) : '—'}
                </span>
                <span className="text-yellow-500 text-xl">★</span>
                <span className="text-sm text-gray-500">
                  ({reviews.length} review{reviews.length === 1 ? '' : 's'})
                </span>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {reviews.length === 0 && <p className="text-sm text-gray-500">No reviews yet — be the first!</p>}
                {reviews.map((review) => (
                  <div key={review.review_id} className="border-b border-gray-100 pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{review.user_name || 'TravelMate user'}</p>
                        <p className="text-xs text-gray-500">
                          Visited {review.visit_date ? new Date(review.visit_date).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                      <span className="text-yellow-500 text-sm">
                        {'★'.repeat(Math.max(1, Math.min(5, review.rating)))}
                      </span>
                    </div>
                    {review.title && <p className="font-medium text-gray-800 text-sm mb-1">{review.title}</p>}
                    <p className="text-sm text-gray-600">{review.review_text}</p>
                    {review.helpful_votes_count != null && review.helpful_votes_count > 0 && (
                      <p className="text-xs text-gray-400 mt-2">👍 {review.helpful_votes_count} found this helpful</p>
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
      <p className="text-xs font-bold uppercase text-gray-400 mb-1">{label}</p>
      <p className="text-gray-800 font-medium">{value}</p>
    </div>
  );
}

function SafeImg({ src, alt, emoji }: { src: string; alt: string; emoji: string }) {
  const [failed, setFailed] = useState(false);
  const usable = !!src && !failed;
  return usable ? (
    <img src={src} alt={alt} onError={() => setFailed(true)} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      {emoji}
    </div>
  );
}

function ReviewForm({ listingId, onSubmitted }: { listingId: string; onSubmitted: () => void }) {
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [visitDate, setVisitDate] = useState('');
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

      const { error } = await supabase.from('reviews').insert({
        review_id: `REV-${Date.now().toString().slice(-8)}`,
        listing_id: listingId,
        user_id: userId,
        rating,
        title: title || null,
        review_text: text,
        visit_date: visitDate || null,
        submission_date: new Date().toISOString().slice(0, 10),
        helpful_votes_count: 0,
      });
      if (error) throw error;

      // Process 4: recalculate the public average score
      await supabase.rpc('recalc_listing_rating', { p_listing_id: listingId });

      setMsg('Review published — average rating recalculated.');
      setRating(0); setTitle(''); setText(''); setVisitDate('');
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
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Write a review</h2>
        <p className="text-sm text-gray-500">
          <a href="/login" className="text-blue-600 underline">Sign in</a> to share your experience at this place.
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Write a review</h2>
      {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{err}</p>}
      {msg && <p className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">{msg}</p>}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Your rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)}
                className={`text-2xl ${n <= rating ? 'text-yellow-500' : 'text-gray-300'} hover:scale-110 transition`}>
                ★
              </button>
            ))}
          </div>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        <textarea required value={text} onChange={(e) => setText(e.target.value)} rows={4}
          placeholder="What was your experience like?"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visit date (optional)</label>
          <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg" />
        </div>
        <button type="submit" disabled={busy}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60">
          {busy ? 'Publishing…' : 'Publish review'}
        </button>
      </form>
    </section>
  );
}