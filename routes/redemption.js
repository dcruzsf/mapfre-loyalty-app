const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const { requireAuth } = require('../middleware/auth');

// Importar configuración centralizada
const catalogConfig = require('../config/catalog');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Función para generar un código aleatorio
const generateRedemptionCode = (prefix) => {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = prefix + '-';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Mostrar página de redención
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  
  // Verificar si hay mensaje de éxito y puntos canjeados
  const message = req.query.message;
  const pointsRedeemed = req.query.points ? parseInt(req.query.points) : null;
  const codeGenerated = req.query.code || null;
  const rewardId = req.query.rewardId ? parseInt(req.query.rewardId) : null;
  const redeemedReward = rewardId ? catalogConfig.rewards.find(r => r.id === rewardId) : null;
  
  res.render('redemption', { 
    member, 
    rewards: catalogConfig.rewards,
    message,
    pointsRedeemed,
    codeGenerated,
    redeemedReward
  });
});

// Procesar redención
router.post('/redeem/:id', (req, res) => {
  const rewardId = parseInt(req.params.id);
  const reward = catalogConfig.rewards.find(r => r.id === rewardId);
  
  if (!reward) {
    return res.redirect('/redemption?message=Recompensa no encontrada');
  }
  
  const member = req.member; // Viene del middleware requireAuth
  
  try {
    // Usar puntos de rewards
    member.usePoints(reward.points, `Redención: ${reward.name}`);
    
    // Generar código usando el prefix configurado
    const redemptionCode = generateRedemptionCode(reward.codePrefix);
    
    console.log(`${member.name} canjeó ${reward.name} por ${reward.points} puntos. Código: ${redemptionCode}`);
    
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
        
      return res.redirect(`/redemption?message=Redención exitosa: ${reward.name}&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}&newAchievement=true&achievementName=${newAchievement.name}&achievementPoints=${newAchievement.points}`);
    }
    
    res.redirect(`/redemption?message=Redención exitosa: ${reward.name}&points=${reward.points}&code=${redemptionCode}&rewardId=${reward.id}`);
  } catch (error) {
    res.redirect(`/redemption?message=Error: ${error.message}`);
  }
});

module.exports = router;