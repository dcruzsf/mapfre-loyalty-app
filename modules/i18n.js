const fs = require('fs');
const path = require('path');

class I18n {
  constructor() {
    if (I18n.instance) {
      return I18n.instance;
    }

    this.defaultLocale = 'es';
    this.availableLocales = ['es', 'en'];
    this.translations = {};
    this.localesPath = path.join(__dirname, '../locales');

    this.loadTranslations();

    I18n.instance = this;
    return this;
  }

  static getInstance() {
    if (!I18n.instance) {
      new I18n();
    }
    return I18n.instance;
  }

  loadTranslations() {
    this.availableLocales.forEach(locale => {
      try {
        const filePath = path.join(this.localesPath, `${locale}.json`);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          this.translations[locale] = JSON.parse(content);
        } else {
          console.warn(`Translation file not found: ${filePath}`);
          this.translations[locale] = {};
        }
      } catch (error) {
        console.error(`Error loading translations for ${locale}:`, error);
        this.translations[locale] = {};
      }
    });
  }

  t(key, locale = this.defaultLocale) {
    if (!locale || !this.availableLocales.includes(locale)) {
      locale = this.defaultLocale;
    }

    const keys = key.split('.');
    let value = this.translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback al idioma por defecto
        if (locale !== this.defaultLocale) {
          return this.t(key, this.defaultLocale);
        }
        // Si tampoco está en el idioma por defecto, devolver la clave
        return key;
      }
    }

    return value || key;
  }

  detectLocaleFromRequest(req) {
    // 1. Query parameter (?lang=es) - Permite cambio explícito de idioma
    if (req.query.lang && this.availableLocales.includes(req.query.lang)) {
      return req.query.lang;
    }

    // 2. Session - Solo si el usuario cambió explícitamente el idioma
    if (req.session && req.session.locale && this.availableLocales.includes(req.session.locale)) {
      return req.session.locale;
    }

    // 3. Siempre usar español por defecto (no detectar del navegador)
    // El usuario puede cambiar explícitamente usando el selector de idioma
    return this.defaultLocale;
  }

  middleware() {
    return (req, res, next) => {
      // Detectar idioma
      const locale = this.detectLocaleFromRequest(req);

      // Guardar en sesión
      if (req.session) {
        req.session.locale = locale;
      }

      // Hacer disponible en request
      req.locale = locale;

      // Helper functions para las vistas
      res.locals.t = (key) => this.t(key, locale);
      res.locals.locale = locale;
      res.locals.availableLocales = this.availableLocales;

      next();
    };
  }

  setLocale(req, locale) {
    if (this.availableLocales.includes(locale)) {
      if (req.session) {
        req.session.locale = locale;
      }
      req.locale = locale;
      return true;
    }
    return false;
  }

  getAvailableLocales() {
    return this.availableLocales;
  }

  getDefaultLocale() {
    return this.defaultLocale;
  }
}

// Exportar instancia singleton
module.exports = I18n.getInstance();