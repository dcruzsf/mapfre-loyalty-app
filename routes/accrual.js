const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');

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
router.post('/purchase/:id', (req, res) => {
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
    
    // Añadir puntos (a nivel y rewards)
    member.addPoints(product.points, `Puntos por compra de ${product.name}`);
    
    console.log(`${member.name} compró ${product.name} por ${product.price}€ y ganó ${product.points} puntos`);
    
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
router.post('/activity/:id', (req, res) => {
  const activityId = parseInt(req.params.id);
  const activity = catalogConfig.activities.find(a => a.id === activityId);
  const locale = req.locale || 'es';

  if (!activity) {
    const message = i18n.t('messages.activityNotFound', locale);
    return res.redirect(`/accrual?message=${encodeURIComponent(message)}`);
  }
  
  const member = req.member; // Viene del middleware requireAuth
  
  try {
    // Añadir puntos (a nivel y rewards)
    member.addPoints(activity.points, `${activity.name}`);
    
    console.log(`${member.name} completó actividad: ${activity.name} y ganó ${activity.points} puntos`);
    
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