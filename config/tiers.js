module.exports = {
  // Definición de niveles basada en el programa "Te Cuidamos" de Mapfre
  tiers: [
    {
      name: 'Plata',
      threshold: 0,
      displayName: 'Cliente Plata',
      color: '#A0A0A0',
      benefits: [
        'Acumulación base de Tréboles en tus seguros',
        'Acceso a descuentos en la Red de Talleres Distinguidos',
        'Servicio de Bricolaje en el hogar (según póliza)',
        'Acceso a promociones en ocio y viajes'
      ]
    },
    {
      name: 'Oro',
      threshold: 500,
      displayName: 'Cliente Oro',
      color: '#D4AF37',
      benefits: [
        'Bonificación del 5% extra en Tréboles',
        'Revisión gratuita de seguridad del vehículo',
        'Asesoramiento médico telefónico 24h',
        'Descuentos exclusivos en renovación de primas'
      ]
    },
    {
      name: 'Platino',
      threshold: 1500,
      displayName: 'Cliente Platino',
      color: '#333333', // Estilo tarjeta Black/Premium
      benefits: [
        'Bonificación del 15% extra en Tréboles',
        'Gestor de seguros personal dedicado',
        'Prioridad en asistencia en carretera (menos de 30 min)',
        'Servicio de defensa jurídica ampliada',
        'Acceso gratuito a eventos culturales Mapfre'
      ]
    },
    {
      name: 'Diamante',
      threshold: 3000,
      displayName: 'Cliente Diamante',
      color: '#D31411', // El rojo corporativo como nivel máximo de confianza
      benefits: [
        'Máxima bonificación en Tréboles (25%)',
        'Coche de sustitución garantizado en cualquier percance',
        'Chequeo médico anual preventivo incluido',
        'Atención prioritaria "Sin Esperas" en oficinas y teléfono',
        'Descuento directo del 10% en nuevos ramos contratados'
      ]
    }
  ],

  // Configuración de progreso (Ajustado a un scoring de fidelidad más amplio)
  maxPoints: 3000,
  
  // Lógica de cálculo (Mantenemos la robustez de tu código original)
  getProgressCalculation: (currentPoints, currentTier, nextTier) => {
    if (!nextTier) return 100;
    const pointsDifference = nextTier.threshold - currentTier.threshold;
    const pointsProgress = currentPoints - currentTier.threshold;
    // Evitamos valores negativos si el usuario está justo en el umbral
    const percentage = (pointsProgress / pointsDifference) * 100;
    return Math.min(Math.max(Math.round(percentage), 0), 100);
  },

  // Función para obtener tier actual basado en Tréboles/Puntos
  getTierByPoints: function(points) {
    // Clonamos y revertimos para encontrar el nivel más alto alcanzado
    return [...this.tiers].reverse().find(tier => points >= tier.threshold) || this.tiers[0];
  },

  // Función para obtener el siguiente nivel
  getNextTier: function(currentTierName) {
    const currentIndex = this.tiers.findIndex(tier => tier.name === currentTierName);
    return (currentIndex !== -1 && currentIndex < this.tiers.length - 1) 
      ? this.tiers[currentIndex + 1] 
      : null;
  },

  // Identificador de beneficios por nombre
  getTierByName: function(tierName) {
    return this.tiers.find(tier => tier.name === tierName);
  }
};