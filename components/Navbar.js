'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, signOut } from '@/lib/auth';
import { NAV_LINKS } from '@/lib/constants';

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <nav className="bg-blue-900 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/dashboard" className="text-xl font-bold tracking-wide">
          GUD RMIS
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm font-medium transition-colors hover:text-blue-200 ${
                pathname.startsWith(href)
                  ? 'border-b-2 border-blue-300 text-blue-200'
                  : 'text-white'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* User / Sign out */}
        {user && (
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-blue-200 md:block">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="rounded bg-blue-700 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-blue-600"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
