// app/src/app/search/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

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

const TYPE_EMOJI: Record<string, string> = {
  Attraction: '🏔️',
  Hotel: '🏨',
  Restaurant: '🍽️',
};

const TABS = ['All', 'Attractions', 'Hotels', 'Restaurants'];

function CardImage({ listing }: { listing: ListingRow }) {
  const [failed, setFailed] = useState(false);
  const usable = listing.image_url && !listing.image_url.startsWith('/img/') && !failed;
  return usable ? (
    <img
      src={listing.image_url!}
      alt={listing.name}
      onError={() => setFailed(true)}
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100">
      <span className="text-5xl">{TYPE_EMOJI[listing.listing_type] ?? '📍'}</span>
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
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

  async function runSearch(keyword: string) {
    setLoading(true);
    const { data, error } = await supabase.rpc('search_listings', { keyword: keyword.trim() });
    if (!error && Array.isArray(data)) setRows(data as ListingRow[]);
    setLoading(false);
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? '';
    setQuery(q);
    runSearch(q);
  }, []);

  const visible =
    tab === 'All' ? rows : rows.filter((r) => r.listing_type === tab.replace(/s$/, ''));

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Discover Destinations</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="mb-6 flex gap-4"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places, cities, countries… try 'Kyoto', 'Japan', even 'jaan'"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                tab === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
              }`}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto self-center text-sm text-gray-500">
            {visible.length} result{visible.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((listing) => (
            <Link
              key={listing.listing_id}
              href={`/listing/${listing.listing_id}`}
              className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition block"
            >
              <div className="h-48 bg-gray-200">
                <CardImage listing={listing} />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {listing.listing_type}
                  </span>
                  {listing.average_rating != null && (
                    <span className="text-sm font-medium text-yellow-600">
                      ★ {Number(listing.average_rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  📍 {listing.destination_name}, {listing.region_country}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {visible.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-10">No listings found. Try a different keyword!</p>
        )}
      </div>
    </main>
  );
}