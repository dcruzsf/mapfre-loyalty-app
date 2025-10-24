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
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

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

  try {
    // Generar código usando el prefix configurado
    const redemptionCode = generateRedemptionCode(reward.codePrefix);

    console.log(`${member.name} canjeó ${reward.name} por ${reward.points} puntos. Código: ${redemptionCode}`);

    // MODO SALESFORCE: Registrar en SF y sincronizar puntos desde allí
    if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
      try {
        const activityDate = new Date().toISOString();
        // Registrar redemption de non-qualifying points (Cashback)
        // Los redemptions solo afectan a non-qualifying points
        await salesforceLoyalty.processTransaction(
          member.salesforceId,
          'Redemption',
          -reward.points, // Negativo para redemption
          'nonQualifying',
          'Redemption',
          'Reward',
          activityDate
        );
        console.log('✅ Redemption registrado en Salesforce');

        // Sincronizar puntos desde Salesforce después de registrar
        await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
        Member.save(member);
        console.log('✅ Puntos sincronizados desde Salesforce después del redemption');
      } catch (sfError) {
        console.warn('⚠️ No se pudo registrar redemption en Salesforce:', sfError.message);
        // Si falla SF, no restamos puntos localmente - el usuario deberá reintentar
        throw new Error('Error registrando la operación. Por favor, inténtalo de nuevo.');
      }
    } else {
      // MODO DEMO: Usar puntos localmente
      member.usePoints(reward.points, `Redención: ${reward.name}`);
      console.log(`✅ ${member.name} usó ${reward.points} puntos (modo demo)`);
    }
    
    // Verificar si hay nuevos logros
    const hasNewAchievement = member.achievements.some(a => 
      a.unlockedAt && 
      (new Date() - a.unlockedAt) < 5000 &&
      !req.query.newAchievement
    );
    
    if (hasNewAchievement) {
      // Obtener el último logro desbloqueado
      const newAchievement = member.achievements
        .filter(a => (new Date() - a.unlockedAt) < 5000)
        .sort((a, b) => b.unlockedAt - a.unlockedAt)[0];
        
      const message = `${i18n.t('messages.redemptionSuccess', locale)}: ${reward.name}`;
      return res.redirect(`/redemption?message=${encodeURIComponent(message)}&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}&newAchievement=true&achievementName=${newAchievement.name}&achievementPoints=${newAchievement.points}`);
    }

    const message = `${i18n.t('messages.redemptionSuccess', locale)}: ${reward.name}`;
    res.redirect(`/redemption?message=${encodeURIComponent(message)}&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}`);
  } catch (error) {
    const message = `${i18n.t('messages.error', locale)}: ${error.message}`;
    res.redirect(`/redemption?message=${encodeURIComponent(message)}`);
  }
});

module.exports = router;