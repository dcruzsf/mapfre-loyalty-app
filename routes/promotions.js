const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Mostrar página de promociones (cumulative promotions)
router.get('/', async (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

  let promotions = [];
  let errorMessage = null;

  // Obtener promociones desde Salesforce si está disponible
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      // Paso 1: Obtener promociones enrolladas usando program-processes
      console.log(`📝 Salesforce Member ID: ${member.salesforceId}`);
      const enrolledPromotions = await salesforceLoyalty.getEnrolledPromotions(member.salesforceId);
      console.log(`📊 Total promociones enrolladas: ${enrolledPromotions.length}`);

      // Paso 2: Obtener membershipNumber para las llamadas de engagement trail
      const membershipNumber = await salesforceLoyalty.getMembershipNumber(member.salesforceId);
      console.log(`📝 MembershipNumber: ${membershipNumber}`);

      // Paso 3: Para cada promoción enrollada, obtener su engagement trail
      const promotionsWithTrails = [];
      for (const promo of enrolledPromotions) {
        console.log(`\n🔄 Procesando promoción: ${promo.promotionName || promo.promotionId}`);

        // Intentar primero con engagement trail API
        const trail = await salesforceLoyalty.getEngagementTrail(membershipNumber, promo.promotionId);

        if (trail) {
          console.log('✅ Engagement trail obtenido exitosamente via API');
          promotionsWithTrails.push({
            ...promo,
            ...trail
          });
        } else {
          // MÉTODO ALTERNATIVO: Si engagement trail falla, usar SOQL queries
          console.log('⚠️ Engagement trail API falló, intentando SOQL queries...');
          const soqlData = await salesforceLoyalty.getPromotionDataViaSOQL(member.salesforceId, promo.promotionId);

          if (soqlData) {
            console.log('✅ Datos obtenidos via SOQL');
            // Combinar datos de programa-processes con datos SOQL
            promotionsWithTrails.push({
              ...promo,
              soqlData: soqlData,
              dataSource: 'SOQL'
            });
          } else {
            console.log('❌ No se pudo obtener datos por ningún método');
          }
        }
      }

      promotions = promotionsWithTrails;
      console.log(`\n📊 Total promociones con trails: ${promotions.length}`);

    } catch (error) {
      console.error('⚠️ Error obteniendo promociones:', error.message);
      errorMessage = 'No se pudieron cargar las promociones. Inténtalo más tarde.';
    }
  } else {
    // Modo demo: mostrar mensaje informativo
    errorMessage = 'Las promociones solo están disponibles en modo Salesforce.';
  }

  res.render('promotions', {
    member,
    promotions,
    errorMessage,
    locale
  });
});

module.exports = router;
