import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

let serviceAccount: ServiceAccount | undefined;
let firebaseInitialized = false;

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
      client_id: '',
      private_key_id: ''
    } as ServiceAccount;
  } else {
    logger.error('❌ [ERRO CRÍTICO]: Credenciais do Firebase não encontradas.');
    logger.error('   Configure FIREBASE_SERVICE_ACCOUNT_KEY ou FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY + FIREBASE_PROJECT_ID no Vercel Environment Variables.');
  }
}

const databaseURL = process.env.FIREBASE_DATABASE_URL || (serviceAccount?.projectId ? `https://${serviceAccount.projectId}.firebaseio.com` : undefined);

if (serviceAccount && getApps().length === 0) {
  try {
    initializeApp({
      credential: cert(serviceAccount),
      databaseURL
    });
    firebaseInitialized = true;
    logger.info(`🔥 Firebase Admin inicializado para o projeto: ${serviceAccount.projectId || 'arisa-express'}`);
  } catch (err) {
    logger.error('❌ [ERRO] Falha ao inicializar Firebase:', err);
  }
} else if (getApps().length > 0) {
  firebaseInitialized = true;
}

let db: any;
let auth: any;

if (firebaseInitialized) {
  db = getFirestore();
  auth = getAuth();
} else {
  logger.error('⚠️ Firestore e Auth não inicializados — as variáveis de ambiente podem estar ausentes.');
}

export { db, auth, firebaseInitialized };
