// app/src/app/search/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { logSearch } from '@/utils/supabase/searchlog';
import SmartSearch from '@/components/SmartSearch';

type ListingRow = {
  listing_id: string;
  name: string;
  listing_type: string;
  description: string | null;
  image_url: string | null;
  average_rating: number | null;
  destination_name: string;
  region_country: string;
  budget_tier: string | null;
  activity_tag: string | null;
};

const TABS = ['All', 'Attractions', 'Hotels', 'Restaurants'];

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function CardImage({ listing }: { listing: ListingRow }) {
  const [failed, setFailed] = useState(false);
  const usable = !!listing.image_url && !failed;
  return usable ? (
    <img src={listing.image_url!} alt={listing.name} onError={() => setFailed(true)} className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{listing.listing_type}</span>
    </div>
  );
}

export default function SearchPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const q = (searchParams.get('q') ?? '').trim();
  const [tab, setTab] = useState('All');
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function run() {
      setLoading(true);
      const { data: session } = await supabase.auth.getSession();
      const authId = session.session?.user?.id ?? null;
      let uid: string | null = null;
      if (authId) {
        const { data: profile } = await supabase
          .from('app_users')
          .select('user_id')
          .eq('auth_user_id', authId)
          .maybeSingle();
        uid = profile?.user_id ?? null;
      }
      const { data, error } = await supabase.rpc('search_listings', { keyword: q });
      if (error) console.error('search_listings error:', error);
      const results = !error && Array.isArray(data) ? (data as ListingRow[]) : [];
      setRows(results);
      setLoading(false);
      if (q) logSearch(supabase, uid, q, results.length, null);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const typeParam = searchParams.get('type');
  const budgetParam = searchParams.get('budget');
  const activityParam = searchParams.get('activity');

  useEffect(() => {
    if (typeParam === 'Attraction') setTab('Attractions');
    else if (typeParam === 'Hotel') setTab('Hotels');
    else if (typeParam === 'Restaurant') setTab('Restaurants');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeParam]);

  const visible = rows
    .filter((r) => tab === 'All' || r.listing_type === tab.replace(/s$/, ''))
    .filter((r) => !budgetParam || r.budget_tier === budgetParam)
    .filter((r) => !activityParam || r.activity_tag === activityParam);

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition ${
      active
        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              {q ? `Results for "${q}"` : 'Discover destinations'}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {loading ? 'Searching…' : `${visible.length} place${visible.length === 1 ? '' : 's'} found`}
            </p>
          </div>
        </div>

        <div className="flex justify-start mb-8">
          <SmartSearch initialValue={q} placeholder='Refine your search — try "Japan" or "beach"' />
        </div>

        {(budgetParam || activityParam) && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Filters</span>
            {budgetParam && <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{budgetParam}</span>}
            {activityParam && <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{activityParam}</span>}
            <Link href={`/search?q=${encodeURIComponent(q)}`} className="text-xs font-medium text-blue-600 hover:text-blue-700 underline">
              Clear filters
            </Link>
          </div>
               )}

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={chip(tab === t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((listing) => (
            <Link
              key={listing.listing_id}
              href={`/listing/${listing.listing_id}`}
              className="group bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 transition block"
            >
              <div className="h-48 bg-slate-200 relative">
                <CardImage listing={listing} />
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/90 text-slate-700">
                  {listing.listing_type}
                </span>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700 transition">{listing.name}</h3>
                  {listing.average_rating != null && (
                    <span className="flex items-center gap-1 text-sm font-semibold text-amber-600">
                      <Star className="w-4 h-4" />
                      {Number(listing.average_rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  {listing.destination_name}, {listing.region_country}
                </p>
                <p className="text-sm text-slate-600 line-clamp-2">{listing.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {visible.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-slate-500 mb-4">{q ? `No listings found for "${q}"` : 'Start by searching a place or country.'}</p>
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">
              Back to Discover
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}