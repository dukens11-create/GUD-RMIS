'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import DocumentPanel from '@/components/DocumentPanel';
import { getDrivers, createDriver, updateDriver, deleteDriver } from '@/lib/firestore';
import { DRIVER_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass, formatFirestoreError } from '@/lib/utils';
import { exportDriversCsv } from '@/lib/exportCsv';

const EMPTY_FORM = { name: '', licenseNumber: '', phone: '', status: DRIVER_STATUS.ACTIVE };

const DRIVER_DOC_TYPES = [
  { docType: 'drivers_license', label: "Driver's License" },
  { docType: 'medical_card', label: 'Medical Card' },
  { docType: 'drug_test_new_hire', label: 'Drug Test – New Hire' },
  { docType: 'drug_test_random', label: 'Drug Test – Random' },
];

export default function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [docDriverId, setDocDriverId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getDrivers();
      setDrivers(data);
    } catch (err) {
      setError('Failed to load drivers. Please try again.');
      console.error('Drivers load error:', err.message);
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

  function openEdit(driver) {
    setForm({
      name: driver.name ?? '',
      licenseNumber: driver.licenseNumber ?? '',
      phone: driver.phone ?? '',
      status: driver.status ?? DRIVER_STATUS.ACTIVE,
    });
    setEditId(driver.id);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    if (!form.name.trim()) {
      setFormError('Full Name is required.');
      return;
    }
    if (!form.licenseNumber.trim()) {
      setFormError('License Number is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      if (editId) {
        await updateDriver(editId, form);
      } else {
        await createDriver(form);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setFormError(formatFirestoreError(err, 'Failed to save driver. Please try again.'));
      console.error('[GUD-RMIS] Driver save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this driver? This action cannot be undone.')) return;
    try {
      await deleteDriver(id);
      await load();
    } catch (err) {
      setError('Failed to delete driver. Please try again.');
      console.error('Driver delete error:', err.message);
    }
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
              <div className="flex gap-2">
                {drivers.length > 0 && (
                  <button
                    onClick={() => exportDriversCsv(drivers)}
                    aria-label="Export drivers as CSV"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={openAdd}
                  aria-label="Add a new driver"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  + Add Driver
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

          {/* Form */}
          {showForm && (
            <SectionCard title={editId ? 'Edit Driver' : 'Add Driver'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="driverName" className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="driverName"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="licenseNumber" className="mb-1 block text-sm font-medium text-gray-700">
                    License Number <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="licenseNumber"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.licenseNumber}
                    onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="driverPhone" className="mb-1 block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    id="driverPhone"
                    type="tel"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="driverStatus" className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="driverStatus"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(DRIVER_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
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

          {/* Table */}
          <SectionCard title={`Drivers (${drivers.length})`}>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                Loading…
              </div>
            ) : drivers.length === 0 ? (
              <p className="text-sm text-gray-500">No drivers yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Drivers table">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th scope="col" className="pb-3 pr-4">Name</th>
                      <th scope="col" className="pb-3 pr-4">License</th>
                      <th scope="col" className="pb-3 pr-4">Phone</th>
                      <th scope="col" className="pb-3 pr-4">Status</th>
                      <th scope="col" className="pb-3">
                        <span className="sr-only">Actions</span>
                      </th>
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
                          <button
                            onClick={() => openEdit(d)}
                            className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                            aria-label={`Edit driver ${d.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDocDriverId(docDriverId === d.id ? null : d.id)}
                            className="mr-3 text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                            aria-label={`${docDriverId === d.id ? 'Hide' : 'Show'} documents for driver ${d.name}`}
                            aria-expanded={docDriverId === d.id}
                          >
                            {docDriverId === d.id ? 'Hide Docs' : 'Documents'}
                          </button>
                          <button
                            onClick={() => handleDelete(d.id)}
                            className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                            aria-label={`Delete driver ${d.name}`}
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

          {/* Documents section — shown when a driver row's Documents button is active */}
          {docDriverId && (() => {
            const driver = drivers.find((d) => d.id === docDriverId);
            return (
              <SectionCard
                title={`Documents — ${driver?.name ?? docDriverId}`}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {DRIVER_DOC_TYPES.map(({ docType, label }) => (
                    <DocumentPanel
                      key={docType}
                      label={label}
                      docType={docType}
                      entityPath={`drivers/${docDriverId}`}
                    />
                  ))}
                </div>
              </SectionCard>
            );
          })()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
