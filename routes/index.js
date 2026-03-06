const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');
const config = require('../config/index'); // Importamos la config maestra

router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const { message } = req.query;
  const member = req.member;
  let recentTransactions = [];

  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      recentTransactions = await salesforceLoyalty.getMemberTransactions(member.salesforceId, 5);
    } catch (syncError) {
      console.warn('⚠️ Sync Warning:', syncError.message);
    }
  }

  // IMPORTANTE: Pasamos 'user' y 'brand' para que el header no falle
  res.render('index', {
    member: member || null,
    user: member || null, 
    transactions: recentTransactions,
    message: message || null,
    brand: config.brand, 
    t: req.t,
    locale: req.locale || 'es'
  });
});

// Arreglo de la ruta reset-account (Error 404)
router.post('/reset-account', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/register?message=Demo de Club MAPFRE restablecida');
  });
});

module.exports = router;