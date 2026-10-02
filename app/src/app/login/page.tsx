// app/src/app/login/page.tsx
import Link from 'next/link';
import AuthShell from '@/components/AuthShell';

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your journey">
      <form className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input id="email" type="email" placeholder="name@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
          <input id="password" type="password" placeholder="••••••••"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition" />
        </div>
        <button type="button"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition shadow-md">
          Sign in
        </button>
        <div className="flex flex-col items-center space-y-4">
          <Link href="/signup"
            className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition text-center">
            Create Account
          </Link>
          <Link href="#" className="text-sm text-gray-500 hover:text-blue-600">Forgot password?</Link>
        </div>
      </form>
    </AuthShell>
  );
}