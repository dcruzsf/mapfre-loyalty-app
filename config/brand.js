module.exports = {
  // Información básica de la marca - Identidad Mapfre
  name: 'Mapfre Fidelidad',
  fullName: 'Mapfre Te Cuidamos',
  pointsName: 'Tréboles', // El sistema de fidelización de Mapfre se basa en Tréboles
  pointsSymbol: '🍀',

  // Mensajes y textos (ADAPTADOS A MAPFRE)
  messages: {
    welcome: '¡Bienvenido a Mapfre Te Cuidamos!',
    welcomeDescription: 'El programa de fidelización diseñado para estar a tu lado y premiar tu confianza.',
    tagline: 'Tu confianza siempre tiene recompensa',
    joinClub: 'ACCEDER AL ÁREA DE CLIENTE',
    benefits: {
      title: 'VENTAJAS DEL PROGRAMA',
      list: [
        'Ahorro en la renovación de tus seguros',
        'Descuentos exclusivos en marcas asociadas',
        'Acceso a servicios de salud y bienestar',
        'Asistencia personalizada 24/7'
      ]
    },
    features: [
      {
        title: 'Acumula Tréboles',
        description: 'Consigue Tréboles al contratar o renovar tus pólizas y canjéalos por descuentos en tus recibos.'
      },
      {
        title: 'Plan de Fidelización',
        description: 'Accede a sorteos, eventos exclusivos y beneficios directos por ser cliente de Mapfre.'
      }
    ]
  },
  
  // Paleta de colores - Estilo Mapfre (Corporativo, Fiable, Rojo Institucional)
  colors: {
    primary: '#D31411',        // ROJO MAPFRE (Identidad principal)
    secondary: '#00519E',      // AZUL MAPFRE (Contraste corporativo, botones secundarios)
    accent: '#D31411',         // Mantenemos el rojo para elementos clave
    lightGray: '#F4F4F4',      // Gris muy claro para fondos de sección
    midGray: '#E6E6E6',        // Separadores
    darkGray: '#4D4D4D',       // Texto secundario
    textColor: '#333333',      // Gris oscuro (mejor legibilidad que negro puro)
    textLight: '#666666',      // Subtítulos
    backgroundColor: '#FFFFFF', // Fondo principal
    cardBackground: '#FFFFFF',  
    borderColor: '#D1D1D1',    
    successColor: '#28A745',   // Verde estándar de éxito
    errorColor: '#B00020',     // Rojo de error (diferente al corporativo)
    warningColor: '#FFC107',   // Ámbar de precaución
    notificationColor: '#00519E', // Azul para avisos informativos

    // Colores de tier - Estilo sobrio/distintivo
    tierColors: {
      bronze: '#A0522D',       
      silver: '#808080',       
      gold: '#C5A021',         
      platinum: '#2C3E50'      // Azul petróleo profundo
    }
  },
  
  // Rutas de imágenes (Actualizadas a la nueva marca)
  images: {
    logo: '/img/logo-mapfre.png',
    background: '/img/bg-mapfre-clean.jpg',
    favicon: '/img/favicon-mapfre.ico'
  },
  
  // Categorías (Enfoque en Seguros y Protección)
  categories: [
    { id: 'vehicles', label: 'Vehículos' },
    { id: 'home', label: 'Hogar' },
    { id: 'health', label: 'Salud' },
    { id: 'life', label: 'Vida y Planificación' },
    { id: 'leisure', label: 'Viajes y Ocio' }
  ],

  // Copyright
  copyright: `© ${new Date().getFullYear()} MAPFRE S.A. Todos los derechos reservados.`
};