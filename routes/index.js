const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { getCurrentMember } = require('../middleware/auth');
const transactionTranslations = require('../modules/transactionTranslations');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Middleware para obtener el miembro (cliente) actual
router.use(getCurrentMember);

/**
 * Dashboard Principal: Resumen de Tréboles y Estado de Cliente
 */
router.get('/', async (req, res) => {
  // Parámetros de hitos o notificaciones (ej: desbloqueo de hito 'Conductor Seguro')
  const newAchievement = req.query.newAchievement === 'true';
  const achievementName = req.query.achievementName;
  const achievementPoints = req.query.achievementPoints;
  const message = req.query.message;
  const locale = req.locale || 'es';

  const member = req.member;

  // Sincronización proactiva con Mapfre Te Cuidamos (Salesforce)
  if (member && member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      // Sincronizamos Tréboles y Categoría (Plata, Oro, Platino, Diamante)
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      
      // Persistir cambios en el modelo local
      Member.save(member);
      console.log('🍀 Mapfre Sync: Dashboard actualizado con datos de Salesforce');
    } catch (syncError) {
      console.warn('⚠️ Mapfre Sync: Usando valores locales temporalmente:', syncError.message);
    }
  }

  res.render('index', {
    member: member || null,
    message: message || null,
    // Podrías añadir aquí variables de marca si tu EJS las requiere
    brandName: 'Club Mapfre'
  });
});

/**
 * Gestión de Cuenta: Eliminación de datos del programa
 */
router.post('/reset-account', (req, res) => {
  if (!req.session.memberId) {
    return res.redirect('/register?message=Debes acceder para gestionar tu baja en el programa');
  }
  
  const member = Member.findById(req.session.memberId);
  if (member) {
    const members = Member.getAll();
    const memberIndex = members.findIndex(m => m.id === member.id);
    
    if (memberIndex !== -1) {
      members.splice(memberIndex, 1);
    }
  }
  
  // Destruir la sesión y redirigir
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/register?message=Tus datos han sido eliminados correctamente de Mapfre Te Cuidamos');
  });
});

module.exports = router;