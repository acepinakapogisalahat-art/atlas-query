// app/src/components/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

function UserIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className ?? 'w-4 h-4'}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12H9" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const role = useRole();
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    async function loadName() {
      if (!role.authId) {
        setDisplayName(null);
        return;
      }
      const { data: profile } = await supabase
        .from('app_users')
        .select('name')
        .eq('auth_user_id', role.authId)
        .maybeSingle();
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

  const first = displayName ? displayName.split(' ')[0] : null;
  const linkCls = 'text-sm font-medium text-slate-600 hover:text-slate-900 transition';
  const roleCls = 'hidden sm:inline text-sm font-medium text-purple-700 hover:text-purple-900 transition';

  return (
    <nav className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 gap-6">
        <div className="flex items-center gap-8 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="18" height="18">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">TravelMate</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link
  href={role.isOwner || role.isAdmin ? '/business' : '/'}
  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
>
</Link>
            <Link href="/search" className={linkCls}>Search</Link>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {role.isOwner && <Link href="/business" className={roleCls}>My Business</Link>}
          {role.isAdmin && (
            <>
              <Link href="/admin" className={roleCls}>Admin</Link>
              <Link href="/admin/applications" className={roleCls}>Applications</Link>
            </>
          )}
          {role.authId && !role.isAdmin && !role.isOwner && (
            <Link href="/apply" className="hidden sm:inline text-sm font-medium text-slate-500 hover:text-purple-700 transition">
              Become a publisher
            </Link>
          )}

          {role.loading ? null : role.authId ? (
            <div className="flex items-center gap-3">
              <span className="hidden md:block h-6 w-px bg-slate-200" />
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                {first ?? 'Profile'}
              </Link>
              <button
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
                className="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50/50 flex items-center justify-center transition"
              >
                <LogoutIcon className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition">
                Sign in
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm"
              >
                Create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}