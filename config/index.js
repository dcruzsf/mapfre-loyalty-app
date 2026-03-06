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
    sessionDuration: 24 * 60 * 60 * 1000,
    scoring: {
      weights: { achievements: 0.40, levelPoints: 0.25, rewardPoints: 0.15, tier: 0.15, balance: 0.05 },
      maxLevelPoints: 2000
    }
  }
};