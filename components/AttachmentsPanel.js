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

const ADMIN_EMAIL = 'gudexpressllc@gmail.com';

/**
 * AttachmentsPanel — generic upload/list/download panel for any module record.
 *
 * Props:
 *   entityPath  {string} — Firestore parent path, e.g. "loads/abc123"
 *               Attachments are stored in the `attachments` subcollection.
 *               Storage files are stored under `{entityPath}/attachments/`.
 */
export default function AttachmentsPanel({ entityPath }) {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
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
        collection(dbInst, `${entityPath}/attachments`),
        orderBy('uploadedAt', 'desc')
      );
      const snap = await getDocs(q);
      setDocs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setError('Failed to load attachments.');
      console.error('AttachmentsPanel load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [entityPath]);

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
      const path = `${entityPath}/attachments/${timestamp}-${file.name}`;
      const { downloadURL, storagePath } = await uploadFile(path, file, setProgress);
      await addDoc(collection(dbInst, `${entityPath}/attachments`), {
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        storagePath,
        downloadURL,
        notes: notes || null,
        uploadedByUid: user?.uid ?? null,
        uploadedAt: serverTimestamp(),
      });
      setShowForm(false);
      setNotes('');
      if (fileRef.current) fileRef.current.value = '';
      await load();
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('AttachmentsPanel upload error:', err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(attachment) {
    if (!confirm(`Delete "${attachment.fileName}"? This cannot be undone.`)) return;
    try {
      await deleteFile(attachment.storagePath);
      const dbInst = db();
      if (dbInst) {
        await deleteDoc(firestoreDoc(dbInst, `${entityPath}/attachments`, attachment.id));
      }
      await load();
    } catch (err) {
      setError('Failed to delete attachment.');
      console.error('AttachmentsPanel delete error:', err.message);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Attachments</h3>
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
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.txt"
              className="block w-full text-xs text-gray-700 file:mr-3 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              required
              aria-required="true"
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
        <p className="text-xs text-gray-400">No attachments uploaded yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" aria-label="Attachments">
            <thead>
              <tr className="border-b border-gray-200 text-left font-semibold text-gray-500">
                <th scope="col" className="pb-2 pr-3">File</th>
                <th scope="col" className="pb-2 pr-3">Uploaded</th>
                <th scope="col" className="pb-2 pr-3">Notes</th>
                <th scope="col" className="pb-2">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((attachment) => (
                <tr key={attachment.id}>
                  <td
                    className="max-w-[10rem] truncate py-2 pr-3 font-medium text-gray-800"
                    title={attachment.fileName}
                  >
                    {attachment.fileName}
                  </td>
                  <td className="py-2 pr-3 text-gray-500">
                    {formatDate(attachment.uploadedAt)}
                  </td>
                  <td className="max-w-[8rem] truncate py-2 pr-3 text-gray-500">
                    {attachment.notes ?? '—'}
                  </td>
                  <td className="py-2 text-right">
                    <a
                      href={attachment.downloadURL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mr-3 text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                      aria-label={`View ${attachment.fileName}`}
                    >
                      View
                    </a>
                    {user?.email === ADMIN_EMAIL && (
                      <button
                        onClick={() => handleDelete(attachment)}
                        className="text-red-600 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 rounded"
                        aria-label={`Delete ${attachment.fileName}`}
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
