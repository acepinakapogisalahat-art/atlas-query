// app/src/components/AuthShell.tsx
import { ReactNode } from 'react';

const PlaneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="20" height="20">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
);

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-md">
      <PlaneIcon />
    </div>
    <span className={`font-bold text-xl ${dark ? 'text-white' : 'text-gray-900'}`}>TravelMate</span>
  </div>
);

export default function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
        <img
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80"
          alt="Mountains"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-blue-900/40" />
        <div className="relative z-10 flex flex-col justify-end p-16 text-white w-full">
          <div className="space-y-6">
            <Logo dark />
            <h1 className="text-5xl font-bold leading-tight">
              Plan less.<br />Experience more.
            </h1>
            <p className="text-blue-100 text-lg max-w-md">
              Personalized travel discovery, trip planning and real-time assistance in one place
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="mb-8"><Logo /></div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
            <p className="mt-2 text-gray-500">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}