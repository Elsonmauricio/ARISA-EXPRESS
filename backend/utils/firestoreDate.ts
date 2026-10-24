// backend/src/utils/firestoreDate.ts
import { Timestamp } from 'firebase-admin/firestore';

// Converte um valor do Firestore (Timestamp, Date, string, number) para Date ou null.
export function toFirestoreDate(
  ts: { toDate?: () => Date; toMillis?: () => number } | Date | string | number | null | undefined
): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (typeof ts === 'number') return new Date(ts);
  if (typeof ts === 'object') {
    if (typeof ts.toDate === 'function') return ts.toDate();
    if (typeof ts.toMillis === 'function') return new Date(ts.toMillis());
  }
  return null;
}

// Converte para ISO string ou null.
export function toIsoString(
  ts: { toDate?: () => Date; toMillis?: () => number } | Date | string | number | null | undefined
): string | null {
  const d = toFirestoreDate(ts);
  return d ? d.toISOString() : null;
}

// Converte para número de millis ou 0 (usado em ordenações).
export function toMillis(ts: unknown): number {
  if (!ts) return 0;
  if (ts instanceof Date) return ts.getTime();
  if (typeof ts === 'string') return new Date(ts).getTime();
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'object') {
    const obj = ts as { toDate?: () => Date; toMillis?: () => number };
    if (typeof obj.toDate === 'function') return obj.toDate().getTime();
    if (typeof obj.toMillis === 'function') return obj.toMillis();
  }
  return 0;
}

// Alias para Date (usado em controladores que precisam de Date, não Date | null).
export function toTimestampDate(
  ts: { toDate?: () => Date; toMillis?: () => number } | Date | string | number | null | undefined
): Date | null {
  return toFirestoreDate(ts);
}

export type FirestoreDate = Timestamp | Date | string | number | null | undefined;
