// app/src/app/owner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type ListingRow = { listing_id: string; name: string; listing_type: string; destination_id: string; description: string | null; address: string | null; image_url: string | null; average_rating: number | null };
type DestRow = { destination_id: string; destination_name: string; region_country: string };

const PREFIX: Record<string, { p: string; pad: number }> = {
  Attraction: { p: 'ATTR-', pad: 3 },
  Hotel: { p: 'HTL0', pad: 2 },
  Restaurant: { p: 'RES0', pad: 2 },
};

function nextId(existing: string[], prefix: string, pad: number) {
  const nums = existing.filter((id) => id.startsWith(prefix)).map((id) => parseInt(id.slice(prefix.length), 10)).filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return prefix + String(next).padStart(pad, '0');
}

const EMPTY = { listing_id: '', destination_id: '', listing_type: 'Attraction', name: '', description: '', address: '', activity_name: '', coordinates: '', star_rating: '', cuisine_type: '' };
const inputCls = 'w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition';
const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

function StatTile({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">{label}</p>
      <p className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        {icon}
        {value}
      </p>
    </div>
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

function Star({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" className={className ?? 'w-4 h-4'}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.539-1.118l1.286-3.958a1 1 0 00-.363-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.958z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-5 h-5'}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-5 h-5'}>
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-3.5 h-3.5'}>
      <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-3.5 h-3.5'}>
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-3.5 h-3.5'}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function OwnerPage() {
  const supabase = createClient();
  const role = useRole();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [destinations, setDestinations] = useState<DestRow[]>([]);
  const [destNames, setDestNames] = useState<Record<string, string>>({});
  const [form, setForm] = useState<any>(EMPTY);
  const [photo, setPhoto] = useState<File | null>(null);
  const [editing, setEditing] = useState(false);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [destForm, setDestForm] = useState({ name: '', region: '' });
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Stats
  const [stats, setStats] = useState({ totalListings: 0, avgRating: 0, totalReviews: 0, pendingBookings: 0 });

  useEffect(() => {
    if (!role.loading && role.isOwner) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.isOwner]);

  async function load() {
    const [{ data: mine }, { data: dests }] = await Promise.all([
      supabase.from('listings').select('*').eq('uploaded_by', role.userId).order('listing_id'),
      supabase.from('destinations').select('*'),
    ]);
    const mineRows = (mine ?? []) as ListingRow[];
    setListings(mineRows);
    setDestinations(dests ?? []);
    const map: Record<string, string> = {};
    (dests ?? []).forEach((d: any) => { map[d.destination_id] = `${d.destination_name} — ${d.region_country}`; });
    setDestNames(map);

    // Stats
    const ids = mineRows.map((l) => l.listing_id);
    const rated = mineRows.map((l) => l.average_rating).filter((v): v is number => v != null);
    const avgRating = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;

    let totalReviews = 0;
    let pendingBookings = 0;
    if (ids.length) {
      const [{ count: revCount }, { count: bkCount }] = await Promise.all([
        supabase.from('reviews').select('review_id', { count: 'exact', head: true }).in('listing_id', ids),
        supabase.from('bookings').select('booking_id', { count: 'exact', head: true }).in('listing_id', ids).eq('status', 'pending'),
      ]);
      totalReviews = revCount ?? 0;
      pendingBookings = bkCount ?? 0;
    }
    setStats({ totalListings: mineRows.length, avgRating, totalReviews, pendingBookings });
  }

  async function reloadDestinations() {
    const { data: dests } = await supabase.from('destinations').select('*');
    setDestinations(dests ?? []);
    const map: Record<string, string> = {};
    (dests ?? []).forEach((d: any) => { map[d.destination_id] = `${d.destination_name} — ${d.region_country}`; });
    setDestNames(map);
  }

  const set = (f: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [f]: e.target.value });

  async function writeSubtype(id: string, type: string, isUpdate: boolean, destId: string) {
    if (type === 'Attraction') {
      const row = { attraction_id: id, destination_id: destId, activity_name: form.activity_name || form.name, coordinates: form.coordinates || null };
      const { error } = isUpdate ? await supabase.from('attractions').update(row).eq('attraction_id', id) : await supabase.from('attractions').insert(row);
      if (error) throw error;
    }
    if (type === 'Hotel') {
      const row = { hotel_id: id, destination_id: destId, hotel_name: form.name, star_rating: form.star_rating || null, address: form.address || null };
      const { error } = isUpdate ? await supabase.from('hotels').update(row).eq('hotel_id', id) : await supabase.from('hotels').insert(row);
      if (error) throw error;
    }
    if (type === 'Restaurant') {
      const row = { restaurant_id: id, destination_id: destId, restaurant_name: form.name, cuisine_type: form.cuisine_type || null, address: form.address || null };
      const { error } = isUpdate ? await supabase.from('restaurants').update(row).eq('restaurant_id', id) : await supabase.from('restaurants').insert(row);
      if (error) throw error;
    }
  }

  async function publish(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null); setBusy(true);
    try {
      if (!form.name.trim()) throw new Error('Listing name is required.');

      let destId = form.destination_id;
      if (!editing && mode === 'new') {
        if (!destForm.name.trim() || !destForm.region.trim()) {
          throw new Error('New place needs both a destination name and a region/country.');
        }
        destId = nextId(destinations.map((d) => d.destination_id), 'DEST-', 3);
        const { error: dErr } = await supabase.from('destinations').insert({
          destination_id: destId,
          destination_name: destForm.name.trim(),
          region_country: destForm.region.trim(),
        });
        if (dErr) throw dErr;
        await reloadDestinations();
      }
      if (!destId) throw new Error('Select a destination for this listing (BR-012).');

      const { p, pad } = PREFIX[form.listing_type];
      const listingId = editing ? form.listing_id : nextId(listings.map((l) => l.listing_id), p, pad);

      if (editing) {
        const { error } = await supabase.from('listings').update({
          name: form.name, description: form.description || null,
          address: form.address || null, destination_id: destId,
        }).eq('listing_id', listingId);
        if (error) throw error;
        await writeSubtype(listingId, form.listing_type, true, destId);
        setMsg(`Listing ${listingId} updated.`);
      } else {
        const { error } = await supabase.from('listings').insert({
          listing_id: listingId, destination_id: destId, listing_type: form.listing_type,
          name: form.name, description: form.description || null, address: form.address || null,
          average_rating: null, date_added: new Date().toISOString().slice(0, 10),
          uploaded_by: role.userId, // BR-026 ownership stamp
        });
        if (error) throw error;
        await writeSubtype(listingId, form.listing_type, false, destId);
        if (photo) {
          const path = `listings/${listingId}/${Date.now()}-${photo.name}`;
          const { error: upErr } = await supabase.storage.from('Media').upload(path, photo);
          if (upErr) throw upErr;
          const { data: pub } = supabase.storage.from('Media').getPublicUrl(path);
          await supabase.from('listings').update({ image_url: pub.publicUrl }).eq('listing_id', listingId);
          const { data: photoRows } = await supabase.from('photos').select('photo_id');
          const photoId = nextId((photoRows ?? []).map((r: any) => r.photo_id), 'PHT-', 3);
          await supabase.from('photos').insert({
            photo_id: photoId, listing_id: listingId, uploaded_by: role.userId,
            photo_url: pub.publicUrl, caption: form.name, upload_date: new Date().toISOString().slice(0, 10),
          });
        }
        setMsg(mode === 'new'
          ? `New place ${destId} created and listing ${listingId} published — live in search.`
          : `Listing ${listingId} published — live in search.`);
      }
      setForm(EMPTY); setPhoto(null); setEditing(false);
      setDestForm({ name: '', region: '' }); setMode('new');
      await load();
    } catch (e2: any) {
      setErr(e2?.message ?? 'Publish failed.');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm(`Delete listing ${id}? This cannot be undone.`)) return;
    setErr(null); setMsg(null);
    await supabase.from('photos').delete().eq('listing_id', id);
    const row = listings.find((l) => l.listing_id === id);
    if (row?.listing_type === 'Attraction') await supabase.from('attractions').delete().eq('attraction_id', id);
    if (row?.listing_type === 'Hotel') await supabase.from('hotels').delete().eq('hotel_id', id);
    if (row?.listing_type === 'Restaurant') await supabase.from('restaurants').delete().eq('restaurant_id', id);
    const { error } = await supabase.from('listings').delete().eq('listing_id', id);
    if (error) {
      setErr(`Delete blocked: reviews still reference ${id} (referential integrity).`);
      await load();
      return;
    }
    setMsg(`Listing ${id} deleted.`);
    await load();
  }

  function startEdit(l: ListingRow) {
    setEditing(true); setMode('existing'); setPhoto(null);
    setForm({ ...EMPTY, listing_id: l.listing_id, destination_id: l.destination_id, listing_type: l.listing_type, name: l.name, description: l.description ?? '', address: l.address ?? '' });
    setErr(null); setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (role.loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center pb-16 page-enter">
        <p className="text-sm text-slate-400">Checking role…</p>
      </main>
    );
  }
  if (!role.authId) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Publishers only</h1>
          <p className="text-slate-500 text-sm">
            <Link href="/login" className="text-blue-600 underline">Sign in</Link> to manage your listings.
          </p>
        </div>
      </main>
    );
  }
  if (!role.isOwner) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white border border-amber-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
          <p className="text-4xl mb-3">📝</p>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Not a publisher yet</h1>
          <p className="text-sm text-slate-600 mb-4">
            {role.application?.status === 'pending'
              ? `Your application ${role.application.application_id} is still under review.`
              : 'Apply to become an approved business owner to publish your own listings.'}
          </p>
          <Link href="/apply" className="text-blue-600 underline text-sm">Go to application</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16 page-enter">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Listings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Publisher dashboard · {role.ownerId} · BR-026 scoped to your own listings
            </p>
          </div>
          <Link href="/business" className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
            ← Business hub
          </Link>
        </div>

        {msg && (
          <p className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl px-4 py-3 text-sm mb-5 shadow-sm">
            {msg}
          </p>
        )}
        {err && (
          <p className="bg-red-50 text-red-700 border border-red-200 rounded-xl px-4 py-3 text-sm mb-5 shadow-sm">
            {err}
          </p>
        )}

        {/* Stats strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatTile label="Total listings" value={String(stats.totalListings)} icon={<Store className="w-5 h-5 text-slate-400" />} />
          <StatTile
            label="Average rating"
            value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—'}
            icon={stats.avgRating > 0 ? <Star className="w-5 h-5 text-amber-500" filled /> : undefined}
          />
          <StatTile label="Total reviews" value={String(stats.totalReviews)} icon={<MessageIcon className="w-5 h-5 text-slate-400" />} />
          <StatTile label="Pending bookings" value={String(stats.pendingBookings)} icon={<CalendarIcon className="w-5 h-5 text-amber-500" />} />
        </div>

        {/* Main grid: form (left) + listings (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* LEFT — publish/edit form */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm lg:sticky lg:top-6 animate-slide-up">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editing ? `Edit ${form.listing_id}` : 'Publish a listing'}
            </h2>

            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-5">
              <button
                type="button"
                disabled={editing}
                onClick={() => { setMode('new'); setForm({ ...form, destination_id: '' }); }}
                className={`py-2 text-sm rounded-lg transition ${
                  mode === 'new' && !editing ? 'bg-white shadow text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                } ${editing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                + New place
              </button>
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`py-2 text-sm rounded-lg transition ${
                  mode === 'existing' ? 'bg-white shadow text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Existing place
              </button>
            </div>

            <form onSubmit={publish} className="space-y-4">
              {!editing && mode === 'new' && (
                <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">New destination</p>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className={labelCls}>Name</p>
                      <span className="text-xs text-slate-400">{destForm.name.length}/100</span>
                    </div>
                    <input value={destForm.name} onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                      maxLength={100} placeholder="Destination name (e.g. Vigan)" className={inputCls} />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className={labelCls}>Region / Country</p>
                      <span className="text-xs text-slate-400">{destForm.region.length}/100</span>
                    </div>
                    <input value={destForm.region} onChange={(e) => setDestForm({ ...destForm, region: e.target.value })}
                      maxLength={100} placeholder="Ilocos Sur (Philippines)" className={inputCls} />
                  </div>
                </div>
              )}

              {mode === 'existing' && (
                <div>
                  <p className={labelCls}>Destination (BR-012)</p>
                  <div className="space-y-1 max-h-52 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                    {destinations.map((d) => (
                      <label key={d.destination_id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition ${
                          form.destination_id === d.destination_id
                            ? 'bg-blue-50 text-blue-900 font-semibold ring-1 ring-blue-200'
                            : 'hover:bg-white text-slate-700'
                        }`}>
                        <input type="radio" name="owner-destination"
                          checked={form.destination_id === d.destination_id}
                          onChange={() => setForm({ ...form, destination_id: d.destination_id })}
                          className="accent-blue-600" />
                        {d.destination_name} — {d.region_country}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className={labelCls}>Listing type</p>
                <select value={form.listing_type} onChange={set('listing_type')} className={inputCls} disabled={editing}>
                  <option value="Attraction">Attraction</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Restaurant">Restaurant</option>
                </select>
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className={labelCls}>Listing name</p>
                  <span className="text-xs text-slate-400">{form.name.length}/50</span>
                </div>
                <input value={form.name} onChange={set('name')} maxLength={50} placeholder="e.g. Harbor View Inn" className={inputCls} required />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className={labelCls}>Description</p>
                  <span className="text-xs text-slate-400">{form.description.length}/300</span>
                </div>
                <textarea value={form.description} onChange={set('description')} rows={3} maxLength={300} placeholder="What makes this place worth visiting?" className={inputCls} />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className={labelCls}>Address</p>
                  <span className="text-xs text-slate-400">{form.address.length}/150</span>
                </div>
                <input value={form.address} onChange={set('address')} maxLength={150} placeholder="Street, city" className={inputCls} />
              </div>
              {form.listing_type === 'Attraction' && (
                <>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className={labelCls}>Activity name</p>
                      <span className="text-xs text-slate-400">{form.activity_name.length}/100</span>
                    </div>
                    <input value={form.activity_name} onChange={set('activity_name')} maxLength={100} placeholder="e.g. Heritage walk" className={inputCls} />
                  </div>
                  <div>
                    <div className="flex items-baseline justify-between mb-1">
                      <p className={labelCls}>Coordinates</p>
                      <span className="text-xs text-slate-400">{form.coordinates.length}/50</span>
                    </div>
                    <input value={form.coordinates} onChange={set('coordinates')} maxLength={50} placeholder="e.g. 17.57N, 120.38E" className={inputCls} />
                  </div>
                </>
              )}
              {form.listing_type === 'Hotel' && (
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className={labelCls}>Star rating</p>
                    <span className="text-xs text-slate-400">{form.star_rating.length}/20</span>
                  </div>
                  <input value={form.star_rating} onChange={set('star_rating')} maxLength={20} placeholder="e.g. 4-Star" className={inputCls} />
                </div>
              )}
              {form.listing_type === 'Restaurant' && (
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <p className={labelCls}>Cuisine type</p>
                    <span className="text-xs text-slate-400">{form.cuisine_type.length}/50</span>
                  </div>
                  <input value={form.cuisine_type} onChange={set('cuisine_type')} maxLength={50} placeholder="e.g. Ilocano" className={inputCls} />
                </div>
              )}
              {!editing && (
                <div>
                  <p className={labelCls}>Cover photo</p>
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer file:font-medium" />
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={busy}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition disabled:opacity-60 shadow-sm">
                  {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
                </button>
                {editing && (
                  <button type="button" onClick={() => { setEditing(false); setForm(EMPTY); setMode('new'); }}
                    className="px-4 py-3 border border-slate-300 rounded-xl text-sm font-medium text-slate-700 hover:border-slate-400 transition">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* RIGHT — listings */}
          <section className="lg:col-span-2">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-xl font-bold text-slate-900">
                My listings
                <span className="ml-2 text-sm font-medium text-slate-400">({listings.length})</span>
              </h2>
            </div>

            {listings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Store className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">No listings yet</h3>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
                  Publish your first place using the form on the left. It will appear here and become visible to travelers on search.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-0 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
                {listings.map((l) => {
                  const rating = l.average_rating != null ? Number(l.average_rating) : null;
                  return (
                    <div key={l.listing_id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition group">
                      <div className="relative h-40 bg-slate-100">
                        {l.image_url ? (
                          <img src={l.image_url} alt={l.name} className="w-full h-40 object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-40 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                            <span className="text-2xl font-bold text-slate-400">{l.listing_type.charAt(0)}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-white/95 text-slate-700 shadow-sm">
                          {l.listing_type}
                        </span>
                        {rating != null && (
                          <span className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-semibold">
                            <Star className="w-3 h-3 text-amber-400" filled />
                            {rating.toFixed(1)}
                          </span>
                        )}
                        <span className="absolute bottom-2.5 left-2.5 text-[11px] font-mono text-white/80">
                          {l.listing_id}
                        </span>
                      </div>
                      <div className="p-4">
                        <p className="font-semibold text-slate-900 text-base truncate">{l.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">{destNames[l.destination_id] ?? l.destination_id}</p>
                        {l.description && (
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{l.description}</p>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                          <Link
                            href={`/listing/${l.listing_id}`}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition"
                          >
                            <EyeIcon />
                            View
                          </Link>
                          <button
                            onClick={() => startEdit(l)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-semibold hover:bg-blue-100 transition"
                          >
                            <EditIcon />
                            Edit
                          </button>
                          <button
                            onClick={() => remove(l.listing_id)}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition"
                            aria-label={`Delete ${l.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}