const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

router.use(getCurrentMember);

router.get('/', async (req, res) => {
  const member = req.member;
  let recentTransactions = [];

  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      recentTransactions = await salesforceLoyalty.getMemberTransactions(member.salesforceId, 5);
    } catch (e) { console.warn('Sync error:', e.message); }
  }

  // --- LÓGICA DE PROGRESO DE NIVEL ---
  const tierThresholds = { 'Plata': 500, 'Oro': 1500, 'Platino': 5000 };
  const nextTierMap = { 'Plata': 'ORO', 'Oro': 'PLATINO', 'Platino': 'DIAMANTE' };
  
  const currentTier = member ? (member.tier || 'Plata') : 'Plata';
  const currentLevelPoints = member ? (member.levelPoints || 0) : 0;
  const nextThreshold = tierThresholds[currentTier] || 500;
  const progressPercent = Math.min(Math.round((currentLevelPoints / nextThreshold) * 100), 100);

  // OBJETO DE MARCA FIJO (Evita errores de favicon/colores)
  const safeBrand = {
    fullName: 'CLUB MAPFRE',
    images: { favicon: '/img/favicon.ico', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg' },
    colors: {
      primary: '#D31411', secondary: '#00519E', accent: '#D31411',
      tierColors: { bronze: '#A0522D', silver: '#808080', gold: '#C5A021', platinum: '#2C3E50' }
    },
    messages: { tagline: 'Tu confianza siempre tiene recompensa' }
  };

  res.render('index', {
    member: member || null,
    user: member || null,
    brand: safeBrand,
    transactions: recentTransactions,
    // Variables de progreso
    nextTier: nextTierMap[currentTier] || 'MÁXIMO',
    nextThreshold: nextThreshold,
    progressPercent: progressPercent,
    // TRADUCTOR FORZADO A ESPAÑOL
    t: (key) => {
        const dictionary = {
            'navigation.home': 'Inicio',
            'navigation.earnPoints': 'Ganar Tréboles',
            'navigation.redeemPoints': 'Canjear Tréboles',
            'navigation.promotions': 'Mis Retos',
            'navigation.register': 'Únete al Club'
        };
        return dictionary[key] || key.split('.').pop().toUpperCase();
    },
    locale: 'es',
    currentPage: 'home'
  });
});

router.post('/reset-account', (req, res) => {
  req.session.destroy(() => res.redirect('/register'));
});

module.exports = router;