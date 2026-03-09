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

  // 1. Obtenemos el catálogo traducido
  const translatedCatalog = catalogTranslations.getTranslatedCatalog(catalogConfig, locale);
  
  // 2. MODIFICACIÓN CLAVE: Extraemos específicamente el nodo de 'redemption'
  // Si tu catálogo tiene rewards y redemption por separado, los unimos para que la vista los encuentre
  let redemptionList = [];
  if (translatedCatalog) {
      const redemptions = translatedCatalog.redemption || [];
      const rewards = translatedCatalog.rewards || [];
      redemptionList = [...redemptions, ...rewards]; 
  }

  res.render('redemption', {
    member,
    brand: safeBrand,
    rewards: redemptionList, // Pasamos la lista unificada bajo el nombre 'rewards' para que el EJS funcione
    nextTier: nextTierMap[currentTier] || 'MÁXIMO',
    nextThreshold,
    progressPercent,
    t: (key) => {
        const dict = {
            'navigation.home': 'Inicio',
            'navigation.earnPoints': 'Ganar Tréboles',
            'navigation.redeemPoints': 'Canjear Tréboles',
            'pages.redemption.breadcrumb': 'Canjear Tréboles',
            'pages.redemption.title': 'CANJEAR MIS TRÉBOLES',
            'pages.redemption.description': 'Utiliza tus tréboles acumulados para ahorrar en tus seguros o conseguir servicios exclusivos',
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
    redeemedReward: req.query.rewardId ? redemptionList.find(r => String(r.id) === String(req.query.rewardId)) : null,
    locale
  });
});

router.post('/redeem/:id', async (req, res) => {
  const rewardId = req.params.id;
  
  // Buscamos en ambos nodos del catálogo original
  const allOptions = [
    ...(catalogConfig.redemption || []),
    ...(catalogConfig.rewards || [])
  ];
                     
  const reward = allOptions.find(r => String(r.id) === String(rewardId));

  if (!reward) return res.redirect(`/redemption?message=Error: Recompensa no encontrada`);

  const member = req.member;
  if (!member.salesforceId || process.env.USE_SALESFORCE === 'true') {
    try {
      const activityDate = new Date().toISOString();
      
      // Enviamos el ID de subtipo de redención que confirmamos anteriormente
      const journalSubTypeId = '0lS7Q000000srPlUAI'; 

      await salesforceLoyalty.processTransaction(
        member.salesforceId,
        'Redemption',
        -reward.points, // Negativo para descontar
        'Tréboles',
        'Redemption', 
        'Redemption',
        activityDate,
        journalSubTypeId
      );

      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);

      const message = `¡Canje realizado! Has utilizado ${reward.points} tréboles.`;
      res.redirect(`/redemption?message=${encodeURIComponent(message)}&points=${reward.points}&code=${generateRedemptionCode(reward.codePrefix)}&rewardId=${reward.id}`);
    } catch (error) {
      console.error('⚠️ Error al canjear:', error.message);
      res.redirect(`/redemption?message=Error en el proceso de Salesforce`);
    }
  } else {
    res.redirect(`/redemption?message=Modo Salesforce no activo`);
  }
});

module.exports = router;