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

// Mostrar página de acumulación
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

  // Verificar si hay mensaje de éxito y puntos ganados
  const message = req.query.message;
  const pointsEarned = req.query.points ? parseInt(req.query.points) : null;

  // Obtener catálogo traducido
  const translatedCatalog = catalogTranslations.getTranslatedCatalog(catalogConfig, locale);

  res.render('accrual', {
    member,
    products: translatedCatalog.products,
    activities: translatedCatalog.activities,
    message,
    pointsEarned
  });
});

// Procesar compra
router.post('/purchase/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const product = catalogConfig.products.find(p => p.id === productId);
  const locale = req.locale || 'es';

  if (!product) {
    const message = i18n.t('messages.productNotFound', locale);
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  const member = req.member; // Viene del middleware requireAuth

  try {
    // Reducir saldo
    member.reduceBalance(product.price, `Compra de ${product.name}`);

    console.log(`${member.name} compró ${product.name} por ${product.price}€`);

    // MODO SALESFORCE: Registrar en SF y sincronizar puntos desde allí
    if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
      try {
        const activityDate = new Date().toISOString();
        // Usar journalType y journalSubType del catálogo
        const journalType = product.journalType || 'Accrual';
        const journalSubType = product.journalSubType || 'Purchase';

        // Registrar UN SOLO TransactionJournal (Salesforce gestiona las currencies internamente)
        await salesforceLoyalty.processTransaction(
          member.salesforceId,
          journalType,
          product.points,
          'qualifying', // Este parámetro ya no se usa, pero lo mantenemos por compatibilidad
          journalType,
          journalSubType,
          activityDate
        );
        console.log(`✅ TransactionJournal registrado en Salesforce (${journalType}/${journalSubType})`);

        // Sincronizar puntos desde Salesforce después de registrar
        await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
        Member.save(member);
        console.log('✅ Puntos sincronizados desde Salesforce después del accrual');
      } catch (sfError) {
        console.warn('⚠️ No se pudo registrar accrual en Salesforce:', sfError.message);
        // Si falla SF, no sumamos puntos localmente - el usuario deberá reintentar
        throw new Error('Error registrando la operación. Por favor, inténtalo de nuevo.');
      }
    } else {
      // MODO DEMO: Añadir puntos localmente
      member.addPoints(product.points, `Puntos por compra de ${product.name}`);
      console.log(`✅ ${member.name} ganó ${product.points} puntos (modo demo)`);
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
        
      const message = `${i18n.t('messages.purchaseSuccess', locale)}: ${product.name}`;
      return res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${product.points}&newAchievement=true&achievementName=${newAchievement.name}&achievementPoints=${newAchievement.points}`);
    }

    const message = `${i18n.t('messages.purchaseSuccess', locale)}: ${product.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${product.points}`);
  } catch (error) {
    const message = `${i18n.t('messages.error', locale)}: ${error.message}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }
});

// Procesar actividad
router.post('/activity/:id', async (req, res) => {
  const activityId = parseInt(req.params.id);
  const activity = catalogConfig.activities.find(a => a.id === activityId);
  const locale = req.locale || 'es';

  if (!activity) {
    const message = i18n.t('messages.activityNotFound', locale);
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  const member = req.member; // Viene del middleware requireAuth

  try {
    console.log(`${member.name} completó actividad: ${activity.name}`);

    // MODO SALESFORCE: Registrar en SF y sincronizar puntos desde allí
    if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
      try {
        const activityDate = new Date().toISOString();
        // Registrar UN SOLO TransactionJournal (Salesforce gestiona las currencies internamente)
        await salesforceLoyalty.processTransaction(
          member.salesforceId,
          'Accrual',
          activity.points,
          'qualifying',
          'Accrual',
          'Activity',
          activityDate
        );
        console.log('✅ TransactionJournal de actividad registrado en Salesforce');

        // Sincronizar puntos desde Salesforce después de registrar
        await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
        Member.save(member);
        console.log('✅ Puntos sincronizados desde Salesforce después del accrual de actividad');
      } catch (sfError) {
        console.warn('⚠️ No se pudo registrar accrual en Salesforce:', sfError.message);
        // Si falla SF, no sumamos puntos localmente - el usuario deberá reintentar
        throw new Error('Error registrando la operación. Por favor, inténtalo de nuevo.');
      }
    } else {
      // MODO DEMO: Añadir puntos localmente
      member.addPoints(activity.points, `${activity.name}`);
      console.log(`✅ ${member.name} ganó ${activity.points} puntos (modo demo)`);
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
        
      const message = `${i18n.t('messages.activitySuccess', locale)}: ${activity.name}`;
      return res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${activity.points}&newAchievement=true&achievementName=${newAchievement.name}&achievementPoints=${newAchievement.points}`);
    }

    const message = `${i18n.t('messages.activitySuccess', locale)}: ${activity.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${activity.points}`);
  } catch (error) {
    const message = `${i18n.t('messages.error', locale)}: ${error.message}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }
});

module.exports = router;