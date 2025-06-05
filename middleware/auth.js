// middleware/auth.js
const Member = require('../models/member');

/**
 * Middleware para verificar que el usuario tiene una sesión activa
 */
const requireAuth = (req, res, next) => {
  if (!req.session.memberId) {
    return res.redirect('/register?message=Debes registrarte para acceder a esta función');
  }
  
  // Verificar que el miembro todavía existe
  const member = Member.findById(req.session.memberId);
  if (!member) {
    // La sesión es inválida, destruirla
    req.session.destroy();
    return res.redirect('/register?message=Tu sesión ha expirado. Por favor, regístrate nuevamente');
  }
  
  // Añadir el miembro al objeto request para fácil acceso
  req.member = member;
  next();
};

/**
 * Middleware para obtener el miembro actual (si existe)
 * No requiere autenticación, simplemente añade el miembro si está disponible
 */
const getCurrentMember = (req, res, next) => {
  if (req.session.memberId) {
    const member = Member.findById(req.session.memberId);
    if (member) {
      req.member = member;
      res.locals.member = member;
    } else {
      // Sesión inválida, limpiarla
      req.session.destroy();
    }
  }
  next();
};

/**
 * Middleware para redirigir usuarios autenticados
 * Útil para páginas como registro que no deberían ser accesibles si ya están logueados
 */
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.memberId) {
    const member = Member.findById(req.session.memberId);
    if (member) {
      return res.redirect('/');
    }
  }
  next();
};

module.exports = {
  requireAuth,
  getCurrentMember,
  redirectIfAuthenticated
};