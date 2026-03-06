const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Usamos el middleware de autenticación
router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const message = req.query.message;
  let member = req.member;

  // 1. Sincronización proactiva con Salesforce Loyalty
  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      console.log('🍀 Club MAPFRE: Sincronización completada con Salesforce');
    } catch (err) {
      console.warn('⚠️ Club MAPFRE: Error en sincronía, usando datos locales:', err.message);
    }
  }

  // 2. Renderizado con las variables que esperan los partials y el locale
  res.render('index', {
    member: member || null,
    message: message || null,
    brand: {
      name: 'Club MAPFRE',
      fullName: 'Club MAPFRE',
      messages: { tagline: 'Tu fidelidad siempre tiene recompensa' }
    },
    t: req.t,
    locale: req.locale || 'es'
  });
});

module.exports = router;