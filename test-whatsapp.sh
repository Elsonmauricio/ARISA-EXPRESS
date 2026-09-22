#!/bin/bash
echo "============================================"
echo "  TESTE WHATSAPP - Template encomenda_disponivel_lisboa"
echo "============================================"

TOKEN="EAAXA5S5EN7cBSZA6f10JiAio9vZA4NeGoAOAPNZAlZCcgFAuYEU5t4sHLfnMjZCmDgaPNhg1BFWyH8FSGAIKMArMWn2BWQWz2QeyTrM2Flru2cT3CbD3nkhXKrYSdHw4sTiwW0uw0Kaprm7ojqQC5IBfvGWUhsvvDeux0DtqoHTZB0ZBMRAJSg0Ov97YWyv4AZDZD"
PHONE_NUMBER_ID="391662534038300"
API_VERSION="v26.0"
TEST_PHONE="351934292082"

echo ""
echo "--- TESTE 1: Meta Graph API - Disparo direto do template ---"
echo "URL: https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages"
echo ""

curl -s -X POST \
  "https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "'"${TEST_PHONE}"'",
    "type": "template",
    "template": {
      "name": "encomenda_disponivel_lisboa",
      "language": { "code": "pt_PT" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "João Silva" },
            { "type": "text", "text": "BR-20250920-001" },
            { "type": "text", "text": "20/09/2026" },
            { "type": "text", "text": "25/09/2026" },
            { "type": "text", "text": "Arisa Express" },
            { "type": "text", "text": "João Silva" },
            { "type": "text", "text": "Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros" },
            { "type": "text", "text": "+351 934 292 082" }
          ]
        }
      ]
    }
  }' | python3 -m json.tool 2>/dev/null || curl -s -X POST \
  "https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "'"${TEST_PHONE}"'",
    "type": "template",
    "template": {
      "name": "encomenda_disponivel_lisboa",
      "language": { "code": "pt_PT" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "João Silva" },
            { "type": "text", "text": "BR-20250920-001" },
            { "type": "text", "text": "20/09/2026" },
            { "type": "text", "text": "25/09/2026" },
            { "type": "text", "text": "Arisa Express" },
            { "type": "text", "text": "João Silva" },
            { "type": "text", "text": "Centro Comercial Flamingos, Loja 47, Avenida Salgado Zenha 2, 2660-328 Santo António dos Cavaleiros" },
            { "type": "text", "text": "+351 934 292 082" }
          ]
        }
      ]
    }
  }'

echo ""
echo ""
echo "--- TESTE 2: Backend API - POST /api/notify-whatsapp ---"
echo "URL: https://arisa-backend.vercel.app/api/notify-whatsapp"
echo ""

curl -s -X POST \
  "https://arisa-backend.vercel.app/api/notify-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "BR-20250920-001",
    "customerPhone": "+351934292082",
    "destination": "Lisboa"
  }' | python3 -m json.tool 2>/dev/null || curl -s -X POST \
  "https://arisa-backend.vercel.app/api/notify-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "BR-20250920-001",
    "customerPhone": "+351934292082",
    "destination": "Lisboa"
  }'

echo ""
echo ""
echo "--- TESTE 3: Verificação do Webhook ---"
echo "URL: https://arisa-backend.vercel.app/api/webhook/webhook (GET - verificação)"
echo ""

curl -s -X GET \
  "https://arisa-backend.vercel.app/api/webhook/webhook?hub.mode=subscribe&hub.verify_token=arisa-express&hub/challenge=test123" | python3 -m json.tool 2>/dev/null || curl -s -X GET \
  "https://arisa-backend.vercel.app/api/webhook/webhook?hub.mode=subscribe&hub.verify_token=arisa-express&hub/challenge=test123"

echo ""
echo ""
echo "--- TESTE 4: Backend API - POST /api/notify-whatsapp (sem destination, para Luanda) ---"
echo ""

curl -s -X POST \
  "https://arisa-backend.vercel.app/api/notify-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "BR-20250920-002",
    "customerPhone": "+244948440920",
    "destination": "Luanda"
  }' | python3 -m json.tool 2>/dev/null || curl -s -X POST \
  "https://arisa-backend.vercel.app/api/notify-whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "orderCode": "BR-20250920-002",
    "customerPhone": "+244948440920",
    "destination": "Luanda"
  }'

echo ""
echo ""
echo "============================================"
echo "  TESTES CONCLUÍDOS"
echo "============================================"