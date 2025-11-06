// middleware/auth.js
const Member = require('../models/member');
const i18n = require('../modules/i18n');
const salesforceLoyalty = require('../modules/salesforceLoyalty');

/**
 * Middleware para verificar que el usuario tiene una sesión activa
 */
const requireAuth = async (req, res, next) => {
  const locale = req.locale || 'es';

  if (!req.session.memberId) {
    const message = i18n.t('messages.authRequired', locale);
    return res.redirect(`/register?message=${encodeURIComponent(message)}`);
  }

  // Verificar que el miembro todavía existe
  const member = Member.findById(req.session.memberId);
  if (!member) {
    // La sesión es inválida, destruirla
    req.session.destroy();
    const message = i18n.t('messages.sessionExpiredAuth', locale);
    return res.redirect(`/register?message=${encodeURIComponent(message)}`);
  }

  // Añadir el miembro al objeto request para fácil acceso
  req.member = member;

  // Cargar badges si está en modo Salesforce
  if (member.salesforceId && process.env.USE_SALESFORCE === 'true') {
    try {
      const badges = await salesforceLoyalty.getMemberBadges(member.salesforceId);
      req.member.badges = badges;
      res.locals.memberBadges = badges;
    } catch (error) {
      console.warn('⚠️ No se pudieron cargar badges:', error.message);
      req.member.badges = [];
      res.locals.memberBadges = [];
    }
  } else {
    req.member.badges = [];
    res.locals.memberBadges = [];
  }

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