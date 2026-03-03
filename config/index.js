const brandConfig = require('./brand');
const catalogConfig = require('./catalog');
const tiersConfig = require('./tiers');

module.exports = {
  brand: brandConfig,
  catalog: catalogConfig,
  tiers: tiersConfig,
  
  // Configuraciones del sistema Mapfre
  system: {
    initialBalance: 50, // Los "Tréboles" son más valiosos que los puntos estándar (1 Trébol suele equivaler a 1€ en Mapfre)
    maxAchievements: 15, // Mapfre tiene muchos hitos (antigüedad, no siniestralidad, multirriesgo)
    sessionDuration: 12 * 60 * 60 * 1000, // 12 horas (más restrictivo por seguridad corporativa)
    
    // Configuración de scoring para el ranking de "Mejor Cliente"
    scoring: {
      weights: {
        achievements: 0.30,  // 30% - Hitos (ej: 10 años sin partes)
        levelPoints:  0.30,  // 30% - Volumen de pólizas (Tréboles totales)
        rewardPoints: 0.10,  // 10% - Uso de beneficios
        tier:         0.25,  // 25% - El nivel de cliente (Plata, Oro, etc.) pesa más aquí
        balance:      0.05   // 5%  - Tréboles acumulados actualmente
      },
      maxLevelPoints: 3000, // Ajustado al threshold del nivel Diamante definido en tiers.js
      
      // Semántica adaptada a una relación de confianza cliente-aseguradora
      engagementLevels: {
        90: 'Socio de Honor',
        75: 'Cliente Vitalicio', 
        60: 'Cliente Preferente',
        40: 'Cliente Vinculado',
        20: 'Cliente Iniciado',
        0: 'Nuevo Cliente'
      }
    }
  },

  // Función de utilidad para validar configuración
  validate: function() {
    const errors = [];
    
    // 1. Validar productos
    catalogConfig.products.forEach(product => {
      if (!product.image) {
        errors.push(`Servicio/Beneficio ${product.name} no tiene imagen definida`);
      }
    });
    
    // 2. Validar colores de Tiers (Corregido para que coincida exactamente con tiers.js)
    tiersConfig.tiers.forEach(tier => {
      // Usamos el nombre del tier en minúsculas para buscar en brand.js
      const tierKey = tier.name.toLowerCase();
      if (!brandConfig.colors.tierColors[tierKey]) {
        errors.push(`El nivel ${tier.name} no tiene un color asignado en brand.colors.tierColors`);
      }
    });
    
    // 3. Validar hito de bienvenida
    const welcomeAchievement = catalogConfig.achievements.find(a => a.autoUnlock);
    if (!welcomeAchievement) {
      errors.push('Falta el hito de "Bienvenida al Plan Te Cuidamos" (autoUnlock: true)');
    }
    
    return errors;
  }
};