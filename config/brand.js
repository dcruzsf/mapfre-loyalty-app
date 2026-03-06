// config/brand.js - Identidad Visual y Mensajes Maestros de Club MAPFRE
module.exports = {
  name: 'Club MAPFRE',
  fullName: 'Club MAPFRE',
  pointsName: 'Tréboles',
  pointsSymbol: '🍀',

  // Secciones de mensajes para las vistas
  messages: {
    welcome: '¡Bienvenido al Club MAPFRE!',
    welcomeDescription: 'El programa de fidelización diseñado para estar a tu lado y premiar tu confianza.',
    tagline: 'Tu confianza siempre tiene recompensa',
    joinClub: 'ACCEDER AL ÁREA DE CLIENTE',
    features: [
      {
        title: 'Acumula Tréboles',
        description: 'Consigue Tréboles al renovar tus pólizas y canjéalos por descuentos en tus recibos.',
        icon: 'gift'
      },
      {
        title: 'Beneficios Exclusivos',
        description: 'Accede a sorteos, eventos y servicios de salud por ser cliente de MAPFRE.',
        icon: 'trophy'
      },
      {
        title: 'Ahorro Directo',
        description: 'Utiliza tus tréboles para reducir el coste de tus seguros actuales.',
        icon: 'bolt'
      }
    ]
  },
  
  // Paleta de colores completa (Requerida por header.ejs)
  colors: {
    primary: '#D31411',         // ROJO MAPFRE
    secondary: '#00519E',       // AZUL MAPFRE
    accent: '#D31411',          
    lightGray: '#F4F4F4',       
    midGray: '#E6E6E6',         
    darkGray: '#4D4D4D',        
    textColor: '#333333',       
    textLight: '#666666',       
    backgroundColor: '#FFFFFF', 
    cardBackground: '#FFFFFF',  
    borderColor: '#D1D1D1',     
    successColor: '#28A745',    
    errorColor: '#B00020',      
    notificationColor: '#00519E',
    
    // Colores de los niveles (VITAL para evitar error 'reading bronze')
    tierColors: {
      bronze: '#A0522D',        // Plata (Nivel inicial)
      silver: '#808080',        // Oro
      gold: '#C5A021',          // Platino
      platinum: '#2C3E50'       // Diamante
    }
  },
  
  // Activos visuales
  images: {
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fd/LOGO-MAPFRE.jpg',
    favicon: '/img/favicon.ico',
    background: '/img/bg-mapfre.jpg'
  },
  
  // Configuración de visualización
  layout: {
    showBadges: true,
    showTierProgress: true
  },

  copyright: `© ${new Date().getFullYear()} MAPFRE S.A. Todos los derechos reservados.`
};