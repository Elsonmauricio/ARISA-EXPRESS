import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

// Certifique-se de ter a variável FIREBASE_SERVICE_ACCOUNT no seu .env como uma string JSON
const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountVar) {
  throw new Error('❌ [ERRO]: A variável FIREBASE_SERVICE_ACCOUNT_KEY não foi encontrada no arquivo .env. Verifique se o arquivo existe na pasta /backend.');
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountVar);
} catch (error) {
  throw new Error('❌ [ERRO]: A variável FIREBASE_SERVICE_ACCOUNT_KEY no .env não é um JSON válido. Certifique-se de que o JSON está em uma ÚNICA LINHA e entre aspas simples.');
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
  logger.info(`🔥 Firebase Admin inicializado para o projeto: ${serviceAccount.project_id}`);
}

export const db = getFirestore();
export const auth = getAuth();