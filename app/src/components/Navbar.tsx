// app/src/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRole } from '@/utils/supabase/role';

function MapIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className ?? 'w-6 h-6'}>
      <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" strokeLinejoin="round" />
      <path d="M9 4v14M15 6v14" strokeLinecap="round" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const role = useRole();
  const supabase = createClient();
  const [userName, setUserName] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      const { data: session } = await supabase.auth.getSession();
      const authId = session.session?.user?.id ?? null;
      if (!authId) {
        if (mounted) setUserName(null);
        return;
      }
      const { data: profile } = await supabase
        .from('app_users')
        .select('name')
        .eq('auth_user_id', authId)
        .maybeSingle();
      if (mounted) setUserName(profile?.name ?? null);
    }

    loadUser();

    // Instantly update when auth changes (login / logout / account switch)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const authId = session?.user?.id ?? null;
      if (!authId) {
        setUserName(null);
        return;
      }
      // Deferred so we never query Supabase inside the auth callback (lock-safe)
      setTimeout(async () => {
        const { data: profile } = await supabase
          .from('app_users')
          .select('name')
          .eq('auth_user_id', authId)
          .maybeSingle();
        if (mounted) setUserName(profile?.name ?? null);
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  const navCls = (path: string) =>
    pathname === path
      ? 'text-blue-600 font-semibold relative after:absolute after:bottom-[-20px] after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:rounded-full'
      : 'text-slate-600 hover:text-slate-900 font-medium';

  async function handleSignOut() {
    await supabase.auth.signOut();
    // Clear the browser history so the back button doesn't show previous sessions
    try {
      window.history.replaceState(null, '', '/');
      // Wipe enough entries to drop pre-login pages; safe on all browsers
      window.history.replaceState(null, '', '/login');
    } catch {}
    router.push('/login');
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-sm group-hover:shadow-md transition-shadow">
              <MapIcon className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-slate-900">TravelMate</span>
          </Link>

          {/* Navigation links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href={role.isOwner || role.isAdmin ? '/business' : '/'} prefetch className={navCls('/')}>
              {role.isOwner || role.isAdmin ? 'Business hub' : 'Discover'}
            </Link>
            <Link href="/search" prefetch className={navCls('/search')}>
              Search
            </Link>
            {role.authId && !role.isOwner && !role.isAdmin && (
              <Link href="/my-trips" prefetch className={navCls('/my-trips')}>
                My trips
              </Link>
            )}
            {role.isOwner && (
              <Link href="/owner" prefetch className={navCls('/owner')}>
                My listings
              </Link>
            )}
            {role.isAdmin && (
              <Link href="/admin" prefetch className={navCls('/admin')}>
                Admin
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {role.loading ? (
              <div className="w-20 h-9 bg-slate-100 rounded-xl animate-pulse" />
            ) : role.authId ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-slate-700">
                    {userName || 'User'}
                  </span>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-lg py-2 z-20 animate-fade-in">
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-900">{userName || 'User'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {role.isAdmin ? 'Administrator' : role.isOwner ? 'Business owner' : 'Traveler'}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Profile & preferences
                      </Link>
                      {role.isOwner && (
                        <Link
                          href="/owner"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                        >
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Manage listings
                        </Link>
                      )}
                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Sign out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link href="/signup" className="btn-primary">
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}