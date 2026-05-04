import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a file to Firebase Storage.
 *
 * @param {string} path - The destination path in Storage
 *   e.g. 'drivers/{driverId}/{docType}/{timestamp}-{filename}'
 * @param {File} file - The File object to upload
 * @param {function(number): void} [onProgress] - Optional callback receiving 0–100
 * @returns {Promise<{downloadURL: string, storagePath: string}>}
 */
export function uploadFile(path, file, onProgress) {
  const storageInstance = storage();
  if (!storageInstance) {
    return Promise.reject(new Error('Firebase Storage is not configured.'));
  }

  const storageRef = ref(storageInstance, path);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const pct = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress(pct);
        }
      },
      reject,
      async () => {
        try {
          const downloadURL = await getDownloadURL(task.snapshot.ref);
          resolve({ downloadURL, storagePath: path });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Delete a file from Firebase Storage.
 *
 * @param {string} storagePath - The path to the file in Storage
 * @returns {Promise<void>}
 */
export async function deleteFile(storagePath) {
  const storageInstance = storage();
  if (!storageInstance) {
    throw new Error('Firebase Storage is not configured.');
  }
  await deleteObject(ref(storageInstance, storagePath));
}
