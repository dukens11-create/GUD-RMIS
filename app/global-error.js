'use client';

/**
 * Root-level error boundary (Next.js App Router).
 * Catches errors that occur in the root layout itself (e.g. AuthProvider).
 * Must render its own <html> and <body> tags.
 */
export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
          <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <h2 className="mb-2 text-xl font-bold text-red-700">Application Error</h2>
            <p className="mb-4 text-sm text-red-600">
              {error?.message ??
                'An unexpected error occurred. Please check your environment configuration and try again.'}
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
