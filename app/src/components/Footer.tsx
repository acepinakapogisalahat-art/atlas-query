// app/src/components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <p className="font-bold text-white text-lg">TravelMate</p>
          <p className="mt-2 text-sm text-slate-400 max-w-sm">
            Algorithm-powered trip planning, from first search to last stamp in your passport.
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Product</p>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">Discover</Link></li>
            <li><Link href="/search" className="hover:text-white">Search</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Company</p>
          <ul className="space-y-2 text-sm">
            <li><span className="text-slate-500">Help Center</span></li>
            <li><span className="text-slate-500">Safety</span></li>
            <li><span className="text-slate-500">Contact</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-500">
          © 2026 TravelMate · Atlas Query Co.
        </p>
      </div>
    </footer>
  );
}