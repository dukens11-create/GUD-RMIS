'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '@/lib/firestore';
import { getLoads } from '@/lib/firestore';
import { INVOICE_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass, formatCurrency, formatDate } from '@/lib/utils';

const EMPTY_FORM = {
  loadId: '',
  amount: '',
  dueDate: '',
  status: INVOICE_STATUS.DRAFT,
  notes: '',
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const [invoiceData, loadData] = await Promise.all([getInvoices(), getLoads()]);
    setInvoices(invoiceData);
    setLoads(loadData);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(inv) {
    setForm({
      loadId: inv.loadId ?? '',
      amount: inv.amount?.toString() ?? '',
      dueDate: inv.dueDate ?? '',
      status: inv.status ?? INVOICE_STATUS.DRAFT,
      notes: inv.notes ?? '',
    });
    setEditId(inv.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) || 0 };
      if (editId) {
        await updateInvoice(editId, payload);
      } else {
        await createInvoice(payload);
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this invoice?')) return;
    await deleteInvoice(id);
    await load();
  }

  const loadLabel = (id) => {
    const l = loads.find((d) => d.id === id);
    return l ? `${l.origin} → ${l.destination}` : id ?? '—';
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <PageHeader
            title="Invoices"
            subtitle="Manage billing and payment tracking"
            action={
              <button
                onClick={openAdd}
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                + Add Invoice
              </button>
            }
          />

          {showForm && (
            <SectionCard title={editId ? 'Edit Invoice' : 'Add Invoice'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Load</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.loadId}
                    onChange={(e) => setForm((f) => ({ ...f, loadId: e.target.value }))}
                  >
                    <option value="">— Select Load —</option>
                    {loads.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.origin} → {l.destination}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Amount (USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(INVOICE_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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

          <SectionCard title={`Invoices (${invoices.length})`}>
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-500">No invoices yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="pb-3 pr-4">Load</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Due Date</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Notes</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="py-3 pr-4 font-medium text-gray-900">{loadLabel(inv.loadId)}</td>
                        <td className="py-3 pr-4 text-gray-900">{formatCurrency(inv.amount)}</td>
                        <td className="py-3 pr-4 text-gray-600">{inv.dueDate ? formatDate(inv.dueDate) : '—'}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(inv.status)}`}>
                            {titleCase(inv.status)}
                          </span>
                        </td>
                        <td className="max-w-xs truncate py-3 pr-4 text-gray-500">{inv.notes}</td>
                        <td className="py-3 text-right">
                          <button onClick={() => openEdit(inv)} className="mr-3 text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDelete(inv.id)} className="text-red-600 hover:underline">Delete</button>
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
