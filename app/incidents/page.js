'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { getIncidents, createIncident, updateIncident, deleteIncident } from '@/lib/firestore';
import { INCIDENT_SEVERITY } from '@/lib/constants';
import { titleCase, statusBadgeClass } from '@/lib/utils';

const EMPTY_FORM = {
  date: '',
  driver: '',
  description: '',
  severity: INCIDENT_SEVERITY.LOW,
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getIncidents();
    setIncidents(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(incident) {
    setForm({
      date: incident.date ?? '',
      driver: incident.driver ?? '',
      description: incident.description ?? '',
      severity: incident.severity ?? INCIDENT_SEVERITY.LOW,
    });
    setEditId(incident.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await updateIncident(editId, form);
      } else {
        await createIncident(form);
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this incident?')) return;
    await deleteIncident(id);
    await load();
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Incidents"
            subtitle="Track accidents and risk events"
            action={
              <button
                onClick={openAdd}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                + Report Incident
              </button>
            }
          />

          {/* Form */}
          {showForm && (
            <SectionCard title={editId ? 'Edit Incident' : 'Report Incident'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.date}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Driver</label>
                  <input
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.driver}
                    onChange={(e) => setForm((f) => ({ ...f, driver: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Severity</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.severity}
                    onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                  >
                    {Object.values(INCIDENT_SEVERITY).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    required
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

          {/* Table */}
          <SectionCard title={`Incidents (${incidents.length})`}>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : incidents.length === 0 ? (
              <p className="text-sm text-gray-500">No incidents recorded yet. Report one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="pb-3 pr-4">Date</th>
                      <th className="pb-3 pr-4">Driver</th>
                      <th className="pb-3 pr-4">Description</th>
                      <th className="pb-3 pr-4">Severity</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {incidents.map((inc) => (
                      <tr key={inc.id}>
                        <td className="py-3 pr-4 text-gray-600">{inc.date}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900">{inc.driver}</td>
                        <td className="py-3 pr-4 max-w-xs truncate text-gray-600">{inc.description}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(inc.severity)}`}>
                            {titleCase(inc.severity)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button onClick={() => openEdit(inc)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(inc.id)} className="text-red-600 hover:underline">Delete</button>
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
