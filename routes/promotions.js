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
        const trail = await salesforceLoyalty.getEngagementTrail(membershipNumber, promo.promotionId);
        if (trail) {
          // Combinar datos de la promoción con su trail
          promotionsWithTrails.push({
            ...promo,
            ...trail
          });
        }
      }

      promotions = promotionsWithTrails;
      console.log(`📊 Total promociones con trails: ${promotions.length}`);

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
