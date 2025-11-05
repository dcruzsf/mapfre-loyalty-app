const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Importar configuración centralizada
const catalogConfig = require('../config/catalog');
const catalogTranslations = require('../modules/catalogTranslations');
const i18n = require('../modules/i18n');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Función para generar un código aleatorio
const generateRedemptionCode = (prefix) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Mostrar página de redención
router.get('/', async (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

  // Sincronizar puntos y tier desde Salesforce antes de mostrar la página
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      console.log('✅ Currencies y tier sincronizados al cargar página de redemption');
    } catch (error) {
      console.error('⚠️ Error sincronizando en página redemption:', error.message);
    }
  }

  // Verificar si hay mensaje de éxito y puntos canjeados
  const message = req.query.message;
  const pointsRedeemed = req.query.points ? parseInt(req.query.points) : null;
  const codeGenerated = req.query.code || null;
  const rewardId = req.query.rewardId ? parseInt(req.query.rewardId) : null;

  // Obtener catálogo traducido
  const translatedCatalog = catalogTranslations.getTranslatedCatalog(catalogConfig, locale);
  const redeemedReward = rewardId ? translatedCatalog.rewards.find(r => r.id === rewardId) : null;

  res.render('redemption', {
    member,
    rewards: translatedCatalog.rewards,
    message,
    pointsRedeemed,
    codeGenerated,
    redeemedReward
  });
});

// Procesar redención
router.post('/redeem/:id', async (req, res) => {
  const rewardId = parseInt(req.params.id);
  const reward = catalogConfig.rewards.find(r => r.id === rewardId);
  const locale = req.locale || 'es';

  if (!reward) {
    const message = i18n.t('messages.rewardNotFound', locale);
    return res.redirect(`/redemption?message=${encodeURIComponent(message)}`);
  }

  const member = req.member; // Viene del middleware requireAuth

  // VALIDACIÓN: Solo funciona en modo Salesforce
  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    const message = 'Las redenciones solo están disponibles en modo Salesforce.';
    return res.redirect(`/redemption?message=${encodeURIComponent(message)}`);
  }

  try {
    // Generar código usando el prefix configurado
    const redemptionCode = generateRedemptionCode(reward.codePrefix);

    console.log(`${member.name} canjeó ${reward.name} por ${reward.points} puntos. Código: ${redemptionCode}`);

    // Preparar campos personalizados si es redención especial (Facilitea)
    const customFields = {};
    if (reward.isSpecial && reward.journalType === 'Redemption') {
      customFields.Points_to_debit__c = reward.points;
      console.log(`🔧 Agregando campo personalizado Points_to_debit__c: ${customFields.Points_to_debit__c}`);
    }

    // Registrar redemption de non-qualifying points (Cashback) en Salesforce
    const activityDate = new Date().toISOString();
    const journalSubType = reward.journalSubType || 'Reward';

    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      'Redemption',
      -reward.points, // Negativo para redemption
      'nonQualifying',
      'Redemption',
      journalSubType,
      activityDate,
      null, // journalSubTypeId
      customFields
    );
    console.log('✅ Redemption registrado en Salesforce');

    // Sincronizar puntos desde Salesforce después de registrar
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);
    console.log('✅ Puntos sincronizados desde Salesforce después del redemption');

    const message = `${i18n.t('messages.redemptionSuccess', locale)}: ${reward.name}`;
    res.redirect(`/redemption?message=${encodeURIComponent(message)}&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}`);
  } catch (error) {
    console.error('⚠️ Error al registrar redención:', error.message);
    const message = `${i18n.t('messages.error', locale)}: ${error.message}`;
    res.redirect(`/redemption?message=${encodeURIComponent(message)}`);
  }
});

module.exports = router;