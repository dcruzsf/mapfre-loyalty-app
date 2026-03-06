// config/index.js - Configuración maestra centralizada
const brandConfig = require('./brand');
const catalogConfig = require('./catalog');
const tiersConfig = require('./tiers');

module.exports = {
  brand: brandConfig,
  catalog: catalogConfig,
  tiers: tiersConfig,
  
  system: {
    initialBalance: 250, 
    maxAchievements: 10,
    sessionDuration: 24 * 60 * 60 * 1000,
    
    scoring: {
      weights: {
        achievements: 0.40,
        levelPoints:  0.25,
        rewardPoints: 0.15,
        tier:         0.15,
        balance:      0.05
      },
      maxLevelPoints: 2000,
      engagementLevels: {
        90: 'Experto',
        75: 'Entusiasta', 
        60: 'Comprometido',
        40: 'Activo',
        20: 'Casual',
        0: 'Principiante'
      }
    }
  },

  validate: function() {
    const errors = [];
    catalogConfig.products.forEach(product => {
      if (!product.image) errors.push(`Producto ${product.name} no tiene imagen`);
    });
    tiersConfig.tiers.forEach(tier => {
      if (!brandConfig.colors.tierColors[tier.name.toLowerCase()]) {
        errors.push(`Tier ${tier.name} sin color definido`);
      }
    });
    return errors;
  }
};