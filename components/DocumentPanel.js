'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc as firestoreDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { uploadFile, deleteFile } from '@/lib/storage';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';

const WARN_DAYS = 30;
const ADMIN_EMAIL = 'gudexpressllc@gmail.com';

function expiryStatus(expiresAt) {
  if (!expiresAt) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const exp = new Date(expiresAt);
  const days = Math.ceil((exp - now) / 86400000);
  if (days < 0) return 'expired';
  if (days <= WARN_DAYS) return 'expiring';
  return 'valid';
}

function StatusBadge({ expiresAt }) {
  const s = expiryStatus(expiresAt);
  if (!s) return <span className="text-xs text-gray-400">—</span>;
  const cls = {
    expired: 'bg-red-100 text-red-700',
    expiring: 'bg-yellow-100 text-yellow-700',
    valid: 'bg-green-100 text-green-700',
  };
  const lbl = { expired: 'Expired', expiring: 'Expiring Soon', valid: 'Valid' };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cls[s]}`}>
      {lbl[s]}
    </span>
  );
}

/**
 * DocumentPanel — displays and manages documents of a single type
 * for one entity (driver or vehicle).
 *
 * Props:
 *   label       {string} — human-readable label, e.g. "Driver's License"
 *   docType     {string} — machine key, e.g. "drivers_license"
 *   entityPath  {string} — Firestore parent path, e.g. "drivers/abc123"
 *               Storage files are stored under the same path segment.
 */
export default function DocumentPanel({ label, docType, entityPath }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const fileRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const dbInst = db();
      if (!dbInst) {
        setError('Firebase is not configured.');
        setLoading(false);
        return;
      }
      const q = query(
        collection(dbInst, `${entityPath}/documents`),
        orderBy('uploadedAt', 'desc')
      );
      const snap = await getDocs(q);
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setDocs(all.filter((d) => d.type === docType));
    } catch (err) {
      setError('Failed to load documents.');
      console.error('DocumentPanel load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [entityPath, docType]);

  useEffect(() => {
    if (entityPath) load();
  }, [entityPath, load]);

  function openUploadForm() {
    setShowForm(true);
    setError('');
  }

  function cancelUpload() {
    setShowForm(false);
    setError('');
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Please select a file.');
      return;
    }
    const dbInst = db();
    if (!dbInst) {
      setError('Firebase is not configured.');
      return;
    }
    setUploading(true);
    setProgress(0);
    setError('');
    try {
      const timestamp = Date.now();
      const path = `${entityPath}/${docType}/${timestamp}-${file.name}`;
      const { downloadURL, storagePath } = await uploadFile(path, file, setProgress);
      await addDoc(collection(dbInst, `${entityPath}/documents`), {
        type: docType,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        storagePath,
        downloadURL,
        expiresAt: expiresAt || null,
        notes: notes || null,
        uploadedByUid: user?.uid ?? null,
        uploadedAt: serverTimestamp(),
      });
      setShowForm(false);
      setExpiresAt('');
      setNotes('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('DocumentPanel upload error:', err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(document) {
    if (!confirm(`Delete "${document.fileName}"? This cannot be undone.`)) return;
    try {
      await deleteFile(document.storagePath);
      const dbInst = db();
      if (dbInst) {
        await deleteDoc(firestoreDoc(dbInst, `${entityPath}/documents`, document.id));
      }
      await load();
    } catch (err) {
      setError('Failed to delete document.');
      console.error('DocumentPanel delete error:', err.message);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
        {!showForm && (
          <button
            onClick={openUploadForm}
            className="rounded bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600"
          >
            + Upload
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleUpload}
          className="mb-4 grid gap-3 rounded-lg border border-blue-100 bg-white p-3"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              File <span aria-hidden="true" className="text-red-500">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              className="block w-full text-xs text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              required
              aria-required="true"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Expiration Date
            </label>
            <input
              type="date"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Notes</label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
          {uploading && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-gray-500">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-gray-200">
                <div
                  className="h-1.5 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={uploading}
              className="rounded bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-60"
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              onClick={cancelUpload}
              className="rounded border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-xs text-gray-400">Loading…</p>
      ) : docs.length === 0 ? (
        <p className="text-xs text-gray-400">No documents uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label={`${label} documents`}>
            <thead>
              <tr className="border-b border-gray-200 text-left font-semibold text-gray-500">
                <th scope="col" className="pb-2 pr-3">File</th>
                <th scope="col" className="pb-2 pr-3">Uploaded</th>
                <th scope="col" className="pb-2 pr-3">Expires</th>
                <th scope="col" className="pb-2 pr-3">Status</th>
                <th scope="col" className="pb-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((document) => (
                <tr key={document.id}>
                  <td
                    className="max-w-[10rem] truncate py-2 pr-3 font-medium text-gray-800"
                    title={document.fileName}
                  >
                    {document.fileName}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">
                    {formatDate(document.uploadedAt)}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">{document.expiresAt ?? '—'}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge expiresAt={document.expiresAt} />
                  </td>
                  <td className="py-2 text-right">
                    <a
                      href={document.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                      aria-label={`View ${document.fileName}`}
                    >
                      View
                    </a>
                    {user?.email === ADMIN_EMAIL && (
                      <button
                        onClick={() => handleDelete(document)}
                        className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                        aria-label={`Delete ${document.fileName}`}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
