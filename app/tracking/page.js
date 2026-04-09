'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import LiveTracker from '@/components/LiveTracker';

/**
 * Live Tracking page.
 *
 * Renders the real-time GPS truck tracking map. An optional `routeCoords`
 * array of [lat, lng] pairs can be supplied to enable snap-to-route. When
 * omitted the tracker operates in free-position mode.
 *
 * To load a route from Firestore, extend this page to fetch the active load's
 * waypoints and pass them as `routeCoords` to <LiveTracker />.
 */
export default function TrackingPage() {
  // Example static route for demonstration. Replace with dynamic data fetched
  // from Firestore (e.g. the active load's origin→destination waypoints).
  const exampleRoute = [];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Live Tracking"
            subtitle="Real-time GPS position of the truck on the map"
          />
          <LiveTracker routeCoords={exampleRoute} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
