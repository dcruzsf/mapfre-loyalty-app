// config/catalog.js - Configuración de operaciones digitales y recompensas CaixaBank Experience
module.exports = {
  // Operaciones digitales para acumulación de puntos (enfoque 100% digital)
  products: [
    {
      id: 2,
      name: 'Contratación de Tarjeta',
      price: 25,
      points: 20,
      image: 'https://www.caixabank.com/docs/comunicacion/73169.jpg',
      description: 'Contrata tu tarjeta de crédito 100% online. Rápido, seguro y sin papeleos. Acumula puntos automáticamente.',
      category: 'digital_banking',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Sign Credit Card'
    },
    {
      id: 1,
      name: 'Pago con Tarjeta en Comercio',
      price: 10,
      points: 15,
      image: 'compra1.png',
      description: 'Paga con tu tarjeta CaixaBank en cualquier comercio físico. Acumula puntos con cada compra.',
      category: 'digital_banking',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Card Payment'
    },
    {
      id: 3,
      name: 'Redención de puntos en Facilitea',
      price: 100,
      points: 250,
      image: 'https://peoplexhub.talentclue.com/system/files/facilitea_aaff_logotipo_rgb_verdinegro_1731402704.png',
      description: 'Canjea tus puntos por productos y servicios en Facilitea. Haz tu vida más fácil mientras usas tus puntos.',
      category: 'redemption',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Redemption',
      journalSubType: 'Purchase'
    },
    {
      id: 4,
      name: 'Donación a Fundación Caixa',
      price: 50,
      points: 30,
      image: 'compra4.png',
      description: 'Convierte tu operación en una donación solidaria a la Fundación "la Caixa". Haz el bien mientras acumulas puntos.',
      category: 'donation',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Redemption',
      journalSubType: 'Donation'
    },
    {
      id: 5,
      name: 'Compra Online con Tarjeta Virtual',
      price: 75,
      points: 40,
      image: 'compra5.png',
      description: 'Crea tarjetas virtuales temporales para compras online ultra seguras. Máxima protección + Caixapoints.',
      category: 'digital_banking',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Online purchase'
    },
    {
      id: 6,
      name: 'Contratar Seguro de Vida SegurCaixa',
      price: 150,
      points: 300,
      image: 'compra6.png',
      description: 'Protege a los tuyos con un seguro de vida 100% digital. Contratación online en minutos + gran bonificación en Caixapoints.',
      category: 'insurance',
      isPremium: false,
      digitalOnly: true,
      journalType: 'Accrual',
      journalSubType: 'Life Insurance'
    }
  ],

  // Actividades digitales para ganar puntos extra
  activities: [
    {
      id: 1,
      name: 'Descarga App CaixaBankNow',
      points: 150,
      image: 'actividad1.png',
      category: 'app',
      description: 'Descarga la app y activa tu banca móvil. Tu banco en el bolsillo.'
    },
    {
      id: 2,
      name: 'Completar perfil financiero',
      points: 80,
      image: 'actividad2.png',
      category: 'profile',
      challengeTrigger: 'profile_complete',
      description: 'Completa tu información financiera y preferencias de inversión.'
    },
    {
      id: 3,
      name: 'Invitar amigos a CaixaBank Experience',
      points: 100,
      image: 'actividad3.png',
      category: 'referral',
      description: 'Comparte tu código. Tú ganas, tu amigo gana.'
    },
    {
      id: 4,
      name: 'Activar Face ID / Huella Digital',
      points: 75,
      image: 'actividad4.png',
      category: 'security',
      challengeTrigger: 'social_share',
      description: 'Máxima seguridad biométrica para tu app.'
    },
    {
      id: 5,
      name: 'Desafío Quiz Financiero',
      points: 90,
      image: 'actividad5.png',
      category: 'quiz',
      description: 'Demuestra tus conocimientos financieros y gana Caixapoints. Pon a prueba tu cultura financiera.'
    },
    {
      id: 6,
      name: 'Domiciliación de Nómina Digital',
      points: 500,
      image: 'actividad6.png',
      category: 'payroll',
      description: 'Domicilia tu nómina 100% online y recibe una mega bonificación de Caixapoints. Tu sueldo, más rentable.'
    }
  ],

  // Recompensas digitales y experiencias (estilo Revolut)
  rewards: [
    {
      id: 1,
      name: 'Cashback Instantáneo 10€',
      points: 150,
      type: 'cashback',
      image: 'descuento1.png',
      codePrefix: 'CASH10',
      description: 'Dinero directo a tu cuenta. Sin esperas, sin complicaciones.'
    },
    {
      id: 2,
      name: 'Cashback Instantáneo 25€',
      points: 350,
      type: 'cashback',
      image: 'descuento2.png',
      codePrefix: 'CASH25',
      description: 'Recompensa inmediata en tu saldo disponible.'
    },
    {
      id: 3,
      name: 'Avios Iberia',
      points: 500,
      type: 'experience',
      image: 'experiencia1.png',
      codePrefix: 'AVIOS',
      description: 'Canjea tus Caixapoints por Avios de Iberia y vuela más cerca de tu próximo destino.'
    },
    {
      id: 4,
      name: 'Acceso Sala VIP Aeropuerto',
      points: 800,
      type: 'experience',
      image: 'experiencia2.png',
      codePrefix: 'VIPROOM',
      description: 'Disfruta de acceso exclusivo a salas VIP en aeropuertos. Confort y tranquilidad antes de tu vuelo.'
    },
    {
      id: 5,
      name: 'Donación Fundación "la Caixa"',
      points: 300,
      type: 'service',
      image: 'experiencia3.png',
      codePrefix: 'DONATION',
      description: 'Convierte tus Caixapoints en una donación de 30€ a la Fundación "la Caixa" para proyectos sociales.'
    },
    {
      id: 6,
      name: 'Gift Card Amazon',
      points: 1000,
      type: 'service',
      image: 'experiencia4.png',
      codePrefix: 'AMAZON',
      description: 'Gift card de Amazon para que compres lo que quieras. Canjea tus puntos por productos y tecnología.'
    },
    {
      id: 7,
      name: 'Asesoría Personalizada en Finanzas',
      points: 600,
      type: 'service',
      image: 'experiencia5.png',
      codePrefix: 'FINADVICE',
      description: 'Sesión personalizada con un asesor financiero experto. Planifica tu futuro con ayuda profesional.'
    },
    {
      id: 8,
      name: 'Curso Regulación en Trading',
      points: 900,
      type: 'service',
      image: 'experiencia6.png',
      codePrefix: 'TRADECOURSE',
      description: 'Curso completo sobre trading y regulación financiera. Aprende a invertir de forma inteligente y segura.'
    },
    {
      id: 9,
      name: 'Tarjeta de Crédito Sin Comisiones',
      points: 1200,
      type: 'product',
      image: 'experiencia7.png',
      codePrefix: 'CREDITFREE',
      description: 'Tarjeta de crédito premium sin comisiones durante 1 año. Límite ampliado y beneficios exclusivos.'
    }
  ],

  // Retos digitales (gamificación estilo Revolut)
  challenges: [
    {
      id: 'digital_warrior',
      name: 'Guerrero Digital',
      description: 'Realiza 3 operaciones completamente digitales (Bizum, pagos móviles, etc.)',
      reward: 100,
      goal: 3,
      type: 'digital_banking',
      triggerCategory: 'digital_banking'
    },
    {
      id: 'profile_complete',
      name: 'Perfil 100% Configurado',
      description: 'Completa tu perfil, activa alertas y configura preferencias (4 acciones)',
      reward: 120,
      goal: 4,
      type: 'profile'
    },
    {
      id: 'social_influencer',
      name: 'Influencer Financiero',
      description: 'Invita a 3 amigos a CaixaBank Experience',
      reward: 150,
      goal: 3,
      type: 'referral'
    },
    {
      id: 'investment_starter',
      name: 'Inversor Inteligente',
      description: 'Realiza tu primera inversión desde la app móvil',
      reward: 200,
      goal: 1,
      type: 'investments',
      triggerCategory: 'investments'
    }
  ],

  // Logros digitales (achievements con enfoque moderno)
  achievements: [
    {
      id: 'welcome',
      name: 'Bienvenido a Experience',
      description: 'Te has unido a la revolución digital de CaixaBank',
      points: 50,
      icon: 'rocket',
      category: 'general',
      hideWhenLocked: false,
      autoUnlock: true
    },
    {
      id: 'first_digital_operation',
      name: 'Primera Operación Digital',
      description: 'Has realizado tu primera operación 100% digital',
      points: 75,
      icon: 'mobile-alt',
      category: 'digital',
      hideWhenLocked: false,
      hint: 'Realiza una operación desde la app',
      trigger: 'purchase'
    },
    {
      id: 'premium_investor',
      name: 'Inversor Premium',
      description: 'Has activado inversiones automáticas desde la app',
      points: 200,
      icon: 'chart-line',
      category: 'investment',
      hideWhenLocked: false,
      hint: 'Activa inversiones automáticas',
      trigger: 'premium_purchase'
    },
    {
      id: 'first_redemption',
      name: 'Primera Recompensa',
      description: 'Has canjeado tus Caixapoints por primera vez',
      points: 100,
      icon: 'gift',
      category: 'redemption',
      hideWhenLocked: false,
      hint: 'Canjea tus Caixapoints por una recompensa',
      trigger: 'redemption'
    },
    {
      id: 'challenge_digital_warrior',
      name: 'Guerrero Digital',
      description: 'Completaste el reto de 3 operaciones digitales',
      points: 80,
      icon: 'bolt',
      category: 'challenge',
      hideWhenLocked: false,
      hint: 'Realiza 3 operaciones digitales',
      trigger: 'challenge_complete'
    },
    {
      id: 'challenge_profile_complete',
      name: 'Perfil 100% Configurado',
      description: 'Completaste toda la configuración de tu perfil',
      points: 90,
      icon: 'user-check',
      category: 'challenge',
      hideWhenLocked: false,
      hint: 'Completa todas las configuraciones de perfil',
      trigger: 'challenge_complete'
    },
    {
      id: 'challenge_social_influencer',
      name: 'Influencer Financiero',
      description: 'Invitaste a 3 amigos a CaixaBank Experience',
      points: 100,
      icon: 'users',
      category: 'social',
      hideWhenLocked: false,
      hint: 'Invita a 3 amigos al programa',
      trigger: 'challenge_complete'
    },
    {
      id: 'tier_plus',
      name: 'Nivel Plus Desbloqueado',
      description: 'Has alcanzado el nivel Plus con beneficios mejorados',
      points: 150,
      icon: 'award',
      category: 'tier',
      hideWhenLocked: false,
      hint: 'Alcanza 500 Caixapoints',
      trigger: 'tier_update',
      tierRequired: 'Silver'
    },
    {
      id: 'tier_premium',
      name: 'Nivel Premium Desbloqueado',
      description: 'Has alcanzado el nivel Premium con beneficios superiores',
      points: 250,
      icon: 'crown',
      category: 'tier',
      hideWhenLocked: false,
      hint: 'Alcanza 1000 Caixapoints',
      trigger: 'tier_update',
      tierRequired: 'Gold'
    },
    {
      id: 'tier_elite',
      name: 'Nivel Elite Desbloqueado',
      description: 'Has alcanzado el máximo nivel Elite con beneficios exclusivos',
      points: 400,
      icon: 'gem',
      category: 'tier',
      hideWhenLocked: false,
      hint: 'Alcanza 2000 Caixapoints',
      trigger: 'tier_update',
      tierRequired: 'Platinum'
    }
  ]
};