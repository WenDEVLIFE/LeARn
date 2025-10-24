/**
 * Client helpers that use Firebase (Firestore + Storage) directly
 * Mirrors basic CRUD, upload, OTP & notification semantics from backend/routes/databaseRoutes.js
 *
 * Note:
 * - This uses the firebase app exported from ./firebaseConfig.ts
 * - For production email sending you should use Cloud Functions or a server-side SMTP service.
 */

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  limit as limitQuery,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
// remove firebase storage imports — uploads go to backend assets folder
import { app } from './firebaseConfig';
const BACKEND_URL =
  (typeof process !== 'undefined' && (process.env.BACKEND as string)) ||
  (typeof process !== 'undefined' && (process.env.REACT_APP_BACKEND as string)) ||
  'http://localhost:3000/api';

type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
};

const db = getFirestore(app);

/* helpers */
const ok = <T = any>(message: string, data?: T): ApiResponse<T> => ({ success: true, message, data });
const fail = (message: string, statusData?: any): ApiResponse => ({ success: false, message, data: statusData });

/* SELECT: fetch documents from a collection with optional simple equality conditions
   conditions: { field: value, ... }
*/
export async function select(collectionName: string, conditions: Record<string, any> = {}) {
  try {
    const colRef = collection(db, collectionName);
    let qRef = colRef;
    const whereClauses = Object.entries(conditions).map(([k, v]) => where(k, '==', v));
    if (whereClauses.length) qRef = query(colRef, ...whereClauses);
    const snap = await getDocs(qRef);
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!rows.length) return fail('No records found');
    return ok('Records fetched successfully', rows);
  } catch (err: any) {
    return fail(`Error: ${err.message}`);
  }
}

/* INSERT: add document to collection */
export async function insert(collectionName: string, data: Record<string, any>) {
  try {
    const payload = { ...data, createdAt: serverTimestamp() };
    const ref = await addDoc(collection(db, collectionName), payload);
    return ok('Record inserted successfully', { id: ref.id });
  } catch (err: any) {
    return fail(`Insert failed: ${err.message}`);
  }
}

/* UPDATE: update documents matching conditions
   conditions:
     - { id: 'docId' } will update that single document
     - otherwise, will query for docs matching equality conditions and update each
*/
export async function update(collectionName: string, data: Record<string, any>, conditions: Record<string, any>) {
  try {
    if (!Object.keys(conditions).length) return fail('No conditions provided');
    let updated = 0;

    if (conditions.id || conditions._id) {
      const id = conditions.id || conditions._id;
      const dRef = doc(db, collectionName, id);
      await updateDoc(dRef, { ...data, updatedAt: serverTimestamp() });
      updated = 1;
    } else {
      // query matching docs
      const whereClauses = Object.entries(conditions).map(([k, v]) => where(k, '==', v));
      const qRef = query(collection(db, collectionName), ...whereClauses);
      const snap = await getDocs(qRef);
      const promises = snap.docs.map(d => updateDoc(doc(db, collectionName, d.id), { ...data, updatedAt: serverTimestamp() }).then(() => 1).catch(() => 0));
      const results = await Promise.all(promises);
      updated = results.reduce((a, b) => a + b, 0);
    }

    return ok('Record(s) updated successfully', { affected: updated });
  } catch (err: any) {
    return fail(`Update failed: ${err.message}`);
  }
}

/* DELETE: delete documents matching conditions (supports id or query) */
export async function remove(collectionName: string, conditions: Record<string, any>) {
  try {
    if (!Object.keys(conditions).length) return fail('No conditions provided');
    let deleted = 0;

    if (conditions.id || conditions._id) {
      const id = conditions.id || conditions._id;
      await deleteDoc(doc(db, collectionName, id));
      deleted = 1;
    } else {
      const whereClauses = Object.entries(conditions).map(([k, v]) => where(k, '==', v));
      const qRef = query(collection(db, collectionName), ...whereClauses);
      const snap = await getDocs(qRef);
      const promises = snap.docs.map(d => deleteDoc(doc(db, collectionName, d.id)).then(() => 1).catch(() => 0));
      const results = await Promise.all(promises);
      deleted = results.reduce((a, b) => a + b, 0);
    }

    return ok('Record(s) deleted successfully', { deleted });
  } catch (err: any) {
    return fail(`Delete failed: ${err.message}`);
  }
}

/* CUSTOM: simple custom query helper for Firestore
   options: { where?: [field, value][], orderBy?: [field, 'asc'|'desc'], limit?: number }
*/
export async function custom(collectionName: string, options: any = {}) {
  try {
    const col = collection(db, collectionName);
    const clauses: any[] = [];

    if (options.where && Array.isArray(options.where)) {
      options.where.forEach(([field, op, value]: any) => {
        // allow [field, value] (defaults to '==') or [field, op, value]
        if (value === undefined) {
          clauses.push(where(field, '==', op));
        } else {
          clauses.push(where(field, op, value));
        }
      });
    }

    if (options.orderBy) {
      const [f, dir] = options.orderBy;
      clauses.push(orderBy(f, dir || 'asc'));
    }

    if (options.limit) {
      clauses.push(limitQuery(options.limit));
    }

    const qRef = clauses.length ? query(col, ...clauses) : query(col);
    const snap = await getDocs(qRef);
    const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ok('Custom query executed successfully', rows);
  } catch (err: any) {
    return fail(`Custom query failed: ${err.message}`);
  }
}

/* Upload single file to Firebase Storage under /uploads/{collectionName}/{timestamp}_{name} */
export async function uploadFile(file: File, targetFolder = 'assets') {
  try {
    const form = new FormData();
    form.append('file', file as any);
    form.append('folder', targetFolder);

    // ensure BACKEND_URL doesn't duplicate /api if already present
    const url = BACKEND_URL.endsWith('/upload') ? BACKEND_URL : `${BACKEND_URL.replace(/\/$/, '')}/upload`;

    const res = await fetch(url, {
      method: 'POST',
      body: form
    });

    if (!res.ok) {
      const txt = await res.text();
      return fail(`Upload failed: ${res.status} ${txt}`);
    }

    const json = await res.json();
    return ok('File uploaded successfully', json.data ?? json);
  } catch (err: any) {
    return fail(`Upload failed: ${err?.message ?? String(err)}`);
  }
}

/* OTP helpers (stored in 'otps' collection). For production, implement server-side email sending. */
export async function sendOtp(email: string) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes (ms)
    await addDoc(collection(db, 'otps'), { email, otp, expiresAt, createdAt: serverTimestamp() });

    // For production you should NOT return the OTP. Instead trigger an email via Cloud Function.
    const devReturn = (typeof process !== 'undefined' && (process.env.NODE_ENV !== 'production'));
    return ok('OTP stored successfully', devReturn ? { otp } : {});
  } catch (err: any) {
    return fail(`Failed to store OTP: ${err.message}`);
  }
}

export async function verifyOtp(email: string, otp: string) {
  try {
    const q = query(collection(db, 'otps'), where('email', '==', email), where('otp', '==', otp), orderBy('createdAt', 'desc'), limitQuery(1));
    const snap = await getDocs(q);
    if (snap.empty) return fail('OTP not found or expired');

    const d = snap.docs[0].data();
    const expiresAt = d.expiresAt ?? 0;
    if (Date.now() > expiresAt) return fail('OTP has expired');

    // Optionally delete used OTP (cleanup)
    await deleteDoc(doc(db, 'otps', snap.docs[0].id));

    return ok('OTP verified successfully');
  } catch (err: any) {
    return fail(`OTP verification failed: ${err.message}`);
  }
}

/* Notifications: store in 'notifications' collection. Use Cloud Functions to send email if needed. */
export async function sendAdoptionNotification(opts: { email: string; userName: string; petName: string; applicationStatus: string; }) {
  try {
    const payload = { ...opts, type: 'adoption', createdAt: serverTimestamp() };
    await addDoc(collection(db, 'notifications'), payload);
    return ok('Notification stored successfully');
  } catch (err: any) {
    return fail(`Failed to store notification: ${err.message}`);
  }
}

export async function sendCustomNotification(opts: { email: string; userName?: string; petName?: string; subject?: string; message: string; applicationType?: number; }) {
  try {
    const payload = { ...opts, type: 'custom', createdAt: serverTimestamp() };
    await addDoc(collection(db, 'notifications'), payload);
    return ok('Custom notification stored successfully');
  } catch (err: any) {
    return fail(`Failed to store custom notification: ${err.message}`);
  }
}

/* Usage notes:
 - This file talks directly to Firestore + Storage. For email sending or complex server logic, add a server-side component (Cloud Function/SMTP).
 - Field-level security and validation should be enforced with Firestore Security Rules.
 */