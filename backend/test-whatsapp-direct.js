require('dotenv').config({ path: __dirname + '/.env' });
const { WhatsAppService } = require('./dist/services/whatsappService');
const { logger } = require('./dist/utils/logger');

async function test() {
  console.log('=== WhatsApp Service Direct Test ===');
  console.log('WHATSAPP_TOKEN set:', process.env.WHATSAPP_TOKEN ? 'YES (length: ' + process.env.WHATSAPP_TOKEN.length + ')' : 'NO');
  console.log('WHATSAPP_PHONE_NUMBER_ID set:', process.env.WHATSAPP_PHONE_NUMBER_ID ? 'YES' : 'NO');
  console.log('WHATSAPP_API_VERSION:', process.env.WHATSAPP_API_VERSION || 'not set');
  console.log('WHATSAPP_READY_TEMPLATE_LISBOA:', process.env.WHATSAPP_READY_TEMPLATE_LISBOA || 'not set');
  console.log('WHATSAPP_READY_TEMPLATE_LANG_LISBOA:', process.env.WHATSAPP_READY_TEMPLATE_LANG_LISBOA || 'not set');
  console.log('isConfigured:', WhatsAppService.isConfigured());
  console.log('');

  // Test 1: Direct template message via Meta API
  console.log('--- Test 1: Direct sendTemplateMessage ---');
  const result1 = await WhatsAppService.sendTemplateMessage({
    to: '+351934292082',
    templateName: 'encomenda_disponivel_lisboa',
    languageCode: 'pt_PT',
    components: [{
      type: 'body',
      parameters: [
        { type: 'text', text: 'João Silva' },
        { type: 'text', text: 'BR-20250920-001' },
        { type: 'text', text: '20/09/2026' },
        { type: 'text', text: '25/09/2026' },
        { type: 'text', text: 'Arisa Express' },
        { type: 'text', text: 'João Silva' },
        { type: 'text', text: 'Centro Comercial Flamingos, Loja 47' },
        { type: 'text', text: '+351 934 292 082' }
      ]
    }]
  });
  console.log('Result:', JSON.stringify(result1, null, 2));

  // Test 2: sendPickupTemplate (high-level method)
  console.log('\n--- Test 2: sendPickupTemplate ---');
  const result2 = await WhatsAppService.sendPickupTemplate({
    phone: '+351934292082',
    trackingCode: 'BR-20250920-001',
    shipmentDate: '20/09/2026',
    deadline: '25/09/2026',
    senderName: 'Arisa Express',
    receiverName: 'João Silva',
    pickupAddress: 'Centro Comercial Flamingos, Loja 47',
    pickupContact: '+351 934 292 082',
    pickupSchedule: 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00',
    location: 'lisbon',
    destination: 'Lisboa'
  });
  console.log('Result:', JSON.stringify(result2, null, 2));

  // Test 3: sendPickupNotification (controller-level method)
  console.log('\n--- Test 3: sendPickupNotification ---');
  const result3 = await WhatsAppService.sendPickupNotification({
    phone: '+351934292082',
    trackingCode: 'BR-20250920-001',
    shipmentDate: '20/09/2026',
    deadline: '25/09/2026',
    senderName: 'Arisa Express',
    receiverName: 'João Silva',
    pickupAddress: 'Centro Comercial Flamingos, Loja 47',
    pickupContact: '+351 934 292 082',
    pickupSchedule: 'Segunda a Sexta: 09:00 - 13:00 | 14:00 - 18:00',
    location: 'lisbon',
    destination: 'Lisboa'
  });
  console.log('Result:', JSON.stringify(result3, null, 2));
}

test().catch(err => { console.error(err); process.exit(1); });