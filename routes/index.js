const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Middleware para obtener el miembro
router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const { newAchievement, achievementName, achievementPoints, message } = req.query;
  const member = req.member;
  let recentTransactions = [];

  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      recentTransactions = await salesforceLoyalty.getMemberTransactions(member.salesforceId, 5);
    } catch (e) { console.warn('Sync error:', e.message); }
  }

  // OBJETO DE SEGURIDAD TOTAL
  const safeBrand = {
    fullName: 'Club MAPFRE',
    images: { favicon: '/img/favicon.ico', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg' },
    colors: {
      primary: '#D31411', secondary: '#00519E', accent: '#D31411',
      textColor: '#333333', textLight: '#666666', notificationColor: '#00519E',
      tierColors: { bronze: '#A0522D', silver: '#808080', gold: '#C5A021', platinum: '#2C3E50' }
    },
    messages: { tagline: 'Tu confianza siempre tiene recompensa', welcome: '¡Bienvenido al Club MAPFRE!' }
  };

  res.render('index', {
    member: member || null,
    user: member || null,
    brand: safeBrand,
    transactions: recentTransactions,
    t: req.t || ((key) => key), // Fallback si 't' no es una función
    locale: req.locale || 'es',
    currentPage: 'home',
    message: message || null,
    newAchievement: newAchievement === 'true',
    achievementName: achievementName,
    achievementPoints: achievementPoints
  });
});

router.post('/reset-account', (req, res) => {
  req.session.destroy(() => res.redirect('/register?message=Demo restablecida'));
});

module.exports = router;