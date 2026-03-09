const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const catalogConfig = require('../config/catalog');
const { requireAuth } = require('../middleware/auth');
const i18n = require('../modules/i18n');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Objeto de marca para evitar errores en el header
const safeBrand = {
  fullName: 'Club MAPFRE',
  images: { 
    favicon: '/img/favicon.ico', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg' 
  },
  colors: {
    primary: '#d81e05', 
    secondary: '#333333', 
    accent: '#a31604',
    tierColors: { bronze: '#CD7F32', silver: '#C0C0C0', gold: '#FFD700', platinum: '#E5E4E2' }
  }
};

router.use(requireAuth);

router.get('/', async (req, res) => {
  const member = req.member; 
  const locale = req.locale || 'es';

  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
    } catch (error) {
      console.error('⚠️ Error sincronizando:', error.message);
    }
  }

  // Lógica de progreso para la tarjeta
  const tierThresholds = { 'Plata': 500, 'Oro': 1500, 'Platino': 5000 };
  const nextTierMap = { 'Plata': 'ORO', 'Oro': 'PLATINO', 'Platino': 'DIAMANTE' };
  const currentTier = member.tier || 'Plata';
  const nextThreshold = tierThresholds[currentTier] || 500;
  const progressPercent = Math.min(Math.round((member.levelPoints / nextThreshold) * 100), 100);

  res.render('accrual', {
    member,
    brand: safeBrand, 
    nextTier: nextTierMap[currentTier] || 'MÁXIMO',
    nextThreshold,
    progressPercent,
    t: (key) => {
        const dict = {
            'navigation.home': 'Inicio',
            'navigation.earnPoints': 'Ganar Tréboles',
            'navigation.redeemPoints': 'Canjear Tréboles'
        };
        return dict[key] || key.split('.').pop().toUpperCase();
    },
    message: req.query.message || null,
    points: req.query.points || null,
    locale
  });
});

/**
 * IMPORTANTE: Esta ruta procesa el botón "Registrar Compra".
 * Si en tu EJS el formulario dice action="/transaction", cámbialo 
 * a action="/accrual/transaction" para que llegue aquí.
 */
router.post('/transaction', async (req, res) => {
  const { points, journalType, journalSubType } = req.body;
  const member = req.member;

  try {
    if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
      throw new Error('Sin conexión con Salesforce');
    }

    const activityDate = new Date().toISOString();
    
    // 1. Procesar en Salesforce
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      journalType || 'Accrual',
      parseFloat(points),
      'Tréboles',
      journalType || 'Accrual',
      journalSubType || 'Purchase',
      activityDate
    );

    // 2. Sincronizar puntos actualizados inmediatamente
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    // 3. Redirigir usando la ruta completa para evitar errores de contexto
    res.redirect('/accrual?message=' + encodeURIComponent(`¡Éxito! Has sumado ${points} tréboles por ${journalSubType}`) + '&points=' + points);

  } catch (error) {
    console.error('❌ Error en transacción:', error.message);
    // IMPORTANTE: Al redirigir en caso de error, el GET de arriba se encargará 
    // de volver a pasar el objeto 'brand' y 't', evitando el error de undefined.
    res.redirect('/accrual?message=' + encodeURIComponent('Error: ' + error.message));
  }
});

module.exports = router;