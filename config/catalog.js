// config/catalog.js - Configuración de operaciones digitales y recompensas CaixaBank Experience
module.exports = {
  // Operaciones digitales para acumulación de puntos (enfoque 100% digital)
  products: [
    {
      id: 1,
      name: 'Transferencia Inmediata Bizum',
      price: 10,
      points: 15,
      image: 'compra1.png',
      description: 'Envía dinero al instante con Bizum. Sin comisiones, 100% digital. Gana puntos por cada transacción.',
      category: 'digital_banking',
      isPremium: false,
      digitalOnly: true
    },
    {
      id: 2,
      name: 'Pago Contactless o Apple/Google Pay',
      price: 25,
      points: 20,
      image: 'compra2.png',
      description: 'Paga con tu móvil o tarjeta contactless. Rápido, seguro y sin contacto. Acumula puntos automáticamente.',
      category: 'digital_banking',
      isPremium: false,
      digitalOnly: true
    },
    {
      id: 3,
      name: 'Inversión Automática en Fondos',
      price: 100,
      points: 250,
      image: 'compra3.png',
      description: 'Activa inversiones automáticas desde la app. Haz crecer tu dinero mientras duermes. Gran bonificación en puntos.',
      category: 'investments',
      isPremium: true,
      premiumTrigger: 'Inversión Automática en Fondos',
      digitalOnly: true
    },
    {
      id: 4,
      name: 'Pago de Recibos desde la App',
      price: 50,
      points: 30,
      image: 'compra4.png',
      description: 'Gestiona todos tus recibos desde la app móvil. Paga luz, agua, internet y gana puntos por cada uno.',
      category: 'digital_banking',
      isPremium: false,
      digitalOnly: true
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
      digitalOnly: true
    }
  ],

  // Actividades digitales para ganar puntos extra
  activities: [
    {
      id: 1,
      name: 'Activar CaixaBankNow en tu móvil',
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
      name: 'Vincular Apple/Google Wallet',
      points: 90,
      image: 'actividad1.png',
      category: 'digital_wallet',
      description: 'Añade tu tarjeta al móvil y paga sin sacarla del bolsillo.'
    },
    {
      id: 6,
      name: 'Domiciliación de Nómina Digital',
      points: 500,
      image: 'actividad3.png',
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
      name: 'Mes Premium GRATIS',
      points: 500,
      type: 'subscription',
      image: 'experiencia1.png',
      codePrefix: 'PREMIUM30',
      description: 'Un mes de beneficios Elite: sin comisiones, cashback máximo y gestor personal.'
    },
    {
      id: 4,
      name: 'Inversión Asistida por IA',
      points: 800,
      type: 'service',
      image: 'experiencia2.png',
      codePrefix: 'AIINVEST',
      description: 'Sesión de inversión personalizada con nuestro asistente de IA financiera.'
    },
    {
      id: 5,
      name: 'Upgrade de Tarjeta a Premium',
      points: 1000,
      type: 'product',
      image: 'experiencia1.png',
      codePrefix: 'CARDPREM',
      description: 'Mejora tu tarjeta a Premium con límites superiores y sin cuotas durante 1 año.'
    },
    {
      id: 6,
      name: 'Acceso VIP a Eventos Exclusivos',
      points: 1200,
      type: 'experience',
      image: 'experiencia2.png',
      codePrefix: 'VIPEXP',
      description: 'Entradas para eventos seleccionados: tecnología, finanzas, networking de élite.'
    }
  ],

  // Retos digitales (gamificación estilo Revolut)
  challenges: [
    {
      id: 'digital_warrior',
      name: 'Guerrero Digital',
      description: 'Realiza 5 operaciones completamente digitales (Bizum, pagos móviles, etc.)',
      reward: 100,
      goal: 5,
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
      description: 'Completaste el reto de 5 operaciones digitales',
      points: 80,
      icon: 'bolt',
      category: 'challenge',
      hideWhenLocked: false,
      hint: 'Realiza 5 operaciones digitales',
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
      hint: 'Alcanza 500 Caixapoints Status',
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
      hint: 'Alcanza 1000 Caixapoints Status',
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
      hint: 'Alcanza 2000 Caixapoints Status',
      trigger: 'tier_update',
      tierRequired: 'Platinum'
    }
  ]
};