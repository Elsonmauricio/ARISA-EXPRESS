import app from './server';
import { db } from './config/firebase';
import { WhatsAppService } from './services/whatsappService';

process.on('uncaughtException', (err: any) => {
  console.error('⚠️ Uncaught Exception:', err.message);
});
process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ Unhandled Rejection:', reason?.message || reason);
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  db.collection('health_check').doc('status').get()
    .then(() => console.log(`✅ Conectado ao Cloud Firestore com sucesso`))
    .catch((err: any) => {
      console.error(`❌ Falha ao conectar ao Cloud Firestore:`, err.message);
    });

  if (WhatsAppService.isConfigured()) {
    WhatsAppService.initialize()
      .then(() => console.log(`✅ Servico de WhatsApp inicializado`))
      .catch((err: any) => console.error(`❌ Whatsapp init recusado (usando link fallback)`, err.message));
  } else {
    console.log(`ℹ️ WhatsApp automation desativado - link fallback ativo`);
  }
});
