'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '@/lib/firestore';
import { DRIVER_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass } from '@/lib/utils';

const EMPTY_FORM = { name: '', licenseNumber: '', phone: '', status: DRIVER_STATUS.ACTIVE };

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getDrivers();
    setDrivers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(driver) {
    setForm({
      name: driver.name ?? '',
      licenseNumber: driver.licenseNumber ?? '',
      phone: driver.phone ?? '',
      status: driver.status ?? DRIVER_STATUS.ACTIVE,
    });
    setEditId(driver.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateDriver(editId, form);
      } else {
        await createDriver(form);
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this driver?')) return;
    await deleteDriver(id);
    await load();
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Drivers"
            subtitle="Manage your driver roster"
            action={
              <button
                onClick={openAdd}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                + Add Driver
              </button>
            }
          />

          {/* Form */}
          {showForm && (
            <SectionCard title={editId ? 'Edit Driver' : 'Add Driver'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.licenseNumber}
                    onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(DRIVER_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
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

          {/* Table */}
          <SectionCard title={`Drivers (${drivers.length})`}>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : drivers.length === 0 ? (
              <p className="text-sm text-gray-500">No drivers yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="pb-3 pr-4">Name</th>
                      <th className="pb-3 pr-4">License</th>
                      <th className="pb-3 pr-4">Phone</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {drivers.map((d) => (
                      <tr key={d.id}>
                        <td className="py-3 pr-4 font-medium text-gray-900">{d.name}</td>
                        <td className="py-3 pr-4 text-gray-600">{d.licenseNumber}</td>
                        <td className="py-3 pr-4 text-gray-600">{d.phone}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(d.status)}`}>
                            {titleCase(d.status)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => openEdit(d)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline">Delete</button>
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
