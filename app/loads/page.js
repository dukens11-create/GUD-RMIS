'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { getLoads, createLoad, updateLoad, deleteLoad } from '@/lib/firestore';
import { getDrivers } from '@/lib/firestore';
import { LOAD_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass, formatDate } from '@/lib/utils';

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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [loadData, driverData] = await Promise.all([getLoads(), getDrivers()]);
    setLoads(loadData);
    setDrivers(driverData);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
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
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateLoad(editId, form);
      } else {
        await createLoad(form);
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this load?')) return;
    await deleteLoad(id);
    await load();
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
              <button
                onClick={openAdd}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                + Add Load
              </button>
            }
          />

          {showForm && (
            <SectionCard title={editId ? 'Edit Load' : 'Add Load'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Origin</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.origin}
                    onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Destination</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.destination}
                    onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Driver</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(LOAD_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Scheduled Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.scheduledDate}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value }))}
                  />
                </div>
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
              <p className="text-sm text-gray-500">Loading…</p>
            ) : loads.length === 0 ? (
              <p className="text-sm text-gray-500">No loads yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="pb-3 pr-4">Origin</th>
                      <th className="pb-3 pr-4">Destination</th>
                      <th className="pb-3 pr-4">Driver</th>
                      <th className="pb-3 pr-4">Scheduled</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3" />
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
                          <button onClick={() => openEdit(l)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(l.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </main>
      </div>
    </ProtectedRoute>
  );
}
