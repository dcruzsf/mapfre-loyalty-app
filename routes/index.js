const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const message = req.query.message;
  let member = req.member;

  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
    } catch (err) {
      console.warn('⚠️ Error sincronía:', err.message);
    }
  }

  res.render('index', {
    member: member || null,
    message: message || null,
    // OBJETO BRAND COMPLETO PARA EVITAR EL ERROR DE FAVICON
    brand: {
      name: 'Club MAPFRE',
      fullName: 'Club MAPFRE',
      images: {
        favicon: '/img/favicon.ico' // Esto arregla el error de la imagen dca6b7
      },
      messages: { tagline: 'Tu confianza siempre tiene recompensa' }
    },
    t: req.t,
    locale: req.locale || 'es'
  });
});

module.exports = router;