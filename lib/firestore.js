import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from './constants';

// ─── Internal helper ──────────────────────────────────────────────────────────

/**
 * Returns the Firestore instance or throws a clear, catchable error when
 * Firebase is not configured (e.g. NEXT_PUBLIC_FIREBASE_* env vars missing
 * from the static build). This prevents callers from hanging indefinitely
 * when db() returns null.
 */
function getDb() {
  const instance = db();
  if (!instance) {
    throw new Error(
      'Firebase is not configured. Ensure all NEXT_PUBLIC_FIREBASE_* ' +
        'environment variables are set on your hosting platform (e.g. Render → ' +
        'Environment) and redeploy so the values are embedded into the static build.'
    );
  }
  return instance;
}

// ─── Generic helpers ──────────────────────────────────────────────────────────

export async function getAll(collectionName) {
  const snap = await getDocs(collection(getDb(), collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getById(collectionName, id) {
  const snap = await getDoc(doc(getDb(), collectionName, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function create(collectionName, data) {
  const ref = await addDoc(collection(getDb(), collectionName), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function update(collectionName, id, data) {
  await updateDoc(doc(getDb(), collectionName, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function remove(collectionName, id) {
  await deleteDoc(doc(getDb(), collectionName, id));
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

export const getDrivers = () => getAll(COLLECTIONS.DRIVERS);
export const getDriver = (id) => getById(COLLECTIONS.DRIVERS, id);
export const createDriver = (data) => create(COLLECTIONS.DRIVERS, data);
export const updateDriver = (id, data) => update(COLLECTIONS.DRIVERS, id, data);
export const deleteDriver = (id) => remove(COLLECTIONS.DRIVERS, id);

// ─── Loads ───────────────────────────────────────────────────────────────────

export const getLoads = () => getAll(COLLECTIONS.LOADS);
export const getLoad = (id) => getById(COLLECTIONS.LOADS, id);
export const createLoad = (data) => create(COLLECTIONS.LOADS, data);
export const updateLoad = (id, data) => update(COLLECTIONS.LOADS, id, data);
export const deleteLoad = (id) => remove(COLLECTIONS.LOADS, id);

// ─── Invoices ────────────────────────────────────────────────────────────────

export const getInvoices = () => getAll(COLLECTIONS.INVOICES);
export const getInvoice = (id) => getById(COLLECTIONS.INVOICES, id);
export const createInvoice = (data) => create(COLLECTIONS.INVOICES, data);
export const updateInvoice = (id, data) => update(COLLECTIONS.INVOICES, id, data);
export const deleteInvoice = (id) => remove(COLLECTIONS.INVOICES, id);

// ─── Vehicles ────────────────────────────────────────────────────────────────

export const getVehicles = () => getAll(COLLECTIONS.VEHICLES);
export const getVehicle = (id) => getById(COLLECTIONS.VEHICLES, id);
export const createVehicle = (data) => create(COLLECTIONS.VEHICLES, data);
export const updateVehicle = (id, data) => update(COLLECTIONS.VEHICLES, id, data);
export const deleteVehicle = (id) => remove(COLLECTIONS.VEHICLES, id);

// ─── Incidents ───────────────────────────────────────────────────────────────

export const getIncidents = () => getAll(COLLECTIONS.INCIDENTS);
export const getIncident = (id) => getById(COLLECTIONS.INCIDENTS, id);
export const createIncident = (data) => create(COLLECTIONS.INCIDENTS, data);
export const updateIncident = (id, data) => update(COLLECTIONS.INCIDENTS, id, data);
export const deleteIncident = (id) => remove(COLLECTIONS.INCIDENTS, id);

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const getTasks = () => getAll(COLLECTIONS.TASKS);
export const getTask = (id) => getById(COLLECTIONS.TASKS, id);
export const createTask = (data) => create(COLLECTIONS.TASKS, data);
export const updateTask = (id, data) => update(COLLECTIONS.TASKS, id, data);
export const deleteTask = (id) => remove(COLLECTIONS.TASKS, id);

export async function getTasksByStatus(status) {
  const q = query(
    collection(getDb(), COLLECTIONS.TASKS),
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
// ─── Driver Documents (subcollection) ─────────────────────────────────────────

export async function getDriverDocuments(driverId) {
  const q = query(
    collection(getDb(), `${COLLECTIONS.DRIVERS}/${driverId}/documents`),
    orderBy('uploadedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addDriverDocument(driverId, data) {
  const ref = await addDoc(
    collection(getDb(), `${COLLECTIONS.DRIVERS}/${driverId}/documents`),
    { ...data, uploadedAt: serverTimestamp() }
  );
  return ref.id;
}

export async function deleteDriverDocument(driverId, docId) {
  await deleteDoc(
    doc(getDb(), `${COLLECTIONS.DRIVERS}/${driverId}/documents`, docId)
  );
}

// ─── Vehicle Documents (subcollection) ────────────────────────────────────────

export async function getVehicleDocuments(vehicleId) {
  const q = query(
    collection(getDb(), `${COLLECTIONS.VEHICLES}/${vehicleId}/documents`),
    orderBy('uploadedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addVehicleDocument(vehicleId, data) {
  const ref = await addDoc(
    collection(getDb(), `${COLLECTIONS.VEHICLES}/${vehicleId}/documents`),
    { ...data, uploadedAt: serverTimestamp() }
  );
  return ref.id;
}

export async function deleteVehicleDocument(vehicleId, docId) {
  await deleteDoc(
    doc(getDb(), `${COLLECTIONS.VEHICLES}/${vehicleId}/documents`, docId)
  );
}
