'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import { getLoads, createLoad, updateLoad, deleteLoad } from '@/lib/firestore';
import { getDrivers } from '@/lib/firestore';
import { LOAD_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass, formatDate } from '@/lib/utils';
import { exportLoadsCsv } from '@/lib/exportCsv';

const EMPTY_FORM = {
  origin: '',
  destination: '',
  driverId: '',
  status: LOAD_STATUS.PENDING,
  scheduledDate: '',
};

export default function LoadsPage() {
  const [loads, setLoads] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [attachLoadId, setAttachLoadId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [loadData, driverData] = await Promise.all([getLoads(), getDrivers()]);
      setLoads(loadData);
      setDrivers(driverData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Loads load error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setFormError('');
    setShowForm(true);
  }

  function openEdit(item) {
    setForm({
      origin: item.origin ?? '',
      destination: item.destination ?? '',
      driverId: item.driverId ?? '',
      status: item.status ?? LOAD_STATUS.PENDING,
      scheduledDate: item.scheduledDate ?? '',
    });
    setEditId(item.id);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editId) {
        await updateLoad(editId, form);
      } else {
        await createLoad(form);
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError('Failed to save load. Please try again.');
      console.error('Load save error:', err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this load? This action cannot be undone.')) return;
    try {
      await deleteLoad(id);
      await load();
    } catch (err) {
      setError('Failed to delete load. Please try again.');
      console.error('Load delete error:', err.message);
    }
  }

  const driverName = (id) => drivers.find((d) => d.id === id)?.name ?? id ?? '—';

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Loads"
            subtitle="Track shipments and deliveries"
            action={
              <div className="flex gap-2">
                {loads.length > 0 && (
                  <button
                    onClick={() => exportLoadsCsv(loads)}
                    aria-label="Export loads as CSV"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={openAdd}
                  aria-label="Add a new load"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  + Add Load
                </button>
              </div>
            }
          />

          {/* Global error banner */}
          {error && (
            <div role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {showForm && (
            <SectionCard title={editId ? 'Edit Load' : 'Add Load'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="loadOrigin" className="mb-1 block text-sm font-medium text-gray-700">
                    Origin <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="loadOrigin"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.origin}
                    onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="loadDestination" className="mb-1 block text-sm font-medium text-gray-700">
                    Destination <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="loadDestination"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="loadDriver" className="mb-1 block text-sm font-medium text-gray-700">
                    Driver
                  </label>
                  <select
                    id="loadDriver"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.driverId}
                    onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                  >
                    <option value="">— Unassigned —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="loadStatus" className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="loadStatus"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(LOAD_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="loadScheduledDate" className="mb-1 block text-sm font-medium text-gray-700">
                    Scheduled Date
                  </label>
                  <input
                    id="loadScheduledDate"
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.scheduledDate}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  />
                </div>

                {formError && (
                  <p role="alert" className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 sm:col-span-2">
                    {formError}
                  </p>
                )}

                <div className="flex gap-2 sm:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </SectionCard>
          )}

          <SectionCard title={`Loads (${loads.length})`}>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                Loading…
              </div>
            ) : loads.length === 0 ? (
              <p className="text-sm text-gray-500">No loads yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Loads table">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th scope="col" className="pb-3 pr-4">Origin</th>
                      <th scope="col" className="pb-3 pr-4">Destination</th>
                      <th scope="col" className="pb-3 pr-4">Driver</th>
                      <th scope="col" className="pb-3 pr-4">Scheduled</th>
                      <th scope="col" className="pb-3 pr-4">Status</th>
                      <th scope="col" className="pb-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loads.map((l) => (
                      <tr key={l.id}>
                        <td className="py-3 pr-4 font-medium text-gray-900">{l.origin}</td>
                        <td className="py-3 pr-4 text-gray-600">{l.destination}</td>
                        <td className="py-3 pr-4 text-gray-600">{driverName(l.driverId)}</td>
                        <td className="py-3 pr-4 text-gray-600">{l.scheduledDate ? formatDate(l.scheduledDate) : '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(l.status)}`}>
                            {titleCase(l.status)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEdit(l)}
                            className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                            aria-label={`Edit load from ${l.origin} to ${l.destination}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setAttachLoadId(attachLoadId === l.id ? null : l.id)}
                            className="mr-3 text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                            aria-label={`${attachLoadId === l.id ? 'Hide' : 'Show'} attachments for load ${l.origin} to ${l.destination}`}
                            aria-expanded={attachLoadId === l.id}
                          >
                            {attachLoadId === l.id ? 'Hide Attachments' : 'Attachments'}
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                            aria-label={`Delete load from ${l.origin} to ${l.destination}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Attachments section — shown when a load row's Attachments button is active */}
          {attachLoadId && (() => {
            const load = loads.find((l) => l.id === attachLoadId);
            return (
              <SectionCard
                title={`Attachments — ${load ? `${load.origin} → ${load.destination}` : attachLoadId}`}
                className="mt-6"
              >
                <AttachmentsPanel entityPath={`loads/${attachLoadId}`} />
              </SectionCard>
            );
          })()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
