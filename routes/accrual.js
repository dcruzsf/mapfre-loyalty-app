const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const catalogConfig = require('../config/catalog');
const { requireAuth } = require('../middleware/auth');
const i18n = require('../modules/i18n');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Aplicar middleware de autenticación a todas las rutas de Mapfre Te Cuidamos
router.use(requireAuth);

// Mostrar página de obtención de Tréboles (Accrual)
router.get('/', async (req, res) => {
  const member = req.member; 
  const locale = req.locale || 'es';

  // Sincronizar Tréboles y Categoría (Tier) desde Salesforce al cargar
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      console.log('🍀 Mapfre: Tréboles y nivel actualizados desde Salesforce');
    } catch (error) {
      console.error('⚠️ Error sincronizando datos de Mapfre:', error.message);
    }
  }

  res.render('accrual', {
    member,
    products: catalogConfig.products, // Seguros y Servicios
    activities: catalogConfig.activities, // Prevención y Salud
    message: req.query.message || null,
    points: req.query.points || null,
    locale
  });
});

// Procesar contratación de seguro u operación de partner
router.post('/purchase/:id', async (req, res) => {
  const productId = parseInt(req.params.id);
  const product = catalogConfig.products.find(p => p.id === productId);
  const locale = req.locale || 'es';

  if (!product) {
    const message = i18n.t('messages.productNotFound', locale);
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  const member = req.member;

  // Solo procesamos si hay conexión con la Org de Salesforce de Mapfre
  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    const message = 'La gestión de seguros requiere conexión con los sistemas centrales de Mapfre.';
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }

  try {
    console.log(`🎯 Cliente ${member.name} contrató: ${product.name}`);

    const activityDate = new Date().toISOString();
    const journalType = product.journalType || 'Accrual';
    const journalSubType = product.journalSubType || 'Insurance_Purchase'; // Subtipo adaptado
    const journalSubTypeId = product.journalSubTypeId || null;

    // En Mapfre, el monto total influye en la bonificación de Tréboles
    const transactionAmount = Math.abs(product.qualifyingPoints || 0) + Math.abs(product.nonQualifyingPoints || 0);

    // Campos personalizados para lógica de fidelización Mapfre en Salesforce
    const customFields = {};
    if (journalType === 'Redemption' && Math.abs(product.nonQualifyingPoints) > 0) {
      customFields.Points_to_debit__c = Math.abs(product.nonQualifyingPoints);
      console.log(`🔧 Debitando Tréboles del saldo: ${customFields.Points_to_debit__c}`);
    }

    // Registro de la operación en el motor de Loyalty de Salesforce
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      journalType,
      transactionAmount,
      'treboles', // Moneda institucional
      journalType,
      journalSubType,
      activityDate,
      journalSubTypeId,
      customFields
    );

    // Sincronizar tras la operación para mostrar el balance real de Tréboles
    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    const message = `${i18n.t('messages.purchaseSuccess', locale)}: ${product.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${product.pointsDisplay}`);
  } catch (error) {
    console.error('❌ Error en operación Mapfre:', error.message);
    const message = `${i18n.t('messages.error', locale)}: ${error.message}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }
});

// Procesar hito de prevención o actividad digital
router.post('/activity/:id', async (req, res) => {
  const activityId = parseInt(req.params.id);
  const activity = catalogConfig.activities.find(a => a.id === activityId);
  const locale = req.locale || 'es';

  if (!activity) {
    return res.redirect(`/accrual?message=${encodeURIComponent(i18n.t('messages.activityNotFound', locale))}`);
  }

  const member = req.member;

  if (!member.salesforceId || process.env.USE_SALESFORCE !== 'true') {
    return res.redirect(`/accrual?message=${encodeURIComponent('Modo offline no disponible para hitos de prevención.')}`);
  }

  try {
    console.log(`🍀 Hito Mapfre completado: ${activity.name} por ${member.name}`);

    const activityDate = new Date().toISOString();
    await salesforceLoyalty.processTransaction(
      member.salesforceId,
      'Accrual',
      activity.points,
      'puntos_nivel', // Puntos para subir de Plata a Oro/Platino
      'Accrual',
      'Activity',
      activityDate
    );

    await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
    Member.save(member);

    const message = `${i18n.t('messages.activitySuccess', locale)}: ${activity.name}`;
    res.redirect(`/accrual?message=${encodeURIComponent(message)}&points=${activity.points}`);
  } catch (error) {
    console.error('❌ Error en actividad de prevención:', error.message);
    res.redirect(`/accrual?message=${encodeURIComponent(i18n.t('messages.error', locale))}`);
  }
});

module.exports = router;