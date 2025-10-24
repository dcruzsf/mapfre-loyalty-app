const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Mostrar página de promociones (engagement trails)
router.get('/', async (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

  let engagementTrails = [];
  let errorMessage = null;

  // Obtener engagement trails desde Salesforce si está disponible
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      // Primero obtener el membershipNumber
      const membershipNumber = await salesforceLoyalty.getMembershipNumber(member.salesforceId);
      console.log(`📝 MembershipNumber obtenido: ${membershipNumber}`);

      // Luego obtener los engagement trails
      engagementTrails = await salesforceLoyalty.getMemberEngagementTrail(membershipNumber);
      console.log(`📊 Total trails obtenidos: ${engagementTrails.length}`);

    } catch (error) {
      console.error('⚠️ Error obteniendo engagement trails:', error.message);
      errorMessage = 'No se pudieron cargar las promociones. Inténtalo más tarde.';
    }
  } else {
    // Modo demo: mostrar mensaje informativo
    errorMessage = 'Las promociones solo están disponibles en modo Salesforce.';
  }

  res.render('promotions', {
    member,
    engagementTrails,
    errorMessage,
    locale
  });
});

module.exports = router;
