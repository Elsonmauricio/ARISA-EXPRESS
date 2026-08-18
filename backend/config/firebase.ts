import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

let serviceAccount: ServiceAccount | undefined;

const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccountVar) {
  try {
    serviceAccount = JSON.parse(serviceAccountVar);
  } catch (error) {
    logger.error('❌ [ERRO]: A variável FIREBASE_SERVICE_ACCOUNT_KEY não é um JSON válido.');
  }
} else {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;

  if (clientEmail && privateKey && projectId) {
    serviceAccount = {
      clientEmail,
      privateKey,
      projectId,
      // Campos obrigatórios que não usamos mas que o tipo exige
      client_id: '',
      private_key_id: ''
    } as ServiceAccount;
  } else {
    logger.error('❌ [ERRO]: Credenciais do Firebase não encontradas. Defina FIREBASE_SERVICE_ACCOUNT_KEY ou FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID.');
  }
}

const databaseURL = process.env.FIREBASE_DATABASE_URL || (serviceAccount?.projectId ? `https://${serviceAccount.projectId}.firebaseio.com` : undefined);

if (getApps().length === 0 && serviceAccount) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL
  });
  logger.info(`🔥 Firebase Admin inicializado para o projeto: ${serviceAccount.projectId || 'arisa-express'}`);
}

export const db = getFirestore();
export const auth = getAuth();
