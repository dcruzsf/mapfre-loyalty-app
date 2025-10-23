const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const transactionTranslations = require('../modules/transactionTranslations');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Aplicar middleware para obtener el miembro actual
router.use(getCurrentMember);

router.get('/', async (req, res) => {
  // Si hay un parámetro de nuevo logro, marcarlo para mostrar notificación
  const newAchievement = req.query.newAchievement === 'true';
  const achievementName = req.query.achievementName;
  const achievementPoints = req.query.achievementPoints;
  const message = req.query.message;
  const locale = req.locale || 'es';

  // El miembro actual viene del middleware
  const member = req.member;

  // Sincronizar currencies desde Salesforce si está disponible (PHASE 2)
  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      // Guardar el miembro actualizado
      Member.save(member);
      console.log('✅ Currencies sincronizadas al cargar dashboard');
    } catch (syncError) {
      console.warn('⚠️ No se pudieron sincronizar currencies al cargar dashboard:', syncError.message);
      // No bloquear el flujo, continuar con valores locales
    }
  }

  // Traducir transacciones si hay un miembro
  if (member && member.transactions) {
    member.translatedTransactions = member.transactions.map(tx =>
      transactionTranslations.translateTransaction(tx, locale)
    );
  }

  res.render('index', {
    member: member || null,
    newAchievement,
    achievementName,
    achievementPoints,
    message: message || null
  });
});

// Ruta para que un usuario individual resetee su cuenta
router.post('/reset-account', (req, res) => {
  if (!req.session.memberId) {
    return res.redirect('/register?message=Debes estar registrado para resetear tu cuenta');
  }
  
  const member = Member.findById(req.session.memberId);
  if (member) {
    // Encontrar el índice del miembro en el array
    const members = Member.getAll();
    const memberIndex = members.findIndex(m => m.id === member.id);
    
    if (memberIndex !== -1) {
      // Eliminar el miembro del array
      members.splice(memberIndex, 1);
    }
  }
  
  // Destruir la sesión
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al destruir sesión:', err);
    }
    res.redirect('/register?message=Tu cuenta ha sido eliminada. Puedes registrarte nuevamente');
  });
});

module.exports = router;