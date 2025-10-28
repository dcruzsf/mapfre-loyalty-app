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
router.get('/', async (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  const locale = req.locale || 'es';

  // Sincronizar puntos y tier desde Salesforce antes de mostrar la página
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      console.log('✅ Currencies y tier sincronizados al cargar página de accrual');
    } catch (error) {
      console.error('⚠️ Error sincronizando en página accrual:', error.message);
    }
  }

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
    console.log(`${member.name} realizó: ${product.name}`);

    const activityDate = new Date().toISOString();
    const journalType = product.journalType || 'Accrual';
    const journalSubType = product.journalSubType || 'Purchase';

    // Registrar qualifying points (Caixapoints) si hay
    if (product.qualifyingPoints && product.qualifyingPoints !== 0) {
      await salesforceLoyalty.processTransaction(
        member.salesforceId,
        journalType,
        product.qualifyingPoints,
        'qualifying',
        journalType,
        journalSubType,
        activityDate
      );
      console.log(`✅ TransactionJournal qualifying registrado: ${product.qualifyingPoints} Caixapoints`);
    }

    // Registrar non-qualifying points (Cashback) si hay
    if (product.nonQualifyingPoints && product.nonQualifyingPoints !== 0) {
      await salesforceLoyalty.processTransaction(
        member.salesforceId,
        journalType,
        product.nonQualifyingPoints,
        'nonQualifying',
        journalType,
        journalSubType,
        activityDate
      );
      console.log(`✅ TransactionJournal non-qualifying registrado: ${product.nonQualifyingPoints} Cashback`);
    }

    // Sincronizar puntos desde Salesforce después de registrar
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);
    console.log('✅ Puntos sincronizados desde Salesforce después del accrual');

    const message = `${i18n.t('messages.purchaseSuccess', locale)}: ${product.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${product.pointsDisplay}`);
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
