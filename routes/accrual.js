const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const catalogConfig = require('../config/catalog');
const { requireAuth } = require('../middleware/auth');
const i18n = require('../modules/i18n');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

const safeBrand = {
  fullName: 'Club MAPFRE',
  images: { 
    favicon: '/img/favicon.ico', 
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg' 
  },
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

router.post('/transaction', async (req, res) => {
  const { points, journalSubType } = req.body;
  const member = req.member;

  try {
    if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
      throw new Error('Sin conexión con Salesforce');
    }

    const activityDate = new Date().toISOString();
    
    // CAMBIO CLAVE: Enviamos parámetros fijos que Salesforce reconoce para evitar Error 400
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      'Accrual',      // Journal Type
      parseFloat(points),
      'Tréboles',     // Nombre exacto de tu moneda en SF
      'Accrual',      // Journal SubType (Forzado a Accrual para evitar errores de Picklist)
      journalSubType, // Descripción
      activityDate
    );

    // Sincronizar inmediatamente para traer el nuevo saldo
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    res.redirect('/accrual?message=' + encodeURIComponent(`¡Éxito! Has sumado ${points} tréboles.`) + '&points=' + points);

  } catch (error) {
    // Si da error 400, imprimimos el cuerpo de la respuesta de SF para saber qué campo falla
    if (error.response && error.response.data) {
      console.error('❌ ERROR SF DATA:', JSON.stringify(error.response.data));
    }
    console.error('❌ Error en transacción:', error.message);
    res.redirect('/accrual?message=' + encodeURIComponent('Error en Salesforce: Revisa metadatos de moneda o subtipo'));
  }
});

module.exports = router;