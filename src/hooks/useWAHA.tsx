// Webhook Handler Simple para WAHA - Para usar en n8n
// Este código se puede usar en un nodo de "Function" en n8n

// Función principal del webhook handler
function processWAHAWebhook() {
    const webhookData = $input.first().json;
    
    console.log('📱 WAHA Webhook recibido:', webhookData.event);
    
    // Verificar si es un evento de WhatsApp válido
    if (!webhookData || !webhookData.event) {
      console.log('❌ Webhook inválido - sin evento');
      return { skip: true, reason: 'invalid_webhook' };
    }
    
    const eventType = webhookData.event;
    
    // Solo procesar mensajes, ignorar otros eventos
    if (eventType !== 'message') {
      console.log(`⚠️ Evento ignorado: ${eventType}`);
      return { skip: true, reason: 'not_message_event' };
    }
    
    return handleMessage(webhookData);
  }
  
  // Manejar mensajes entrantes
  function handleMessage(data) {
    const payload = data.payload;
    
    // Verificar estructura del mensaje
    if (!payload || !payload.from || !payload.body) {
      console.log('❌ Mensaje inválido - faltan campos requeridos');
      return { skip: true, reason: 'invalid_message' };
    }
    
    // Filtrar mensajes del bot (evitar loops)
    if (payload.fromMe) {
      console.log('🔄 Mensaje propio ignorado');
      return { skip: true, reason: 'own_message' };
    }
    
    // Filtrar mensajes de estado de WhatsApp
    if (payload.from === 'status@broadcast') {
      console.log('📢 Estado de WhatsApp ignorado');
      return { skip: true, reason: 'status_message' };
    }
    
    // Extraer información básica del mensaje
    const messageData = {
      // Identificadores básicos
      messageId: payload.id,
      from: payload.from,
      to: payload.to,
      
      // Contenido
      body: payload.body,
      type: payload.type || 'text',
      
      // Información del contacto
      pushName: payload._data?.notifyName || payload.pushName || 'Usuario',
      
      // Timestamp
      timestamp: payload.timestamp || Math.floor(Date.now() / 1000)
    };
    
    // Verificar si es un mensaje de texto válido
    if (messageData.type !== 'chat' && messageData.type !== 'text') {
      console.log(`📎 Mensaje tipo ${messageData.type} - respuesta automática`);
      
      return {
        chatId: messageData.from,
        responseText: "Lo siento, solo puedo procesar mensajes de texto. ¿En qué puedo ayudarte?",
        autoResponse: true,
        processWithAI: false
      };
    }
    
    // Mensaje válido para procesamiento
    console.log(`💬 Mensaje de ${messageData.pushName}: ${messageData.body.substring(0, 50)}...`);
    
    return {
      chatId: messageData.from,
      userName: messageData.pushName,
      messageText: messageData.body,
      messageId: messageData.messageId,
      autoResponse: false,
      processWithAI: true
    };
  }
  
  // Ejecutar el procesamiento
  try {
    const result = processWAHAWebhook();
    
    console.log('✅ Resultado del webhook:', result);
    
    return result;
    
  } catch (error) {
    console.error('❌ Error procesando webhook:', error.message);
    
    return {
      skip: true,
      error: true,
      errorMessage: error.message
    };
  }
  
  // Configuración para n8n:
  // 
  // 1. Webhook Trigger:
  //    - Method: POST
  //    - Path: /webhook/whatsapp
  //    - Response: Return data from last node
  //
  // 2. Function Node (este código)
  //
  // 3. IF Node para evaluar result.autoResponse:
  //    - TRUE → Enviar respuesta directa con WAHA
  //    - FALSE → Continuar al flujo de IA
  //
  // 4. Para respuesta directa:
  //    - WAHA Send Message:
  //      * Session: clinic-session  
  //      * Chat ID: {{ $node["Function"].json["chatId"] }}
  //      * Message: {{ $node["Function"].json["responseText"] }}
  //
  // 5. Para flujo de IA:
  //    - Usar: {{ $node["Function"].json["messageText"] }}
  //    - Usuario: {{ $node["Function"].json["userName"] }}
  //    - Chat: {{ $node["Function"].json["chatId"] }}