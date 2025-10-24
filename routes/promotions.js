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
      // Obtener las promociones usando el Salesforce Member ID directamente
      console.log(`📝 Salesforce Member ID: ${member.salesforceId}`);
      promotions = await salesforceLoyalty.getMemberPromotions(member.salesforceId);
      console.log(`📊 Total promociones cumulativas: ${promotions.length}`);

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
