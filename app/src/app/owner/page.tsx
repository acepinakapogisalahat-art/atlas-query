// app/src/app/owner/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

type ListingRow = { listing_id: string; name: string; listing_type: string; destination_id: string; description: string | null; address: string | null; image_url: string | null };
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
const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm';
const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1';

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

  useEffect(() => {
    if (!role.loading && role.isOwner) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.loading, role.isOwner]);

  async function load() {
    const [{ data: mine }, { data: dests }] = await Promise.all([
      supabase.from('listings').select('*').eq('uploaded_by', role.userId).order('listing_id'),
      supabase.from('destinations').select('*'),
    ]);
    setListings((mine ?? []) as ListingRow[]);
    setDestinations(dests ?? []);
    const map: Record<string, string> = {};
    (dests ?? []).forEach((d: any) => { map[d.destination_id] = `${d.destination_name} — ${d.region_country}`; });
    setDestNames(map);
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

  if (role.loading) return <main className="p-8 text-center">Checking role…</main>;
  if (!role.authId) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Publishers only</h1>
          <p className="text-gray-500"><Link href="/login" className="text-blue-600 underline">Sign in</Link> to manage your listings.</p>
        </div>
      </main>
    );
  }
  if (!role.isOwner) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white border border-amber-200 rounded-xl p-8 max-w-md text-center">
          <p className="text-4xl mb-3">📝</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Not a publisher yet</h1>
          <p className="text-sm text-gray-600 mb-4">
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
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
            <p className="text-sm text-gray-500">
              Process 5 – scoped publisher dashboard · {role.ownerId} · BR-026: you manage only your own listings
            </p>
          </div>
          <Link href="/" className="text-sm text-blue-600 underline">Back to Discover</Link>
        </div>

        {msg && <p className="bg-green-50 text-green-700 border border-green-200 rounded-lg px-4 py-3 text-sm mb-4">{msg}</p>}
        {err && <p className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-4 py-3 text-sm mb-4">{err}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-white border border-gray-200 rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editing ? `Edit ${form.listing_id}` : 'Publish a listing'}
            </h2>

            <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg mb-4">
              <button type="button" disabled={editing}
                onClick={() => { setMode('new'); setForm({ ...form, destination_id: '' }); }}
                className={`py-2 text-sm rounded-md transition ${
                  mode === 'new' && !editing ? 'bg-white shadow text-purple-700 font-medium' : 'text-gray-600 hover:text-gray-900'
                } ${editing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                + New place
              </button>
              <button type="button" onClick={() => setMode('existing')}
                className={`py-2 text-sm rounded-md transition ${
                  mode === 'existing' ? 'bg-white shadow text-purple-700 font-medium' : 'text-gray-600 hover:text-gray-900'
                }`}>
                Existing place
              </button>
            </div>

            <form onSubmit={publish} className="space-y-3">
              {!editing && mode === 'new' && (
                <div className="p-3 border border-purple-200 bg-purple-50 rounded-lg space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-700">New destination</p>
                  <input value={destForm.name} onChange={(e) => setDestForm({ ...destForm, name: e.target.value })}
                    placeholder="Destination name (e.g. Vigan)" className={inputCls} />
                  <input value={destForm.region} onChange={(e) => setDestForm({ ...destForm, region: e.target.value })}
                    placeholder="Region (Country), e.g. Ilocos Sur (Philippines)" className={inputCls} />
                </div>
              )}

              {mode === 'existing' && (
                <div>
                  <p className={labelCls}>Destination (BR-012)</p>
                  <div className="space-y-1 max-h-44 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
                    {destinations.map((d) => (
                      <label key={d.destination_id}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm ${
                          form.destination_id === d.destination_id
                            ? 'bg-purple-100 text-purple-900 font-medium'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}>
                        <input type="radio" name="owner-destination"
                          checked={form.destination_id === d.destination_id}
                          onChange={() => setForm({ ...form, destination_id: d.destination_id })}
                          className="accent-purple-600" />
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
                <p className={labelCls}>Listing name</p>
                <input value={form.name} onChange={set('name')} placeholder="e.g. Harbor View Inn" className={inputCls} required />
              </div>
              <div>
                <p className={labelCls}>Description</p>
                <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What makes this place worth visiting?" className={inputCls} />
              </div>
              <div>
                <p className={labelCls}>Address</p>
                <input value={form.address} onChange={set('address')} placeholder="Street, city" className={inputCls} />
              </div>
              {form.listing_type === 'Attraction' && (
                <>
                  <div>
                    <p className={labelCls}>Activity name</p>
                    <input value={form.activity_name} onChange={set('activity_name')} placeholder="e.g. Heritage walk" className={inputCls} />
                  </div>
                  <div>
                    <p className={labelCls}>Coordinates</p>
                    <input value={form.coordinates} onChange={set('coordinates')} placeholder="e.g. 17.57N, 120.38E" className={inputCls} />
                  </div>
                </>
              )}
              {form.listing_type === 'Hotel' && (
                <div>
                  <p className={labelCls}>Star rating</p>
                  <input value={form.star_rating} onChange={set('star_rating')} placeholder="e.g. 4-star" className={inputCls} />
                </div>
              )}
              {form.listing_type === 'Restaurant' && (
                <div>
                  <p className={labelCls}>Cuisine type</p>
                  <input value={form.cuisine_type} onChange={set('cuisine_type')} placeholder="e.g. Ilocano" className={inputCls} />
                </div>
              )}
              {!editing && (
                <div>
                  <p className={labelCls}>Cover photo</p>
                  <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                    className="block w-full text-sm text-gray-500 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer" />
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={busy}
                  className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-60">
                  {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish listing'}
                </button>
                {editing && (
                  <button type="button" onClick={() => { setEditing(false); setForm(EMPTY); setMode('new'); }}
                    className="px-4 py-3 border border-gray-300 rounded-lg text-sm">Cancel</button>
                )}
              </div>
            </form>
          </section>

          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">My listings ({listings.length})</h2>
            {listings.length === 0 && <p className="text-sm text-gray-500">You haven't published anything yet.</p>}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Destination</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {listings.map((l) => (
                    <tr key={l.listing_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-xs">{l.listing_id}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{l.name}</td>
                      <td className="px-3 py-2">{l.listing_type}</td>
                      <td className="px-3 py-2 text-gray-500">{destNames[l.destination_id] ?? l.destination_id}</td>
                      <td className="px-3 py-2 text-right space-x-2 whitespace-nowrap">
                        <Link href={`/listing/${l.listing_id}`} className="text-gray-500 hover:underline">View</Link>
                        <button onClick={() => startEdit(l)} className="text-blue-600 hover:underline">Edit</button>
                        <button onClick={() => remove(l.listing_id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}