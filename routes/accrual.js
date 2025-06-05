const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');

// Importar configuración centralizada
const catalogConfig = require('../config/catalog');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Mostrar página de acumulación
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  
  // Verificar si hay mensaje de éxito y puntos ganados
  const message = req.query.message;
  const pointsEarned = req.query.points ? parseInt(req.query.points) : null;
  
  res.render('accrual', { 
    member, 
    products: catalogConfig.products,
    activities: catalogConfig.activities,
    message,
    pointsEarned
  });
});

// Procesar compra
router.post('/purchase/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = catalogConfig.products.find(p => p.id === productId);
  
  if (!product) {
    return res.redirect('/accrual?message=Producto no encontrado');
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
        
      return res.redirect(`/accrual?message=Compra exitosa: ${product.name}&points=${product.points}&newAchievement=true&achievementName=${newAchievement.name}&achievementPoints=${newAchievement.points}`);
    }
    
    res.redirect(`/accrual?message=Compra exitosa: ${product.name}&points=${product.points}`);
  } catch (error) {
    res.redirect(`/accrual?message=Error: ${error.message}`);
  }
});

// Procesar actividad
router.post('/activity/:id', (req, res) => {
  const activityId = parseInt(req.params.id);
  const activity = catalogConfig.activities.find(a => a.id === activityId);
  
  if (!activity) {
    return res.redirect('/accrual?message=Actividad no encontrada');
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
        
      return res.redirect(`/accrual?message=Actividad completada: ${activity.name}&points=${activity.points}&newAchievement=true&achievementName=${newAchievement.name}&achievementPoints=${newAchievement.points}`);
    }
    
    res.redirect(`/accrual?message=Actividad completada: ${activity.name}&points=${activity.points}`);
  } catch (error) {
    res.redirect(`/accrual?message=Error: ${error.message}`);
  }
});

module.exports = router;