import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Certifique-se de ter a variável FIREBASE_SERVICE_ACCOUNT no seu .env como uma string JSON
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');


if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

const db = admin.firestore();
const auth = admin.auth();
export { db, auth, admin };