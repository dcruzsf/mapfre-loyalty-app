const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');
const catalogConfig = require('../config/catalog');
const catalogTranslations = require('../modules/catalogTranslations');

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

  const tierThresholds = { 'Plata': 500, 'Oro': 1500, 'Platino': 5000 };
  const nextTierMap = { 'Plata': 'ORO', 'Oro': 'PLATINO', 'Platino': 'DIAMANTE' };
  const currentTier = member.tier || 'Plata';
  const nextThreshold = tierThresholds[currentTier] || 500;
  const progressPercent = Math.min(Math.round((member.levelPoints / nextThreshold) * 100), 100);

  // Obtenemos el catálogo completo (Asegúrate de que catalogConfig contenga el objeto 'redemption')
  const translatedCatalog = catalogTranslations.getTranslatedCatalog(catalogConfig, locale);
  
  // Fusionamos todas las categorías de rewards en una sola lista para el motor de búsqueda
  let rewardsList = [];
  if (translatedCatalog && translatedCatalog.rewards) {
      // Si tu catálogo separa por categorías, las unimos; si es un array directo, lo usamos
      rewardsList = Array.isArray(translatedCatalog.rewards) ? translatedCatalog.rewards : 
                    Object.values(translatedCatalog.rewards).flat();
  }

  res.render('redemption', {
    member,
    brand: safeBrand,
    rewards: rewardsList, 
    nextTier: nextTierMap[currentTier] || 'MÁXIMO',
    nextThreshold,
    progressPercent,
    t: (key) => {
        const dict = {
            'navigation.home': 'Inicio',
            'navigation.earnPoints': 'Ganar Tréboles',
            'navigation.redeemPoints': 'Canjear Tréboles',
            'pages.redemption.breadcrumb': 'Canjear Tréboles',
            'pages.redemption.title': 'Canjear mis Tréboles',
            'pages.redemption.notification.success': '¡Éxito!',
            'pages.redemption.reward.points': 'Tréboles',
            'pages.redemption.reward.redeem': 'Canjear ahora',
            'pages.redemption.reward.insufficientPoints': 'Saldo Insuficiente',
            'member.rewardPoints': 'Mis Tréboles',
            'common.available': 'Disponibles'
        };
        return dict[key] || key.split('.').pop().toUpperCase();
    },
    message: req.query.message || null,
    pointsRedeemed: req.query.points ? parseInt(req.query.points) : null,
    codeGenerated: req.query.code || null,
    // Corregimos la búsqueda del reward para que sea flexible con el tipo de ID (string/int)
    redeemedReward: req.query.rewardId ? rewardsList.find(r => String(r.id) === String(req.query.rewardId)) : null,
    locale
  });
});

router.post('/redeem/:id', async (req, res) => {
  const rewardId = req.params.id; // Lo mantenemos como string para buscar
  
  // Buscamos en todas las categorías de recompensas
  const allRewards = Array.isArray(catalogConfig.rewards) ? catalogConfig.rewards : 
                     Object.values(catalogConfig.rewards).flat();
                     
  const reward = allRewards.find(r => String(r.id) === String(rewardId));

  if (!reward) return res.redirect(`/redemption?message=Error: Recompensa no encontrada`);

  const member = req.member;
  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    return res.redirect(`/redemption?message=Error: Modo Salesforce requerido`);
  }

  try {
    const redemptionCode = generateRedemptionCode(reward.codePrefix);
    
    // Proceso de canje en Salesforce usando el ID de subtipo para REDENCIÓN
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      'Redemption',
      -reward.points, // Negativo para restar Tréboles
      'Tréboles',
      'Redemption', 
      'Redemption',
      new Date().toISOString()
    );

    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    res.redirect(`/redemption?message=¡Canje realizado con éxito!&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}`);
  } catch (error) {
    console.error('⚠️ Error al canjear:', error.message);
    res.redirect(`/redemption?message=Error en el proceso: ${error.message}`);
  }
});

module.exports = router;