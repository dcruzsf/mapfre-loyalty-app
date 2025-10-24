const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const basicAuth = require('express-basic-auth');
require('dotenv').config();

// Importar configuración de marca
const brandConfig = require('./config/brand');

// Importar módulos de internacionalización
const i18n = require('./modules/i18n');
const brandTranslations = require('./modules/brandTranslations');

// Importar rutas
const indexRoutes = require('./routes/index');
const registerRoutes = require('./routes/register');
const accrualRoutes = require('./routes/accrual');
const redemptionRoutes = require('./routes/redemption');
const promotionsRoutes = require('./routes/promotions');
const leaderboardRoutes = require('./routes/leaderboard');

// Inicializar app
const app = express();
const PORT = process.env.PORT || 3000;

// Configurar autenticación básica (antes de cualquier otro middleware)
if (process.env.NODE_ENV !== 'development') {
  app.use(basicAuth({
    users: { 
      [process.env.ADMIN_USERNAME]: process.env.ADMIN_PASSWORD
    },
    challenge: true,
    realm: `${brandConfig.fullName} Demo App`,
  }));
}

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware de internacionalización (después de sessions)
app.use(i18n.middleware());

// Middleware para hacer disponible la URL actual en las vistas
app.use((req, res, next) => {
  res.locals.currentUrl = req.originalUrl;
  next();
});

// Configuración de middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración del motor de plantillas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware para hacer disponible la configuración de marca traducida en todas las vistas
app.use((req, res, next) => {
  const locale = req.locale || 'es';
  res.locals.brand = brandTranslations.getTranslatedBrand(brandConfig, locale);
  next();
});

// Middleware para verificar configuración de Salesforce
app.use((req, res, next) => {
  const useSalesforce = process.env.USE_SALESFORCE === 'true';
  
  // Pasar variable a todas las vistas
  res.locals.useSalesforce = useSalesforce;
  
  // Si estamos usando Salesforce, mostrar mensaje en consola
  if (useSalesforce) {
    console.log('Modo Salesforce Loyalty Management ACTIVADO');
  } else {
    console.log('Modo Demo local ACTIVADO (sin conexión a Salesforce)');
  }
  
  next();
});

// Middleware para pasar información de sesión a las vistas
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.memberId = req.session.memberId || null;
  
  // Obtener el miembro actual si existe sesión
  if (req.session.memberId) {
    const Member = require('./models/member');
    const currentMember = Member.findById(req.session.memberId);
    if (currentMember) {
      res.locals.member = currentMember;
      req.member = currentMember;
    } else {
      // Sesión inválida, limpiarla
      req.session.destroy();
      res.locals.member = null;
    }
  } else {
    res.locals.member = null;
  }
  
  next();
});

// Ruta para cambio de idioma
app.get('/change-language/:lang', (req, res) => {
  const { lang } = req.params;
  const redirect = req.query.redirect || '/';

  // Validar idioma y establecerlo
  if (i18n.setLocale(req, lang)) {
    // Regenerar el helper con el nuevo idioma
    res.locals.t = (key) => i18n.t(key, req.locale);
    res.locals.locale = req.locale;
  }

  res.redirect(redirect);
});

// Rutas
app.use('/', indexRoutes);
app.use('/register', registerRoutes);
app.use('/accrual', accrualRoutes);
app.use('/redemption', redemptionRoutes);
app.use('/promotions', promotionsRoutes);
app.use('/leaderboard', leaderboardRoutes);

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error al cerrar sesión:', err);
    }
    res.redirect('/');
  });
});

// Manejo de errores - asegurarse de que este middleware esté al final
app.use((err, req, res, next) => {
  console.error(err.stack);
  const locale = req.locale || 'es';
  res.status(500).render('error', {
    message: err.message || i18n.t('pages.error.internalError', locale),
    error: process.env.NODE_ENV === 'development' ? err : {},
    currentPage: 'error'
  });
});

// Manejo de 404 - página no encontrada
app.use((req, res, next) => {
  const locale = req.locale || 'es';
  res.status(404).render('error', {
    message: i18n.t('pages.error.notFound', locale),
    error: { status: 404 },
    currentPage: 'error'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
  console.log(`Marca: ${brandConfig.fullName}`);
  console.log(`Modo: ${process.env.USE_SALESFORCE === 'true' ? 'Salesforce Loyalty' : 'Demo Local'}`);
});