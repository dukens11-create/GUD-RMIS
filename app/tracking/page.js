'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import LiveTracker from '@/components/LiveTracker';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import {
  collection,
  getDocs,
  addDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

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

  const [trackingRecords, setTrackingRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [attachTrackingId, setAttachTrackingId] = useState(null);
  const [newRecordTitle, setNewRecordTitle] = useState('');
  const [addingRecord, setAddingRecord] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadTrackingRecords();
  }, []);

  async function loadTrackingRecords() {
    setLoadingRecords(true);
    try {
      const dbInst = db();
      if (!dbInst) {
        setLoadingRecords(false);
        return;
      }
      const q = query(
        collection(dbInst, COLLECTIONS.TRACKING),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setTrackingRecords(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      // Gracefully handle missing collection or config
    } finally {
      setLoadingRecords(false);
    }
  }

  async function handleAddRecord(e) {
    e.preventDefault();
    if (!newRecordTitle.trim()) return;
    const dbInst = db();
    if (!dbInst) return;
    setAddingRecord(true);
    try {
      await addDoc(collection(dbInst, COLLECTIONS.TRACKING), {
        title: newRecordTitle.trim(),
        createdAt: serverTimestamp(),
      });
      setNewRecordTitle('');
      setShowAddForm(false);
      await loadTrackingRecords();
    } catch {
      // ignore errors silently
    } finally {
      setAddingRecord(false);
    }
  }

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

          {/* Tracking Attachments */}
          <SectionCard title="Tracking Attachments" className="mt-6">
            <p className="mb-4 text-sm text-gray-500">
              Attach documents (route plans, permits, logs) to tracking sessions below.
            </p>

            {/* Add tracking record */}
            <div className="mb-4">
              {!showAddForm ? (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  + New Tracking Session
                </button>
              ) : (
                <form onSubmit={handleAddRecord} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newRecordTitle}
                    onChange={(e) => setNewRecordTitle(e.target.value)}
                    placeholder="Session title (e.g. Truck-01 May 4)"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={addingRecord}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                  >
                    {addingRecord ? 'Adding…' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setNewRecordTitle(''); }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>

            {loadingRecords ? (
              <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                Loading…
              </div>
            ) : trackingRecords.length === 0 ? (
              <p className="text-sm text-gray-500">No tracking sessions yet. Add one above to attach documents.</p>
            ) : (
              <div className="space-y-4">
                {trackingRecords.map((record) => (
                  <div key={record.id} className="rounded-lg border border-gray-200 bg-white">
                    <button
                      onClick={() => setAttachTrackingId(attachTrackingId === record.id ? null : record.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 rounded-lg"
                      aria-expanded={attachTrackingId === record.id}
                    >
                      <span>{record.title || record.id}</span>
                      <span className="text-gray-400 text-xs">
                        {attachTrackingId === record.id ? '▲ Hide' : '▼ Show Attachments'}
                      </span>
                    </button>
                    {attachTrackingId === record.id && (
                      <div className="border-t border-gray-100 p-4">
                        <AttachmentsPanel entityPath={`tracking/${record.id}`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </main>
      </div>
    </ProtectedRoute>
  );
}
