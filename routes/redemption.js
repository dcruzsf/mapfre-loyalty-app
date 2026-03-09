const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Importar configuración centralizada
const catalogConfig = require('../config/catalog');
const catalogTranslations = require('../modules/catalogTranslations');
const i18n = require('../modules/i18n');

// Objeto de marca para evitar errores en el header
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

const generateRedemptionCode = (prefix) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = (prefix || 'MAP') + '-';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Mostrar página de redención
router.get('/', async (req, res) => {
  const member = req.member; 
  const locale = req.locale || 'es';

  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
    } catch (error) {
      console.error('⚠️ Error sincronizando en redemption:', error.message);
    }
  }

  // Lógica de progreso para la tarjeta del header
  const tierThresholds = { 'Plata': 500, 'Oro': 1500, 'Platino': 5000 };
  const nextTierMap = { 'Plata': 'ORO', 'Oro': 'PLATINO', 'Platino': 'DIAMANTE' };
  const currentTier = member.tier || 'Plata';
  const nextThreshold = tierThresholds[currentTier] || 500;
  const progressPercent = Math.min(Math.round((member.levelPoints / nextThreshold) * 100), 100);

  // Obtener catálogo traducido
  const translatedCatalog = catalogTranslations.getTranslatedCatalog(catalogConfig, locale);
  
  const message = req.query.message;
  const pointsRedeemed = req.query.points ? parseInt(req.query.points) : null;
  const codeGenerated = req.query.code || null;
  const rewardId = req.query.rewardId ? parseInt(req.query.rewardId) : null;
  const redeemedReward = rewardId ? translatedCatalog.rewards.find(r => r.id === rewardId) : null;

  res.render('redemption', {
    member,
    brand: safeBrand, // <--- VITAL PARA EL HEADER
    rewards: translatedCatalog.rewards,
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
    message,
    pointsRedeemed,
    codeGenerated,
    redeemedReward,
    locale
  });
});

// Procesar redención
router.post('/redeem/:id', async (req, res) => {
  const rewardId = parseInt(req.params.id);
  const reward = catalogConfig.rewards.find(r => r.id === rewardId);
  const locale = req.locale || 'es';

  if (!reward) {
    return res.redirect(`/redemption?message=Recompensa no encontrada`);
  }

  const member = req.member;

  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    return res.redirect(`/redemption?message=Modo Salesforce requerido`);
  }

  try {
    const redemptionCode = generateRedemptionCode(reward.codePrefix);
    const activityDate = new Date().toISOString();

    // REGISTRO EN SALESFORCE (Usando tu función processTransaction corregida)
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      'Redemption',
      -reward.points, // Importante: Negativo para restar tréboles
      'Tréboles',     // Nombre exacto de tu moneda
      'Redemption',   // Journal Type
      'Redemption',   // Journal SubType
      activityDate
    );

    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    res.redirect(`/redemption?message=¡Canje realizado con éxito!&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}`);
  } catch (error) {
    console.error('⚠️ Error al canjear:', error.message);
    res.redirect(`/redemption?message=Error: ${error.message}`);
  }
});

module.exports = router;