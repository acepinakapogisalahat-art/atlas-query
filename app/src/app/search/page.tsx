// app/src/app/search/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

type Listing = {
  listing_id: string;
  name: string;
  listing_type: string;
  description: string;
  image_url: string;
  average_rating: number;
  destination: { destination_name: string; region_country: string };
};

export default function SearchPage() {
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

    async function handleSearch(e?: React.FormEvent, term?: string) {
    if (e) e.preventDefault();
    setLoading(true);
    const keyword = (term ?? query).trim();

    let q = supabase
      .from('listings')
      .select('*, destination:destination_id(destination_name, region_country)');

    if (keyword) {
      q = q.or(`name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const { data, error } = await q.limit(40);
    if (!error && data) {
      setListings(data as Listing[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q') ?? '';
    if (q) setQuery(q);
    handleSearch(undefined, q);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Discover Destinations</h1>
        
        <form onSubmit={handleSearch} className="mb-8 flex gap-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for 'Kyoto', 'Hotel', 'Beach'..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.listing_id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition">
              <div className="h-48 bg-gray-200 flex items-center justify-center text-gray-400">
                {listing.image_url ? (
                  <img src={listing.image_url} alt={listing.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">🏔️</span>
                )}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {listing.listing_type}
                  </span>
                  {listing.average_rating && (
                    <span className="text-sm font-medium text-yellow-600">
                      ⭐ {listing.average_rating}
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{listing.name}</h3>
                <p className="text-sm text-gray-500 mb-3">
                  📍 {listing.destination?.destination_name}, {listing.destination?.region_country}
                </p>
                <p className="text-sm text-gray-600 line-clamp-2">{listing.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {listings.length === 0 && !loading && (
          <p className="text-center text-gray-500 mt-10">No listings found. Try a different search!</p>
        )}
      </div>
    </main>
  );
}