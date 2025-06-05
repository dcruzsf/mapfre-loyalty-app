const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');

// Importar configuraciones centralizadas
const brandConfig = require('../config/brand');
const catalogConfig = require('../config/catalog');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Mostrar página de logros
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  
  // Verificar si hay nueva notificación de logro
  const newAchievement = req.query.newAchievement === 'true';
  const achievementName = req.query.achievementName;
  const achievementPoints = req.query.achievementPoints ? parseInt(req.query.achievementPoints) : null;
  
  res.render('achievements', { 
    member,
    allAchievements: catalogConfig.achievements, // Usar configuración centralizada
    newAchievement,
    achievementName,
    achievementPoints
  });
});

module.exports = router;