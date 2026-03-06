// config/brand.js - Identidad Visual y Mensajes de Club MAPFRE
module.exports = {
  name: 'Club MAPFRE',
  fullName: 'Club MAPFRE',
  pointsName: 'Tréboles',
  pointsSymbol: '🍀',

  messages: {
    welcome: '¡Bienvenido al Club MAPFRE!',
    welcomeDescription: 'El programa de fidelización diseñado para estar a tu lado y premiar tu confianza.',
    tagline: 'Tu confianza siempre tiene recompensa',
    joinClub: 'ACCEDER AL ÁREA DE CLIENTE',
    // IMPORTANTE: Movemos features aquí para que el index.ejs lo encuentre
    features: [
      {
        title: 'Acumula Tréboles',
        description: 'Consigue Tréboles al renovar tus pólizas y canjéalos por descuentos.'
      },
      {
        title: 'Beneficios Exclusivos',
        description: 'Accede a sorteos, eventos y servicios de salud por ser cliente.'
      }
    ]
  },
  
  colors: {
    primary: '#D31411',        // ROJO MAPFRE
    secondary: '#00519E',      // AZUL MAPFRE
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

    tierColors: {
      bronze: '#A0522D',       
      silver: '#808080',       
      gold: '#C5A021',         
      platinum: '#2C3E50'      
    }
  },
  
  images: {
    logo: '/img/logo.png',
    favicon: '/img/favicon.ico'
  },
  
  copyright: `© ${new Date().getFullYear()} MAPFRE S.A. Todos los derechos reservados.`
};