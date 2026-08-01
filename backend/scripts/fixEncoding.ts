import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { fixEncodingObject } from '../utils/encoding';

async function fixDocument(doc: FirebaseFirestore.DocumentSnapshot): Promise<number> {
  const data = doc.data();
  if (!data) return 0;

  const fixed = fixEncodingObject(data);
  let changes = 0;

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fixed as Record<string, unknown>)) {
    const original = (data as Record<string, unknown>)[key];
    if (JSON.stringify(value) !== JSON.stringify(original)) {
      updates[key] = value;
      changes++;
      const origStr = typeof original === 'string' ? original.substring(0, 60) : String(original);
      const fixedStr = typeof value === 'string' ? value.substring(0, 60) : String(value);
      console.log(`  [${doc.id}] ${key}: "${origStr}" -> "${fixedStr}"`);
    }
  }

  if (changes > 0) {
    await doc.ref.update(updates);
  }

  return changes;
}

async function main() {
  console.log('Starting Firestore encoding fix...\n');

  const db = getFirestore();
  const shipmentsRef = db.collection('shipments');
  const snapshot = await shipmentsRef.get();

  let totalFixed = 0;
  let totalDocs = 0;

  for (const doc of snapshot.docs) {
    totalDocs++;
    const changes = await fixDocument(doc);
    totalFixed += changes;
  }

  console.log(`\nDone! Fixed ${totalFixed} fields across ${totalDocs} documents.`);
}

main().catch((error: Error) => {
  console.error('Error:', error.message);
  process.exit(1);
});