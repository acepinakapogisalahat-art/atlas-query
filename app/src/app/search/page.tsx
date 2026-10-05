// app/src/app/search/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { logSearch } from '@/utils/supabase/searchlog';

type ListingRow = {
  listing_id: string;
  name: string;
  listing_type: string;
  description: string | null;
  image_url: string | null;
  average_rating: number | null;
  destination_name: string;
  region_country: string;
};

const TABS = ['All', 'Attractions', 'Hotels', 'Restaurants'];

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

function CardImage({ listing }: { listing: ListingRow }) {
  const [failed, setFailed] = useState(false);
  const usable = !!listing.image_url && !failed;
  return usable ? (
    <img
      src={listing.image_url!}
      alt={listing.name}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-100 to-slate-200">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {listing.listing_type}
      </span>
    </div>
  );
}

export default function SearchPage() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('All');
  const [rows, setRows] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data: session } = await supabase.auth.getSession();
      const authId = session.session?.user?.id ?? null;
      if (authId) {
        const { data: profile } = await supabase
          .from('app_users')
          .select('user_id')
          .eq('auth_user_id', authId)
          .maybeSingle();
        setUserId(profile?.user_id ?? null);
      }
    }
    loadUser();
  }, []);

  async function runSearch(keyword: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc('search_listings', { keyword: keyword.trim() });
    if (!error && Array.isArray(data)) {
      const results = data as ListingRow[];
      setRows(results);
      await logSearch(supabase, userId, keyword, results.length, tab === 'All' ? null : tab.replace(/s$/, ''));
    }
    setLoading(false);
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? '';
    setQuery(q);
    runSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible =
    tab === 'All' ? rows : rows.filter((r) => r.listing_type === tab.replace(/s$/, ''));

  const chip = (active: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border transition ${
      active
        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
        : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800'
    }`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-2">Discover Destinations</h1>
        <p className="text-sm text-slate-500 mb-8">
          Search places, cities, or countries — even with typos like "jaan" for Japan.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="mb-8 flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Where to? Try "Kyoto" or "Palawan"'
              className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition shadow-sm disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={chip(tab === t)}>
              {t}
            </button>
          ))}
          <span className="ml-auto text-sm text-slate-400">
            {visible.length} result{visible.length === 1 ? '' : 's'}
          </span>
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
            <p className="text-slate-500 mb-4">No listings found for "{query}"</p>
            <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 underline">
              Back to Discover
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}