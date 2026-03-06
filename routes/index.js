const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const { newAchievement, achievementName, achievementPoints, message } = req.query;
  const member = req.member;
  let recentTransactions = [];

  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      // Sincronización con Salesforce Club MAPFRE
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      recentTransactions = await salesforceLoyalty.getMemberTransactions(member.salesforceId, 5);
    } catch (syncError) {
      console.warn('⚠️ Sync Warning:', syncError.message);
    }
  }

  res.render('index', {
    member: member || null,
    user: member || null, // Vital para el header.ejs
    transactions: recentTransactions,
    message: message || null,
    newAchievement: newAchievement === 'true',
    achievementName: achievementName,
    achievementPoints: achievementPoints,
    // Aseguramos que brand se pase si el middleware global no lo hace
    brand: req.app.get('brandConfig') || {} 
  });
});

router.post('/reset-account', (req, res) => {
  if (!req.session.memberId) return res.redirect('/register');
  
  const member = Member.findById(req.session.memberId);
  if (member) {
    const members = Member.getAll();
    const idx = members.findIndex(m => m.id === member.id);
    if (idx !== -1) members.splice(idx, 1);
  }
  
  req.session.destroy(() => {
    res.redirect('/register?message=Cuenta de Club MAPFRE eliminada');
  });
});

module.exports = router;