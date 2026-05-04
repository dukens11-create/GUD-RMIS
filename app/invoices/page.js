'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import PageHeader from '@/components/PageHeader';
import SectionCard from '@/components/SectionCard';
import AttachmentsPanel from '@/components/AttachmentsPanel';
import { getInvoices, createInvoice, updateInvoice, deleteInvoice } from '@/lib/firestore';
import { getLoads } from '@/lib/firestore';
import { INVOICE_STATUS } from '@/lib/constants';
import { titleCase, statusBadgeClass, formatCurrency, formatDate } from '@/lib/utils';
import { exportToCsv } from '@/lib/exportCsv';

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
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [attachInvoiceId, setAttachInvoiceId] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [invoiceData, loadData] = await Promise.all([getInvoices(), getLoads()]);
      setInvoices(invoiceData);
      setLoads(loadData);
    } catch (err) {
      setError('Failed to load invoices. Please try again.');
      console.error('Invoices load error:', err.message);
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

  function openEdit(inv) {
    setForm({
      loadId: inv.loadId ?? '',
      amount: inv.amount?.toString() ?? '',
      dueDate: inv.dueDate ?? '',
      status: inv.status ?? INVOICE_STATUS.DRAFT,
      notes: inv.notes ?? '',
    });
    setEditId(inv.id);
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, amount: parseFloat(form.amount) || 0 };
      if (editId) {
        await updateInvoice(editId, payload);
      } else {
        await createInvoice(payload);
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
          : 'Failed to save invoice. Please try again.';
      setFormError(msg);
      console.error('[GUD-RMIS] Invoice save error:', err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this invoice? This action cannot be undone.')) return;
    try {
      await deleteInvoice(id);
      await load();
    } catch (err) {
      setError('Failed to delete invoice. Please try again.');
      console.error('Invoice delete error:', err.message);
    }
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
              <div className="flex gap-2">
                {invoices.length > 0 && (
                  <button
                    onClick={() => exportToCsv(
                      invoices,
                      ['loadId', 'amount', 'dueDate', 'status', 'notes'],
                      ['Load', 'Amount', 'Due Date', 'Status', 'Notes'],
                      'invoices-export.csv'
                    )}
                    aria-label="Export invoices as CSV"
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export CSV
                  </button>
                )}
                <button
                  onClick={openAdd}
                  aria-label="Add a new invoice"
                  className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
                >
                  + Add Invoice
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
            <SectionCard title={editId ? 'Edit Invoice' : 'Add Invoice'} className="mb-6">
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
                <div>
                  <label htmlFor="invoiceLoad" className="mb-1 block text-sm font-medium text-gray-700">Load</label>
                  <select
                    id="invoiceLoad"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  <label htmlFor="invoiceAmount" className="mb-1 block text-sm font-medium text-gray-700">
                    Amount (USD) <span aria-hidden="true" className="text-red-500">*</span>
                  </label>
                  <input
                    id="invoiceAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                    aria-required="true"
                  />
                </div>
                <div>
                  <label htmlFor="invoiceDueDate" className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    id="invoiceDueDate"
                    type="date"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="invoiceStatus" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="invoiceStatus"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  >
                    {Object.values(INVOICE_STATUS).map((s) => (
                      <option key={s} value={s}>{titleCase(s)}</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="invoiceNotes" className="mb-1 block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    id="invoiceNotes"
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

          <SectionCard title={`Invoices (${invoices.length})`}>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" aria-hidden="true" />
                Loading…
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-sm text-gray-500">No invoices yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm" aria-label="Invoices table">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th scope="col" className="pb-3 pr-4">Load</th>
                      <th scope="col" className="pb-3 pr-4">Amount</th>
                      <th scope="col" className="pb-3 pr-4">Due Date</th>
                      <th scope="col" className="pb-3 pr-4">Status</th>
                      <th scope="col" className="pb-3 pr-4">Notes</th>
                      <th scope="col" className="pb-3">
                        <span className="sr-only">Actions</span>
                      </th>
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
                          <button
                            onClick={() => openEdit(inv)}
                            className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                            aria-label={`Edit invoice for ${formatCurrency(inv.amount)}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setAttachInvoiceId(attachInvoiceId === inv.id ? null : inv.id)}
                            className="mr-3 text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 rounded"
                            aria-label={`${attachInvoiceId === inv.id ? 'Hide' : 'Show'} attachments for invoice ${formatCurrency(inv.amount)}`}
                            aria-expanded={attachInvoiceId === inv.id}
                          >
                            {attachInvoiceId === inv.id ? 'Hide Attachments' : 'Attachments'}
                          </button>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                            aria-label={`Delete invoice for ${formatCurrency(inv.amount)}`}
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

          {/* Attachments section — shown when an invoice row's Attachments button is active */}
          {attachInvoiceId && (() => {
            const inv = invoices.find((i) => i.id === attachInvoiceId);
            return (
              <SectionCard
                title={`Attachments — Invoice ${inv ? formatCurrency(inv.amount) : attachInvoiceId}`}
                className="mt-6"
              >
                <AttachmentsPanel entityPath={`invoices/${attachInvoiceId}`} />
              </SectionCard>
            );
          })()}
        </main>
      </div>
    </ProtectedRoute>
  );
}
