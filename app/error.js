'use client';

/**
 * Route-level error boundary (Next.js App Router).
 * Catches any error thrown inside a page or its descendants and renders a
 * friendly fallback instead of the generic "Application error" overlay.
 */
export default function Error({ error, reset }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-8 text-center">
      <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <h2 className="mb-2 text-xl font-bold text-red-700">Something went wrong</h2>
        <p className="mb-4 text-sm text-red-600">
          {error?.message ?? 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
