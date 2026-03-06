const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');
const config = require('../config/index'); // Importamos la configuración real

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
    // PASAMOS LA MARCA DESDE EL ARCHIVO DE CONFIGURACIÓN
    brand: config.brand, 
    t: req.t,
    locale: req.locale || 'es'
  });
});

module.exports = router;