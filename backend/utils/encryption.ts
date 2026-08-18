// NÃO UTILIZADO
// // backend/src/utils/encryption.ts
// import crypto from 'crypto';
// 
// const algorithm = 'aes-256-gcm';
// const KEY = process.env.ENCRYPTION_KEY;
// if (!KEY) {
//   throw new Error('ENCRYPTION_KEY não definida nas variáveis de ambiente');
// }
// const key = crypto.scryptSync(KEY, 'arisa-encryption-salt', 32);
// 
// export function encrypt(text: string): string {
//   const iv = crypto.randomBytes(16);
//   const cipher = crypto.createCipheriv(algorithm, key, iv);
//   const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
//   const authTag = cipher.getAuthTag();
//   return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
// }
// 
// export function decrypt(text: string): string {
//   const [ivHex, authTagHex, encryptedHex] = text.split(':');
//   const iv = Buffer.from(ivHex, 'hex');
//   const authTag = Buffer.from(authTagHex, 'hex');
//   const decipher = crypto.createDecipheriv(algorithm, key, iv);
//   decipher.setAuthTag(authTag);
//   const decrypted = Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]);
//   return decrypted.toString('utf8');
// }
