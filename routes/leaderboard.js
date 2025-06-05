const express = require('express');
const router = express.Router();
const Member = require('../models/member');
const leaderboard = require('../modules/leaderboard');
const { requireAuth } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(requireAuth);

// Mostrar página de leaderboard
router.get('/', (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  
  // Calcular el scoring sin enviarlo aún a Salesforce (solo para mostrar)
  const scorePreview = leaderboard.calculatePreview(member);
  
  // Verificar si ya se ha enviado al leaderboard
  const hasSubmitted = member.leaderboardSubmitted || false;
  
  // Verificar si hay mensaje de confirmación o error
  const successMessage = req.query.success ? 'Tu scoring ha sido enviado al leaderboard exitosamente' : null;
  const errorMessage = req.query.error || null;
  
  // Verificar si el miembro tiene salesforceId (solo en modo Salesforce)
  const useSalesforce = process.env.USE_SALESFORCE === 'true';
  const missingId = useSalesforce && !member.salesforceId;
  
  res.render('leaderboard', { 
    member,
    scorePreview,
    hasSubmitted,
    successMessage,
    errorMessage,
    missingId,
    useSalesforce,
    currentPage: 'leaderboard'
  });
});

// Procesar envío al leaderboard
router.post('/submit', async (req, res) => {
  const member = req.member; // Viene del middleware requireAuth
  
  try {
    // Verificar si el modo Salesforce está activo
    const useSalesforce = process.env.USE_SALESFORCE === 'true';
    
    // Si estamos en modo Salesforce y no hay ID, mostrar error
    if (useSalesforce && !member.salesforceId) {
      return res.redirect('/leaderboard?error=El miembro no tiene un ID de Salesforce asignado. Por favor, regístrate nuevamente con el modo Salesforce activado.');
    }
    
    // Enviar al leaderboard (en modo Salesforce o demo)
    const result = await leaderboard.submitToLeaderboard(member);
    
    // Marcar como enviado en nuestro modelo local
    member.leaderboardSubmitted = true;
    member.leaderboardScore = result.score;
    member.leaderboardSubmittedAt = new Date();
    
    // Añadir transacción de sistema
    member._addTransaction(
      'System', 
      'Scoring enviado al leaderboard', 
      0, 0, 0, 0
    );
    
    console.log(`${member.name} envió su scoring al leaderboard: ${result.score} puntos`);
    
    // Redirigir con mensaje de éxito
    res.redirect('/leaderboard?success=true');
  } catch (error) {
    console.error('Error al enviar al leaderboard:', error);
    res.redirect(`/leaderboard?error=${encodeURIComponent(error.message)}`);
  }
});

module.exports = router;