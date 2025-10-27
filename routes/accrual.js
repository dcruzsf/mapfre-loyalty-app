const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const catalogConfig = require('../config/catalog');
const { requireAuth } = require('../middleware/auth');
const i18n = require('../modules/i18n');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Mostrar página de accrual (Ganar Puntos)
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

  res.render('accrual', {
    member,
    products: catalogConfig.products,
    activities: catalogConfig.activities,
    message: req.query.message || null,
    points: req.query.points || null,
    locale
  });
});

// Procesar compra/operación digital
router.post('/purchase/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const product = catalogConfig.products.find(p => p.id === productId);
  const locale = req.locale || 'es';

  if (!product) {
    const message = i18n.t('messages.productNotFound', locale);
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  const member = req.member; // Viene del middleware requireAuth

  // VALIDACIÓN: Solo funciona en modo Salesforce
  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    const message = 'Las operaciones solo están disponibles en modo Salesforce.';
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  try {
    console.log(`${member.name} compró ${product.name} por ${product.price}€`);

    // Registrar TransactionJournal en Salesforce
    const activityDate = new Date().toISOString();
    const journalType = product.journalType || 'Accrual';
    const journalSubType = product.journalSubType || 'Purchase';

    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      journalType,
      product.points,
      'qualifying',
      journalType,
      journalSubType,
      activityDate
    );
    console.log(`✅ TransactionJournal registrado en Salesforce (${journalType}/${journalSubType})`);

    // Sincronizar puntos desde Salesforce después de registrar
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);
    console.log('✅ Puntos sincronizados desde Salesforce después del accrual');

    const message = `${i18n.t('messages.purchaseSuccess', locale)}: ${product.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${product.points}`);
  } catch (error) {
    console.error('⚠️ Error al registrar operación:', error.message);
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

  // VALIDACIÓN: Solo funciona en modo Salesforce
  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    const message = 'Las actividades solo están disponibles en modo Salesforce.';
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  try {
    console.log(`${member.name} completó actividad: ${activity.name}`);

    // Registrar TransactionJournal en Salesforce
    const activityDate = new Date().toISOString();
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

    const message = `${i18n.t('messages.activitySuccess', locale)}: ${activity.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${activity.points}`);
  } catch (error) {
    console.error('⚠️ Error al registrar actividad:', error.message);
    const message = `${i18n.t('messages.error', locale)}: ${error.message}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }
});

module.exports = router;
