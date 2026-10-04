// app/src/components/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const role = useRole();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    async function loadName() {
      if (!role.authId) { setDisplayName(null); return; }
            const { data: profile } = await supabase
        .from('app_users').select('name').eq('auth_user_id', role.authId).maybeSingle();
      if (profile?.name) {
        setDisplayName(profile.name);
      } else {
        const { data: sess } = await supabase.auth.getSession();
        setDisplayName(sess.session?.user?.email ?? null);
      }
    }
    loadName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role.authId]);

  if (pathname === '/login' || pathname === '/signup') return null;

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const initial = displayName ? displayName.trim().charAt(0).toUpperCase() : '?';

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </div>
          <span className="font-bold text-lg text-gray-900">TravelMate</span>
        </Link>

        <div className="flex items-center gap-5">
          <Link href="/" className="text-sm font-medium text-gray-700 hover:text-blue-600">Discover</Link>
          <Link href="/search" className="text-sm font-medium text-gray-700 hover:text-blue-600">Search</Link>
          {role.isOwner && (
            <Link href="/owner" className="text-sm font-medium text-purple-700 hover:text-purple-900">My Listings</Link>
          )}
          {role.isAdmin && (
            <>
              <Link href="/admin" className="text-sm font-medium text-purple-700 hover:text-purple-900">Admin</Link>
              <Link href="/admin/applications" className="text-sm font-medium text-purple-700 hover:text-purple-900">Applications</Link>
            </>
          )}
          {role.authId && !role.isAdmin && !role.isOwner && (
            <Link href="/apply" className="text-sm font-medium text-gray-500 hover:text-purple-700">Become a publisher</Link>
          )}
            {role.loading ? null : role.authId ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">{initial}</span>
                <span className="text-sm text-gray-600 hidden sm:inline">{(displayName ?? '').split(' ')[0]}</span>
              </div>
              <button onClick={handleLogout}
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                Log out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 px-3 py-2">Sign in</Link>
              <Link href="/signup"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition">
                Create Account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}