// config/brand.js - Textos CaixaBank Experience, Colores estilo Imagin
module.exports = {
  // Información básica de la marca
  name: 'Imagin Experience',
  fullName: 'Imagin Experience',
  pointsName: 'Puntos',
  pointsSymbol: '⭐',

  // Mensajes y textos (ORIGINALES)
  messages: {
    welcome: '¡Bienvenido a Imagin Experience!',
    welcomeDescription: 'Tu banca digital que premia tu estilo de vida y fidelidad.',
    tagline: 'Experiencias que suman',
    joinClub: 'COMENZAR EXPERIENCE',
    benefits: {
      title: 'BENEFICIOS DEL PROGRAMA',
      list: [
        'Puntos en todas tus operaciones',
        'Acceso a productos exclusivos',
        'Experiencias personalizadas',
        'Atención prioritaria'
      ]
    },
    features: [
      {
        title: 'Gana Puntos',
        description: 'Acumula Puntos con tus operaciones diarias, productos contratados y participación digital.'
      },
      {
        title: 'Desbloquea Logros',
        description: 'Supera retos financieros y de estilo de vida para conseguir medallas y bonificaciones extra.'
      }
    ]
  },
  
  // Paleta de colores - Estilo Imagin (Vibrante y Contrastado)
  colors: {
    primary: '#00E39F',        // VERDE IMAGIN (Botones principales, acciones)
    secondary: '#000000',      // NEGRO (Botones secundarios, textos fuertes)
    accent: '#FF0049',         // ROSA IMAGIN (Detalles, destacados, iconos)
    lightGray: '#FAFAFA',      // Fondo casi blanco
    midGray: '#F2F2F2',        // Fondos de elementos secundarios
    darkGray: '#707070',       // Texto gris
    textColor: '#121212',      // Negro casi puro para lectura
    textLight: '#707070',      // Gris para subtítulos
    backgroundColor: '#FFFFFF', // Fondo blanco limpio
    cardBackground: '#FFFFFF',  // Tarjetas blancas
    borderColor: '#F0F0F0',    // Bordes muy sutiles
    successColor: '#00E39F',   // Verde Neón para éxito
    errorColor: '#FF3B30',     // Rojo vibrante
    warningColor: '#FFCC00',   // Amarillo
    notificationColor: '#FF0049', // Rosa para notificaciones

    // Colores de tier - Estilo minimalista/metálico
    tierColors: {
      bronze: '#CD7F32',       // Bronce
      silver: '#A0A0A0',       // Plata (más oscuro para contraste sobre blanco)
      gold: '#EDB328',         // Oro
      platinum: '#191919'      // Platino/Negro (Estilo tarjeta Infinity)
    }
  },
  
  // Rutas de imágenes
  images: {
    logo: '/img/logo.png',
    background: '/img/background.png',
    favicon: '/img/favicon.ico'
  },
  
  // Categorías (ORIGINALES)
  categories: [
    { id: 'banking', label: 'Banca del día a día' },
    { id: 'savings', label: 'Ahorro e Inversión' },
    { id: 'financing', label: 'Financiación' },
    { id: 'insurance', label: 'Seguros y Protección' },
    { id: 'lifestyle', label: 'Ocio y Experiencias' }
  ],

  // Copyright
  copyright: '2024-2025 CaixaBank, S.A. Todos los derechos reservados.'
};