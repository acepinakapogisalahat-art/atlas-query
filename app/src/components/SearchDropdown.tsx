// app/src/components/SearchDropdown.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

function Clock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-5 h-5'}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
    </svg>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" strokeLinecap="round" />
    </svg>
  );
}

type Suggestion = {
  type: 'recent' | 'place' | 'listing';
  label: string;
  subtitle?: string;
};

export default function SearchDropdown({
  query,
  onQueryChange,
  onSubmit,
  userId,
  placeholder = 'Where to? Try "Kyoto" or "Palawan"',
}: {
  query: string;
  onQueryChange: (v: string) => void;
  onSubmit: (q: string) => void;
  userId: string | null;
  placeholder?: string;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlighted, setHighlighted] = useState(-1);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<any>(null);

  // Load recent searches (per user) once on mount
  useEffect(() => {
    async function loadRecent() {
      if (!userId) {
        setRecent([]);
        return;
      }
      const { data } = await supabase
        .from('search_logs')
        .select('keywords')
        .eq('user_id', userId)
        .order('log_id', { ascending: false })
        .limit(20);
      const seen = new Set<string>();
      const out: string[] = [];
      (data ?? []).forEach((r: any) => {
        const k = String(r.keywords ?? '').trim();
        if (k && !seen.has(k) && out.length < 5) {
          seen.add(k);
          out.push(k);
        }
      });
      setRecent(out);
    }
    loadRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Debounced suggestions fetch
  useEffect(() => {
    if (!open) {
      setSuggestions([]);
      setHighlighted(-1);
      return;
    }
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const pattern = `%${q}%`;
      const [{ data: dests }, { data: listings }] = await Promise.all([
        supabase.from('destinations').select('destination_name, region_country').ilike('destination_name', pattern).limit(4),
        supabase.from('listings').select('name, listing_type').ilike('name', pattern).limit(4),
      ]);
      const seen = new Set<string>();
      const out: Suggestion[] = [];
      (dests ?? []).forEach((d: any) => {
        const name = String(d.destination_name ?? '').trim();
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          out.push({ type: 'place', label: name, subtitle: d.region_country ?? 'Destination' });
        }
      });
      (listings ?? []).forEach((l: any) => {
        const name = String(l.name ?? '').trim();
        if (name && !seen.has(name.toLowerCase()) && out.length < 6) {
          seen.add(name.toLowerCase());
          out.push({ type: 'listing', label: name, subtitle: l.listing_type ?? 'Listing' });
        }
      });
      setSuggestions(out);
      setHighlighted(-1);
      setLoading(false);
    }, 180);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  // Click-outside close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Build visible items list based on query state
  const visible: { kind: 'header' | 'item'; label?: string; icon?: React.ReactNode; subtitle?: string; value?: string }[] = [];
  const q = query.trim();

  if (q.length < 2) {
    if (recent.length > 0) {
      visible.push({ kind: 'header', label: 'Recent searches' });
      recent.forEach((k) => visible.push({ kind: 'item', icon: <Clock />, label: k, value: k }));
    }
  } else {
    if (loading) {
      visible.push({ kind: 'header', label: 'Searching…' });
    } else if (suggestions.length === 0) {
      visible.push({ kind: 'item', icon: <SearchIcon />, label: `No matches for "${q}"`, subtitle: 'Press Enter to search anyway' });
    } else {
      visible.push({ kind: 'header', label: 'Suggestions' });
      suggestions.forEach((s) =>
        visible.push({
          kind: 'item',
          icon: s.type === 'place' ? <Pin /> : <Sparkle />,
          label: s.label,
          subtitle: s.subtitle,
          value: s.label,
        })
      );
    }
  }

  const selectableIndices = visible
    .map((v, i) => (v.kind === 'item' && v.value ? i : -1))
    .filter((i) => i >= 0);

  function selectValue(val: string) {
    onQueryChange(val);
    setOpen(false);
    setTimeout(() => onSubmit(val), 10);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const curPos = selectableIndices.indexOf(highlighted);
      const next = curPos + 1 < selectableIndices.length ? curPos + 1 : 0;
      setHighlighted(selectableIndices[next]);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const curPos = selectableIndices.indexOf(highlighted);
      const next = curPos - 1 >= 0 ? curPos - 1 : selectableIndices.length - 1;
      setHighlighted(selectableIndices[next]);
    } else if (e.key === 'Enter') {
      if (highlighted >= 0) {
        const item = visible[highlighted];
        if (item.kind === 'item' && item.value) {
          e.preventDefault();
          selectValue(item.value);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex-1">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKey}
          maxLength={100}
          placeholder={placeholder}
          className="w-full pl-12 pr-5 py-3.5 rounded-xl border border-slate-300 bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition shadow-sm"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
      </div>

      {open && visible.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-40"
          role="listbox"
        >
          <div className="py-2 max-h-80 overflow-y-auto">
            {visible.map((v, i) => {
              if (v.kind === 'header') {
                return (
                  <div
                    key={`h-${i}`}
                    className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {v.label}
                  </div>
                );
              }
              const isHighlighted = i === highlighted;
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => v.value && selectValue(v.value)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition ${
                    isHighlighted ? 'bg-slate-50' : 'hover:bg-slate-50'
                  } ${!v.value ? 'cursor-default' : ''}`}
                >
                  <span className={`shrink-0 ${v.value ? 'text-slate-400' : 'text-slate-300'}`}>{v.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm truncate ${v.value ? 'text-slate-800' : 'text-slate-400'}`}>
                      {v.label}
                    </span>
                    {v.subtitle && (
                      <span className="block text-xs text-slate-400 truncate">{v.subtitle}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="px-4 py-2 text-[11px] text-slate-400 border-t border-slate-100 bg-slate-50/50">
            ↑ ↓ to navigate · Enter to select · Esc to close
          </div>
        </div>
      )}
    </div>
  );
}