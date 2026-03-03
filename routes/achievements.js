const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

// Importar configuraciones centralizadas de Mapfre
const brandConfig = require('../config/brand');
const catalogConfig = require('../config/catalog');
const catalogTranslations = require('../modules/catalogTranslations');

// Aplicar middleware de autenticación
router.use(requireAuth);

/**
 * Mostrar página de Hitos y Reconocimientos (Achievements)
 * En Mapfre, esto representa la trayectoria de seguridad del cliente.
 */
router.get('/', async (req, res) => {
  const member = req.member; 
  const locale = req.locale || 'es';

  // Sincronizar Tréboles y Categoría (Plata, Oro, Platino, Diamante)
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      // Sincronización con el Programa Mapfre Te Cuidamos en SF
      await salesforceLoyalty.syncMemberPoints(member, member.salesforceId);
      Member.save(member);
      console.log('🍀 Mapfre: Categoría y Tréboles actualizados para el dashboard de hitos');
    } catch (error) {
      console.error('⚠️ Error de sincronización Mapfre en achievements:', error.message);
    }
  }

  // Capturar notificaciones de nuevos hitos desbloqueados (ej: Conductor Seguro)
  const newAchievement = req.query.newAchievement === 'true';
  const achievementName = req.query.achievementName;
  const achievementPoints = req.query.achievementPoints ? parseInt(req.query.achievementPoints) : null;

  // Obtener el catálogo de hitos traducido al idioma del cliente
  const translatedCatalog = catalogTranslations.getTranslatedCatalog(catalogConfig, locale);

  res.render('achievements', {
    member,
    // En Mapfre llamamos a los achievements "Hitos de Protección"
    allAchievements: translatedCatalog.achievements, 
    newAchievement,
    achievementName,
    achievementPoints,
    brand: brandConfig // Pasamos la config de marca para colores institucionales
  });
});

module.exports = router;