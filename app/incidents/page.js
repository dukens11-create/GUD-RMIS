'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import { getIncidents, createIncident, updateIncident, deleteIncident } from '@/lib/firestore';
import { getDrivers } from '@/lib/firestore';
import { getVehicles } from '@/lib/firestore';
import { INCIDENT_SEVERITY, INCIDENT_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass, formatDate, formatFirestoreError } from '@/lib/utils';
import { exportIncidentsCsv } from '@/lib/exportCsv';

const EMPTY_FORM = {
  date: '',
  type: '',
  severity: INCIDENT_SEVERITY.LOW,
  status: INCIDENT_STATUS.OPEN,
  location: '',
  driverId: '',
  vehicleId: '',
  description: '',
  damageEstimate: '',
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [attachIncidentId, setAttachIncidentId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [incidentData, driverData, vehicleData] = await Promise.all([
        getIncidents(),
        getDrivers(),
        getVehicles(),
      ]);
      setIncidents(incidentData);
      setDrivers(driverData);
      setVehicles(vehicleData);
    } catch (err) {
      setError('Failed to load incidents. Please try again.');
      console.error('Incidents load error:', err.message);
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

  function openEdit(incident) {
    setForm({
      date: incident.date ?? '',
      type: incident.type ?? '',
      severity: incident.severity ?? INCIDENT_SEVERITY.LOW,
      status: incident.status ?? INCIDENT_STATUS.OPEN,
      location: incident.location ?? '',
      driverId: incident.driverId ?? '',
      vehicleId: incident.vehicleId ?? '',
      description: incident.description ?? '',
      damageEstimate: incident.damageEstimate?.toString() ?? '',
    });
    setEditId(incident.id);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        ...form,
        damageEstimate: form.damageEstimate ? parseFloat(form.damageEstimate) : null,
      };
      if (editId) {
        await updateIncident(editId, payload);
      } else {
        await createIncident(payload);
      }
      setShowForm(false);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setFormError(formatFirestoreError(err, 'Failed to save incident. Please try again.'));
      console.error('[GUD-RMIS] Incident save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this incident? This action cannot be undone.')) return;
    try {
      await deleteIncident(id);
      await load();
    } catch (err) {
      setError('Failed to delete incident. Please try again.');
      console.error('Incident delete error:', err.message);
    }
  }

  const driverName = (id) => drivers.find((d) => d.id === id)?.name ?? '—';
  const vehicleLabel = (id) => {
    const v = vehicles.find((v) => v.id === id);
    return v ? `${v.make} ${v.model} (${v.licensePlate})` : '—';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Incidents"
            subtitle="Record and track accidents, violations, and risk events"
            action={
              <div className="flex gap-2">
                {incidents.length > 0 && (
                  <button
                    onClick={() => exportIncidentsCsv(incidents)}
                    aria-label="Export incidents as CSV"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={openAdd}
                  aria-label="Add a new incident"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  + Report Incident
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
            <SectionCard title={editId ? 'Edit Incident' : 'Report Incident'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="incidentDate" className="mb-1 block text-sm font-medium text-gray-700">
                    Date <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="incidentDate"
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="incidentType" className="mb-1 block text-sm font-medium text-gray-700">
                    Type <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="incidentType"
                    placeholder="e.g. Accident, Violation, Cargo Damage"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="incidentSeverity" className="mb-1 block text-sm font-medium text-gray-700">
                    Severity
                  </label>
                  <select
                    id="incidentSeverity"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.severity}
                    onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                  >
                    {Object.values(INCIDENT_SEVERITY).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="incidentStatus" className="mb-1 block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="incidentStatus"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(INCIDENT_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="incidentLocation" className="mb-1 block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    id="incidentLocation"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.location}
                    onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="incidentDriver" className="mb-1 block text-sm font-medium text-gray-700">
                    Driver
                  </label>
                  <select
                    id="incidentDriver"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.driverId}
                    onChange={(e) => setForm((f) => ({ ...f, driverId: e.target.value }))}
                  >
                    <option value="">— Select Driver —</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="incidentVehicle" className="mb-1 block text-sm font-medium text-gray-700">
                    Vehicle
                  </label>
                  <select
                    id="incidentVehicle"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.vehicleId}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleId: e.target.value }))}
                  >
                    <option value="">— Select Vehicle —</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.make} {v.model} ({v.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="damageEstimate" className="mb-1 block text-sm font-medium text-gray-700">
                    Damage Estimate (USD)
                  </label>
                  <input
                    id="damageEstimate"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.damageEstimate}
                    onChange={(e) => setForm((f) => ({ ...f, damageEstimate: e.target.value }))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="incidentDescription" className="mb-1 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="incidentDescription"
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
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
          <SectionCard title={`Incidents (${incidents.length})`}>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                Loading…
              </div>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-gray-500">No incidents recorded yet. Report one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Incidents table">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th scope="col" className="pb-3 pr-4">Date</th>
                      <th scope="col" className="pb-3 pr-4">Type</th>
                      <th scope="col" className="pb-3 pr-4">Severity</th>
                      <th scope="col" className="pb-3 pr-4">Status</th>
                      <th scope="col" className="pb-3 pr-4">Driver</th>
                      <th scope="col" className="pb-3 pr-4">Vehicle</th>
                      <th scope="col" className="pb-3 pr-4">Location</th>
                      <th scope="col" className="pb-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td className="py-3 pr-4 text-gray-600">{inc.date ? formatDate(inc.date) : '—'}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{inc.type}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(inc.severity)}`}>
                            {titleCase(inc.severity)}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(inc.status)}`}>
                            {titleCase(inc.status)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-gray-600">{driverName(inc.driverId)}</td>
                        <td className="py-3 pr-4 text-gray-600">{vehicleLabel(inc.vehicleId)}</td>
                        <td className="max-w-[140px] truncate py-3 pr-4 text-gray-600">{inc.location || '—'}</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => openEdit(inc)}
                            className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                            aria-label={`Edit incident on ${inc.date}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setAttachIncidentId(attachIncidentId === inc.id ? null : inc.id)}
                            className="mr-3 text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                            aria-label={`${attachIncidentId === inc.id ? 'Hide' : 'Show'} attachments for incident on ${inc.date}`}
                            aria-expanded={attachIncidentId === inc.id}
                          >
                            {attachIncidentId === inc.id ? 'Hide Attachments' : 'Attachments'}
                          </button>
                          <button
                            onClick={() => handleDelete(inc.id)}
                            className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                            aria-label={`Delete incident on ${inc.date}`}
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

          {/* Attachments section — shown when an incident row's Attachments button is active */}
          {attachIncidentId && (() => {
            const inc = incidents.find((i) => i.id === attachIncidentId);
            return (
              <SectionCard
                title={`Attachments — ${inc ? `${inc.type} (${inc.date})` : attachIncidentId}`}
                className="mt-6"
              >
                <AttachmentsPanel entityPath={`incidents/${attachIncidentId}`} />
              </SectionCard>
            );
          })()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
