'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import DocumentPanel from '@/components/DocumentPanel';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/lib/firestore';
import { VEHICLE_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass } from '@/lib/utils';
import { exportVehiclesCsv } from '@/lib/exportCsv';

const EMPTY_FORM = {
  vin: '',
  make: '',
  model: '',
  year: '',
  licensePlate: '',
  status: VEHICLE_STATUS.ACTIVE,
  insuranceExpiry: '',
  registrationExpiry: '',
  notes: '',
};

const VEHICLE_DOC_TYPES = [
  { docType: 'truck_registration', label: 'Truck Registration' },
  { docType: 'dot_inspection', label: 'DOT Inspection' },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [docVehicleId, setDocVehicleId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      setError('Failed to load vehicles. Please try again.');
      console.error('Vehicles load error:', err.message);
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

  function openEdit(vehicle) {
    setForm({
      vin: vehicle.vin ?? '',
      make: vehicle.make ?? '',
      model: vehicle.model ?? '',
      year: vehicle.year ?? '',
      licensePlate: vehicle.licensePlate ?? '',
      status: vehicle.status ?? VEHICLE_STATUS.ACTIVE,
      insuranceExpiry: vehicle.insuranceExpiry ?? '',
      registrationExpiry: vehicle.registrationExpiry ?? '',
      notes: vehicle.notes ?? '',
    });
    setEditId(vehicle.id);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editId) {
        await updateVehicle(editId, form);
      } else {
        await createVehicle(form);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      const code = err?.code;
      const msg =
        code === 'permission-denied'
          ? 'Permission denied. Check that Firestore rules allow authenticated writes.'
          : err?.message?.includes('not configured')
          ? err.message
          : 'Failed to save vehicle. Please try again.';
      setFormError(msg);
      console.error('[GUD-RMIS] Vehicle save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this vehicle? This action cannot be undone.')) return;
    try {
      await deleteVehicle(id);
      await load();
    } catch (err) {
      setError('Failed to delete vehicle. Please try again.');
      console.error('Vehicle delete error:', err.message);
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Vehicles"
            subtitle="Manage your fleet of trucks and vehicles"
            action={
              <div className="flex gap-2">
                {vehicles.length > 0 && (
                  <button
                    onClick={() => exportVehiclesCsv(vehicles)}
                    aria-label="Export vehicles as CSV"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={openAdd}
                  aria-label="Add a new vehicle"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  + Add Vehicle
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
            <SectionCard title={editId ? 'Edit Vehicle' : 'Add Vehicle'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="vin" className="mb-1 block text-sm font-medium text-gray-700">
                    VIN
                  </label>
                  <input
                    id="vin"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.vin}
                    onChange={(e) => setForm((f) => ({ ...f, vin: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="licensePlate" className="mb-1 block text-sm font-medium text-gray-700">
                    License Plate
                  </label>
                  <input
                    id="licensePlate"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.licensePlate}
                    onChange={(e) => setForm((f) => ({ ...f, licensePlate: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="make" className="mb-1 block text-sm font-medium text-gray-700">
                    Make
                  </label>
                  <input
                    id="make"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.make}
                    onChange={(e) => setForm((f) => ({ ...f, make: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="model" className="mb-1 block text-sm font-medium text-gray-700">
                    Model
                  </label>
                  <input
                    id="model"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.model}
                    onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="year" className="mb-1 block text-sm font-medium text-gray-700">
                    Year
                  </label>
                  <input
                    id="year"
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 1}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.year}
                    onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="vehicleStatus" className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="vehicleStatus"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(VEHICLE_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="insuranceExpiry" className="mb-1 block text-sm font-medium text-gray-700">
                    Insurance Expiry
                  </label>
                  <input
                    id="insuranceExpiry"
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.insuranceExpiry}
                    onChange={(e) => setForm((f) => ({ ...f, insuranceExpiry: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="registrationExpiry" className="mb-1 block text-sm font-medium text-gray-700">
                    Registration Expiry
                  </label>
                  <input
                    id="registrationExpiry"
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.registrationExpiry}
                    onChange={(e) => setForm((f) => ({ ...f, registrationExpiry: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="vehicleNotes" className="mb-1 block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="vehicleNotes"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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

          {/* Table */}
          <SectionCard title={`Vehicles (${vehicles.length})`}>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                Loading…
              </div>
            ) : vehicles.length === 0 ? (
              <p className="text-sm text-gray-500">No vehicles yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Vehicles table">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th scope="col" className="pb-3 pr-4">VIN</th>
                      <th scope="col" className="pb-3 pr-4">Make / Model</th>
                      <th scope="col" className="pb-3 pr-4">Year</th>
                      <th scope="col" className="pb-3 pr-4">Plate</th>
                      <th scope="col" className="pb-3 pr-4">Status</th>
                      <th scope="col" className="pb-3 pr-4">Ins. Expiry</th>
                      <th scope="col" className="pb-3 pr-4">Reg. Expiry</th>
                      <th scope="col" className="pb-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {vehicles.map((v) => (
                      <tr key={v.id}>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-700">{v.vin}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{v.make} {v.model}</td>
                        <td className="py-3 pr-4 text-gray-600">{v.year}</td>
                        <td className="py-3 pr-4 text-gray-600">{v.licensePlate}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(v.status)}`}>
                            {titleCase(v.status)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{v.insuranceExpiry || '—'}</td>
                        <td className="py-3 pr-4 text-gray-600">{v.registrationExpiry || '—'}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEdit(v)}
                            className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                            aria-label={`Edit vehicle ${v.make} ${v.model}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDocVehicleId(docVehicleId === v.id ? null : v.id)}
                            className="mr-3 text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                            aria-label={`${docVehicleId === v.id ? 'Hide' : 'Show'} documents for vehicle ${v.make} ${v.model}`}
                            aria-expanded={docVehicleId === v.id}
                          >
                            {docVehicleId === v.id ? 'Hide Docs' : 'Documents'}
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                            aria-label={`Delete vehicle ${v.make} ${v.model}`}
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

          {/* Documents section — shown when a vehicle row's Documents button is active */}
          {docVehicleId && (() => {
            const vehicle = vehicles.find((v) => v.id === docVehicleId);
            return (
              <SectionCard
                title={`Documents — ${vehicle ? `${vehicle.make} ${vehicle.model}` : docVehicleId}`}
                className="mt-6"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {VEHICLE_DOC_TYPES.map(({ docType, label }) => (
                    <DocumentPanel
                      key={docType}
                      label={label}
                      docType={docType}
                      entityPath={`vehicles/${docVehicleId}`}
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
