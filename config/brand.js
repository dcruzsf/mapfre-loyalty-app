// config/brand.js - Configuración centralizada de marca CaixaBank Experience
module.exports = {
  // Información básica de la marca
  name: 'CaixaBank Experience',
  fullName: 'CaixaBank Experience',
  pointsName: 'Caixapoints',
  pointsSymbol: '⭐',

  // Mensajes y textos
  messages: {
    welcome: '¡Bienvenido a CaixaBank Experience!',
    welcomeDescription: 'Tu banca 100% digital que premia tu estilo de vida',
    tagline: 'Banca digital que te impulsa',
    joinClub: 'COMENZAR EXPERIENCE',
    benefits: {
      title: 'BENEFICIOS DIGITALES',
      list: [
        'Gana Caixapoints con cada operación digital',
        'Cashback instantáneo en tus compras',
        'Acceso prioritario a nuevas funcionalidades',
        'Experiencias exclusivas personalizadas'
      ]
    },
    features: [
      {
        title: 'Gana Caixapoints',
        description: 'Acumula Caixapoints con cada operación digital: transferencias, pagos móviles, inversiones y más.'
      },
      {
        title: 'Desbloquea logros',
        description: 'Completa retos digitales y alcanza objetivos financieros mientras ganas recompensas.'
      },
      {
        title: 'Evoluciona tu categoría',
        description: 'Desde Basic hasta Elite: más uso digital, mejores beneficios exclusivos.'
      }
    ]
  },
  
  // Paleta de colores - CaixaBank Experience (moderna y digital)
  colors: {
    primary: '#0066B3',        // Azul CaixaBank principal - vibrante
    secondary: '#00C9FF',      // Azul cielo brillante (digital)
    accent: '#003D6E',         // Azul profundo premium
    lightGray: '#F8F9FB',      // Gris ultra claro (background limpio)
    midGray: '#E4E8ED',        // Gris medio suave
    darkGray: '#7A8C9E',       // Gris texto secundario
    textColor: '#1A2332',      // Texto principal (casi negro, pero más suave)
    textLight: '#5F6F82',      // Texto secundario legible
    backgroundColor: '#FFFFFF',
    cardBackground: '#FFFFFF',
    borderColor: '#E8ECF1',    // Bordes ultra sutiles
    successColor: '#00E676',   // Verde brillante (digital success)
    errorColor: '#FF3D71',     // Rojo moderno
    warningColor: '#FFB800',   // Amarillo/naranja advertencias
    notificationColor: '#00C9FF', // Azul notificaciones brillante

    // Colores de tier - Inspirados en tarjetas premium modernas
    tierColors: {
      bronze: '#B87333',       // Basic - Bronce cálido
      silver: '#B8BEC5',       // Plus - Plata moderna
      gold: '#F4C542',         // Premium - Oro vibrante
      platinum: '#C9D5E0'      // Elite - Platino elegante
    }
  },
  
  // Rutas de imágenes
  images: {
    logo: '/img/logo.png',
    background: '/img/background.png',
    favicon: '/img/favicon.ico'
  },
  
  // Categorías de productos/intereses para registro (enfoque digital)
  categories: [
    { id: 'digital_banking', label: 'Banca digital y pagos móviles' },
    { id: 'investments', label: 'Inversiones y ahorro inteligente' },
    { id: 'lifestyle', label: 'Experiencias y lifestyle' }
  ],

  // Copyright
  copyright: '2024-2025 CaixaBank Experience, S.A.'
};