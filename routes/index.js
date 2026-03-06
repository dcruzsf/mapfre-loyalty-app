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
    } catch (e) { 
      console.warn('Sync error ignored for stability:', e.message); 
    }
  }

  // --- NUEVA LÓGICA DE TIERS Y PROGRESO ---
  // Definimos los umbrales (puedes ajustarlos a tu gusto)
  const tierThresholds = { 'Plata': 500, 'Oro': 1500, 'Platino': 5000 };
  const nextTierMap = { 'Plata': 'Oro', 'Oro': 'Platino', 'Platino': 'Diamante' };
  
  const currentTier = member ? (member.tier || 'Plata') : 'Plata';
  const currentLevelPoints = member ? (member.levelPoints || 0) : 0;
  const nextThreshold = tierThresholds[currentTier] || 500;
  
  // Calculamos el porcentaje (máximo 100%)
  const progressPercent = Math.min(Math.round((currentLevelPoints / nextThreshold) * 100), 100);

  const safeBrand = {
    fullName: 'Club MAPFRE',
    images: { 
        favicon: '/img/favicon.ico', 
        logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg' 
    },
    colors: {
      primary: '#D31411', 
      secondary: '#00519E', 
      accent: '#D31411',
      lightGray: '#F4F4F4',
      midGray: '#E6E6E6',
      darkGray: '#4D4D4D',
      textColor: '#333333',
      textLight: '#666666',
      backgroundColor: '#FFFFFF',
      cardBackground: '#FFFFFF',
      borderColor: '#D1D1D1',
      successColor: '#28A745',
      errorColor: '#B00020',
      notificationColor: '#00519E',
      tierColors: { 
          bronze: '#A0522D', 
          silver: '#808080', 
          gold: '#C5A021', 
          platinum: '#2C3E50' 
      }
    },
    messages: { 
        tagline: 'Tu confianza siempre tiene recompensa', 
        welcome: '¡Bienvenido al Club MAPFRE!' 
    }
  };

  res.render('index', {
    member: member || null,
    user: member || null,
    brand: safeBrand,
    transactions: recentTransactions,
    // --- VARIABLES DE PROGRESO ENVIADAS A LA VISTA ---
    nextTier: nextTierMap[currentTier] || 'Máximo',
    nextThreshold: nextThreshold,
    progressPercent: progressPercent,
    // ------------------------------------------------
    t: req.t || ((key) => key.split('.').pop().toUpperCase()), 
    locale: req.locale || 'es',
    currentPage: 'home',
    message: req.query.message || null
  });
});

router.post('/reset-account', (req, res) => {
  req.session.destroy(() => res.redirect('/register?message=Demo restablecida'));
});

module.exports = router;