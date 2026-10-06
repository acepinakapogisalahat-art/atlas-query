// app/src/components/SmartSearch.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

type ListingHit = {
  listing_id: string;
  name: string;
  listing_type: string;
  destination_name: string;
  region_country: string;
  average_rating: number | null;
};

type DestHit = { destination_name: string; region_country: string };

type Item =
  | { kind: 'dest'; dest: DestHit }
  | { kind: 'listing'; listing: ListingHit };

function MapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M12 21s-7-5.1-7-11a7 7 0 1114 0c0 5.9-7 11-7 11z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export default function SmartSearch({
  placeholder = 'Search places, cities, countries…',
  initialValue = '',
}: {
  placeholder?: string;
  initialValue?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState(initialValue);
  const [dests, setDests] = useState<DestHit[]>([]);
  const [listings, setListings] = useState<ListingHit[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);
  const cacheRef = useRef<Map<string, { dests: DestHit[]; listings: ListingHit[] }>>(new Map());
  // Dropdown may ONLY open from real typing, never from mount/initialValue/navigation
  const typedRef = useRef(false);

  const items: Item[] = [
    ...dests.map((d) => ({ kind: 'dest' as const, dest: d })),
    ...listings.map((l) => ({ kind: 'listing' as const, listing: l })),
  ];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const kw = query.trim();
    if (kw.length < 2) {
      setDests([]);
      setListings([]);
      setOpen(false);
      setActive(-1);
      return;
    }
    const kwLower = kw.toLowerCase();

    const cached = cacheRef.current.get(kwLower);
    if (cached) {
      setDests(cached.dests);
      setListings(cached.listings);
      setActive(-1);
      if (typedRef.current) setOpen(true);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_listings', { keyword: kw });
      if (error) {
        console.error('search_listings error:', error);
        setListings([]);
        setDests([]);
        if (typedRef.current) setOpen(true);
        return;
      }
      const rows = (data ?? []) as ListingHit[];

      const seen = new Set<string>();
      const destHits: DestHit[] = [];
      for (const r of rows) {
        const dn = r.destination_name;
        if (!dn || seen.has(dn)) continue;
        const hay = `${dn} ${r.region_country}`.toLowerCase();
        if (hay.includes(kwLower)) {
          seen.add(dn);
          destHits.push({ destination_name: dn, region_country: r.region_country });
        }
        if (destHits.length >= 3) break;
      }

      const listingHits = rows.slice(0, 6);
      cacheRef.current.set(kwLower, { dests: destHits, listings: listingHits });
      setDests(destHits);
      setListings(listingHits);
      setActive(-1);
      if (typedRef.current) setOpen(true);
    }, 150);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function blurInput() {
    const input = containerRef.current?.querySelector('input');
    if (input) input.blur();
  }

  function choose(item: Item) {
    setOpen(false);
    typedRef.current = false;
    blurInput();
    if (item.kind === 'dest') {
      setQuery(item.dest.destination_name);
      router.push(`/search?q=${encodeURIComponent(item.dest.destination_name)}`);
    } else {
      router.push(`/listing/${item.listing.listing_id}`);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      if (open && active >= 0 && items[active]) {
        e.preventDefault();
        choose(items[active]);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  let lastKind: string | null = null;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            setOpen(false);
            typedRef.current = false;
            blurInput();
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }
        }}
        className="relative"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            typedRef.current = true; // real human typing
            setQuery(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onFocus={() => items.length > 0 && setOpen(true)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          className="w-full pl-12 pr-5 py-3 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition shadow-sm"
        />
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
          {items.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500 text-center">
              No matches for "{query}" — press Enter to search everything.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {items.map((item, i) => {
                const header =
                  item.kind !== lastKind ? (item.kind === 'dest' ? 'Destinations' : 'Places') : null;
                lastKind = item.kind;
                return (
                  <div key={`${item.kind}-${i}`}>
                    {header && (
                      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        {header}
                      </p>
                    )}
                    <button
                      onClick={() => choose(item)}
                      onMouseEnter={() => setActive(i)}
                      className={`w-full px-4 py-3 text-left transition border-b border-slate-100 last:border-0 ${
                        i === active ? 'bg-blue-50/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {item.kind === 'dest' ? (
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <MapIcon className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{item.dest.destination_name}</p>
                            <p className="text-xs text-slate-400 truncate">{item.dest.region_country}</p>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700">
                            Destination
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                            <PinIcon className="w-4 h-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 truncate">{item.listing.name}</p>
                            <p className="text-xs text-slate-400 truncate">
                              {item.listing.destination_name}, {item.listing.region_country}
                            </p>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600">
                            {item.listing.listing_type}
                          </span>
                          {item.listing.average_rating != null && (
                            <span className="shrink-0 text-sm font-semibold text-amber-600">
                              ★ {Number(item.listing.average_rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          {items.length > 0 && (
            <p className="px-4 py-2 text-[11px] text-slate-400 bg-slate-50 border-t border-slate-100">
              ↑ ↓ to navigate · Enter to open · Enter in empty box searches all
            </p>
          )}
        </div>
      )}
    </div>
  );
}