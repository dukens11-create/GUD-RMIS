'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Root page — redirects to /dashboard.
 *
 * A client-side redirect is used here instead of the server-side `redirect()`
 * helper because Next.js static export (`output: 'export'`) does not support
 * server-side redirects: the generated HTML ends up with `id="__next_error__"`
 * which causes a "client-side exception" error overlay in the browser.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
}
