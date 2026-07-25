import app from './server';
import { db } from './config/firebase';

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  db.collection('health_check').doc('status').get()
    .then(() => console.log('✅ Conectado ao Cloud Firestore com sucesso'))
    .catch((err: any) => {
      console.error('❌ Falha ao conectar ao Cloud Firestore:', err.message);
    });
});