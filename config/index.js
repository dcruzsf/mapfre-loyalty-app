// config/index.js
module.exports = {
  brand: {
    name: 'Club MAPFRE',
    fullName: 'Club MAPFRE',
    logo: '/img/logo.png',
    messages: {
      tagline: 'Tu fidelidad siempre tiene recompensa',
      welcome: 'Bienvenido a Club MAPFRE'
    }
  },
  // Esta parte es vital para que la creación de miembros no falle
  salesforce: {
    loyaltyProgramName: 'Club MAPFRE',
    currencyName: 'Tréboles'
  },
  // Configuración de la aplicación
  port: process.env.PORT || 3000,
  useSalesforce: process.env.USE_SALESFORCE === 'true'
};