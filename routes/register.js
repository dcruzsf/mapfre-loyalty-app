const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const salesforceLoyalty = require('../modules/salesforceLoyalty');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Importar configuración de marca
const brandConfig = require('../config/brand');

// Mostrar formulario de registro (solo si no está autenticado)
router.get('/', redirectIfAuthenticated, (req, res) => {
  const message = req.query.message;
  res.render('register', { 
    currentPage: 'register',
    message: message || null
  });
});

// Procesar formulario de registro con manejo mejorado de errores
router.post('/', redirectIfAuthenticated, async (req, res) => {
  const { name, email, preferences } = req.body;
  
  // Validaciones básicas
  if (!name || !email) {
    return res.render('register', { 
      error: 'Nombre y email son obligatorios',
      formData: req.body,
      currentPage: 'register'
    });
  }
  
  // Verificar si ya existe un miembro con este email
  const existingMember = Member.findByEmail(email);
  if (existingMember) {
    return res.render('register', {
      error: 'Ya existe una cuenta con este email. Usa un email diferente.',
      formData: req.body,
      currentPage: 'register'
    });
  }
  
  // Verificar si debemos usar Salesforce o el modo demo
  const useSalesforce = process.env.USE_SALESFORCE === 'true';
  let sfMemberId = null;
  let salesforceError = null;
  
  if (useSalesforce) {
    try {
      console.log('🚀 Iniciando registro en Salesforce Loyalty Management...');
      
      // Configurar timeout para toda la operación de Salesforce
      const salesforcePromise = salesforceLoyalty.enrollMember({
        name,
        email,
        preferences: preferences || []
      });
      
      // Timeout global para evitar que Heroku corte la conexión
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('El registro está tardando demasiado. Por favor, inténtalo de nuevo.'));
        }, 25000); // 25 segundos
      });
      
      const sfResponse = await Promise.race([salesforcePromise, timeoutPromise]);
      
      console.log('✅ Miembro registrado exitosamente en Salesforce');
      
      // Guardar el ID del miembro de Salesforce
      sfMemberId = sfResponse.loyaltyProgramMemberId || sfResponse.id;
      
      if (sfMemberId) {
        console.log('🆔 ID del miembro en Salesforce:', sfMemberId);
      } else {
        console.log('⚠️ No se pudo determinar el ID del miembro en Salesforce.');
        console.log('📋 Respuesta completa:', JSON.stringify(sfResponse, null, 2));
      }

    } catch (sfError) {
      console.error('❌ Error al registrar en Salesforce:', sfError.message);
      salesforceError = sfError.message;
      
      // En lugar de fallar completamente, continuamos con registro local
      // pero informamos al usuario del problema
      console.log('📝 Continuando con registro local debido a error de Salesforce');
    }
  }
  
  try {
    // Crear nuevo miembro en nuestra aplicación local
    const newMember = new Member(name, email, preferences || []);
    
    // Si hemos creado el miembro en Salesforce, guardar su ID y sincronizar currencies
    if (sfMemberId) {
      newMember.salesforceId = sfMemberId;

      // Sincronizar currencies desde Salesforce (PHASE 2)
      try {
        await salesforceLoyalty.syncMemberPoints(newMember, sfMemberId);
        console.log('✅ Currencies sincronizadas después del enrollment');
      } catch (syncError) {
        console.warn('⚠️ No se pudieron sincronizar currencies después del enrollment:', syncError.message);
        // No bloquear el flujo, continuar con valores por defecto
      }

      // Enrollar en la promoción CaixaBank Hero (PHASE 3)
      if (process.env.SF_PROMOTION_ID) {
        try {
          await salesforceLoyalty.enrollMemberInPromotion(sfMemberId, process.env.SF_PROMOTION_ID);
          console.log('✅ Miembro enrollado en promoción CaixaBank Hero');
        } catch (promoError) {
          console.warn('⚠️ No se pudo enrollar en la promoción:', promoError.message);
          // No bloquear el flujo
        }
      }
    }

    // Guardar miembro localmente
    Member.save(newMember);

    // Crear sesión para el nuevo miembro
    req.session.memberId = newMember.id;
    
    console.log(`✅ Nuevo miembro registrado localmente: ${newMember.name} (ID: ${newMember.id})`);
    
    // Determinar mensaje de bienvenida basado en si hubo error de Salesforce
    let welcomeMessage = brandConfig.messages.welcome;
    let redirectUrl = `/?message=${encodeURIComponent(welcomeMessage)}&newAchievement=true&achievementName=Bienvenida&achievementPoints=25`;
    
    if (salesforceError) {
      // Agregar información sobre el problema de Salesforce
      const warningMessage = `${welcomeMessage} (Nota: Hubo un problema conectando con Salesforce, pero tu cuenta se creó correctamente en modo local)`;
      redirectUrl = `/?message=${encodeURIComponent(warningMessage)}&newAchievement=true&achievementName=Bienvenida&achievementPoints=25`;
    }
    
    res.redirect(redirectUrl);
    
  } catch (error) {
    console.error('❌ Error al registrar miembro localmente:', error);
    
    let errorMessage = 'Error interno al crear la cuenta';
    
    if (salesforceError) {
      errorMessage = `Error de Salesforce: ${salesforceError}`;
    }
    
    res.render('register', { 
      error: errorMessage,
      formData: req.body,
      currentPage: 'register'
    });
  }
});

module.exports = router;