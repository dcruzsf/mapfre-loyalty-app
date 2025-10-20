// config/tiers.js - Sistema de niveles CaixaBank Experience (estilo Revolut)
module.exports = {
  // Definición de niveles con beneficios digitales
  tiers: [
    {
      name: 'Bronze',
      threshold: 0,
      displayName: 'Basic',
      color: '#B87333',
      benefits: [
        'Caixapoints base en operaciones digitales',
        'Acceso a recompensas básicas',
        'App móvil sin comisiones'
      ]
    },
    {
      name: 'Silver',
      threshold: 500,
      displayName: 'Plus',
      color: '#B8BEC5',
      benefits: [
        'Caixapoints + 15% de bonus',
        'Cashback mejorado (1% en compras)',
        'Transferencias internacionales sin comisión',
        'Tarjetas virtuales ilimitadas'
      ]
    },
    {
      name: 'Gold',
      threshold: 1000,
      displayName: 'Premium',
      color: '#F4C542',
      benefits: [
        'Caixapoints + 30% de bonus',
        'Cashback premium (2% en compras)',
        'Asesoría financiera digital por videollamada',
        'Acceso prioritario a nuevas funcionalidades',
        'Sin comisiones en operaciones internacionales'
      ]
    },
    {
      name: 'Platinum',
      threshold: 2000,
      displayName: 'Elite',
      color: '#C9D5E0',
      benefits: [
        'Caixapoints + 50% de bonus',
        'Cashback elite (3% en compras)',
        'Gestor personal 24/7',
        'Acceso VIP a eventos exclusivos',
        'Inversión asistida por IA premium',
        'Upgrade gratuito de tarjeta a metal premium'
      ]
    }
  ],

  // Configuración de progreso
  maxPoints: 2000,
  
  // Configuración para cálculo de progreso
  getProgressCalculation: (currentPoints, currentTier, nextTier) => {
    if (!nextTier) return 100;
    const pointsDifference = nextTier.threshold - currentTier.threshold;
    const pointsProgress = currentPoints - currentTier.threshold;
    return Math.round((pointsProgress / pointsDifference) * 100);
  },

  // Función para obtener tier actual basado en puntos
  getTierByPoints: function(points) {
    const sortedTiers = [...this.tiers].sort((a, b) => b.threshold - a.threshold);
    return sortedTiers.find(tier => points >= tier.threshold) || this.tiers[0];
  },

  // Función para obtener el siguiente tier
  getNextTier: function(currentTierName) {
    const currentIndex = this.tiers.findIndex(tier => tier.name === currentTierName);
    return currentIndex < this.tiers.length - 1 ? this.tiers[currentIndex + 1] : null;
  },

  // Función para obtener tier por nombre
  getTierByName: function(tierName) {
    return this.tiers.find(tier => tier.name === tierName);
  }
};