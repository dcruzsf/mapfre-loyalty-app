module.exports = {
  // Productos Mapfre para acumulación de Tréboles
  products: [
    {
      id: 1,
      name: 'Seguro de Automóvil Pago como Conduzco',
      price: 0,
      points: 800,
      pointsDisplay: '800 Puntos de Nivel + 50 Tréboles',
      qualifyingPoints: 800,
      nonQualifyingPoints: 50,
      image: 'car-insurance.png',
      description: 'Seguro inteligente que premia tu buena conducción con Tréboles directos.',
      category: 'insurance',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Sign an Insurance'
    },
    {
      id: 2,
      name: 'Seguro de Hogar Digital',
      price: 0,
      points: 500,
      pointsDisplay: '500 Puntos de Nivel',
      qualifyingPoints: 500,
      nonQualifyingPoints: 0,
      image: 'home-insurance.png',
      description: 'Protección completa para tu hogar con gestión de siniestros desde la App.',
      category: 'insurance',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Sign an Insurance'
    },
    {
      id: 3,
      name: 'Revisión Oficial Pre-ITV',
      price: 0,
      points: 100,
      pointsDisplay: '100 Puntos + Revisión Gratuita',
      qualifyingPoints: 100,
      nonQualifyingPoints: 0,
      image: 'itv-service.png',
      description: 'Prepara tu coche para la ITV en nuestra red de talleres distinguidos.',
      category: 'insurance_partner',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Purchase'
    }
  ],

  // Actividades para ganar Tréboles extra (Prevención y Salud)
  activities: [
    {
      id: 1,
      name: 'Descarga App Mapfre',
      points: 100,
      image: 'app-download.png',
      category: 'app',
      description: 'Gestiona tus pólizas, partes y asistencia en carretera desde tu móvil.'
    },
    {
      id: 2,
      name: 'Video-Consulta Médica',
      points: 150,
      image: 'telemedicine.png',
      category: 'health',
      description: 'Usa el servicio de telemedicina por primera vez y gana Tréboles.'
    },
    {
      id: 3,
      name: 'Curso de Conducción Segura',
      points: 300,
      image: 'driving-course.png',
      category: 'safety',
      description: 'Mejora tu seguridad al volante y reduce tu prima anual.'
    }
  ],

  // Recompensas del Programa "Te Cuidamos"
  rewards: [
    {
      id: 1,
      name: 'Descuento en Renovación de Póliza',
      points: 1, // 1 Trébol = 1€
      type: 'cashback',
      image: 'discount-policy.png',
      codePrefix: 'RENEW',
      description: 'Usa tus Tréboles para pagar menos en tu próximo recibo de seguro.'
    },
    {
      id: 2,
      name: 'Cheque Carburante 20€',
      points: 20,
      type: 'experience',
      image: 'fuel-card.png',
      codePrefix: 'FUEL20',
      description: 'Canjea tus tréboles por combustible en gasolineras asociadas.'
    },
    {
      id: 3,
      name: 'Servicio de Bricolaje en el Hogar',
      points: 0,
      type: 'service',
      image: 'handyman.png',
      codePrefix: 'BRICO',
      description: 'Gratis por ser nivel Oro o superior. Un profesional en tu casa.',
      isSpecial: true
    },
    {
      id: 4,
      name: 'Amazon Gift Card (Cuidamos tu ocio)',
      points: 50,
      type: 'service',
      image: 'amazon-card.png',
      codePrefix: 'AMZMAPFRE',
      description: 'Tarjeta regalo de 50€ canjeando tus Tréboles acumulados.'
    }
  ],

  // Retos de Fidelidad
  challenges: [
    {
      id: 'safe_driver',
      name: 'Conductor Ejemplar',
      description: 'Mantén tu historial sin partes de accidente durante 12 meses',
      reward: 500,
      goal: 1,
      type: 'insurance'
    },
    {
      id: 'multi_policy',
      name: 'Protección Total',
      description: 'Protege tu Coche, Hogar y Salud con Mapfre',
      reward: 1000,
      goal: 3,
      type: 'insurance'
    }
  ],

  // Logros (Achievements) Mapfre
  achievements: [
    {
      id: 'welcome',
      name: 'Bienvenido a Te Cuidamos',
      description: 'Tu viaje hacia la tranquilidad total comienza aquí.',
      points: 50,
      icon: 'shield-alt',
      category: 'general',
      autoUnlock: true
    },
    {
      id: 'tier_plus',
      name: 'Ascenso a Nivel Oro',
      description: 'Has demostrado ser un cliente comprometido con su seguridad.',
      points: 500,
      icon: 'medal',
      category: 'tier',
      trigger: 'tier_update',
      tierRequired: 'Oro'
    },
    {
      id: 'no_claims',
      name: 'Muro de Contención',
      description: 'Un año completo sin siniestros. ¡Felicidades!',
      points: 200,
      icon: 'user-shield',
      category: 'safety',
      trigger: 'purchase'
    }
  ]
};