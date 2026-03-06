const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const catalogConfig = require('../config/catalog');
const { requireAuth } = require('../middleware/auth');
const i18n = require('../modules/i18n');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// IMPORTANTE: Objeto de marca para evitar errores en el header
const safeBrand = {
  fullName: 'Club MAPFRE',
  images: { favicon: '/img/favicon.ico', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg' },
  colors: {
    primary: '#d81e05', secondary: '#333333', accent: '#a31604',
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
    brand: safeBrand, // <--- ESTO EVITA EL ERROR DE FAVICON
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

// NUEVA RUTA: Para procesar el formulario de "Registrar Compra" que tienes en el EJS
router.post('/transaction', async (req, res) => {
  const { points, journalType, journalSubType } = req.body;
  const member = req.member;

  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    return res.redirect('/accrual?message=Error: Sin conexión con Salesforce');
  }

  try {
    const activityDate = new Date().toISOString();
    
    // 1. Procesar en Salesforce
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      journalType || 'Accrual',
      parseFloat(points),
      'treboles',
      journalType || 'Accrual',
      journalSubType || 'Compra',
      activityDate
    );

    // 2. Sincronizar puntos actualizados
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    // 3. Redirigir de vuelta con éxito
    res.redirect(`/accrual?message=Compra registrada: ${journalSubType}&points=${points}`);
  } catch (error) {
    console.error('❌ Error en transacción:', error.message);
    res.redirect(`/accrual?message=Error al registrar: ${error.message}`);
  }
});

module.exports = router;