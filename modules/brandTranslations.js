class BrandTranslations {
  constructor() {
    this.translations = {
      es: {
        messages: {
          welcome: '¡Bienvenido a Mapfre Te Cuidamos!',
          welcomeDescription: 'El programa que protege tu futuro y premia tu fidelidad.',
          tagline: 'Tu confianza siempre tiene recompensa',
          joinClub: 'ACCEDER A MI ÁREA',
          benefits: {
            title: 'VENTAJAS POR SER CLIENTE',
            list: [
              'Acumula Tréboles al renovar tus seguros',
              'Ahorro directo en tus próximos recibos',
              'Asistencia VIP en carretera y hogar',
              'Descuentos en más de 200 marcas asociadas'
            ]
          },
          features: [
            {
              title: 'Suma Tréboles',
              description: 'Acumula Tréboles con la contratación de pólizas y canjéalos por descuentos en tus renovaciones.'
            },
            {
              title: 'Hitos de Fidelidad',
              description: 'Premiamos tu buena conducción y tu compromiso con la prevención de riesgos.'
            },
            {
              title: 'Sube de Nivel',
              description: 'De Plata a Diamante: cuanta más protección elijas, más privilegios exclusivos desbloqueas.'
            }
          ]
        },
        categories: [
          { id: 'insurance', label: 'Protección y Seguros' },
          { id: 'health', label: 'Salud y Bienestar' },
          { id: 'lifestyle', label: 'Ocio y Ventajas Te Cuidamos' }
        ],
        recentTransactions: 'Últimos Movimientos',
        points: 'Tréboles',
        pointsSymbol: '🍀'
      },
      en: {
        messages: {
          welcome: 'Welcome to Mapfre We Care!',
          welcomeDescription: 'The program that protects your future and rewards your loyalty.',
          tagline: 'Your trust always has its reward',
          joinClub: 'ACCESS MY AREA',
          benefits: {
            title: 'CUSTOMER BENEFITS',
            list: [
              'Earn Tréboles (Clovers) by renewing your policies',
              'Direct savings on your insurance premiums',
              'VIP roadside and home assistance',
              'Discounts across more than 200 partner brands'
            ]
          },
          features: [
            {
              title: 'Earn Tréboles',
              description: 'Accumulate Tréboles with every policy and redeem them for discounts on renewals.'
            },
            {
              title: 'Loyalty Milestones',
              description: 'We reward safe driving and your commitment to risk prevention.'
            },
            {
              title: 'Upgrade your Tier',
              description: 'From Silver to Diamond: the more protection you choose, the more exclusive privileges you unlock.'
            }
          ]
        },
        categories: [
          { id: 'insurance', label: 'Protection & Insurance' },
          { id: 'health', label: 'Health & Wellness' },
          { id: 'lifestyle', label: 'Leisure & Te Cuidamos Benefits' }
        ],
        recentTransactions: 'Recent Activity',
        points: 'Tréboles',
        pointsSymbol: '🍀'
      }
    };
  }

  getTranslatedBrand(originalBrand, locale = 'es') {
    if (!this.translations[locale]) {
      locale = 'es'; // fallback
    }

    const translatedBrand = JSON.parse(JSON.stringify(originalBrand));
    const translation = this.translations[locale];

    // Traducir mensajes
    translatedBrand.messages = translation.messages;

    // Traducir categorías
    translatedBrand.categories = translation.categories;

    // Actualizar símbolos y nombres de moneda
    translatedBrand.pointsName = translation.points;
    translatedBrand.pointsSymbol = translation.pointsSymbol;

    // Añadir traducciones extras
    translatedBrand.recentTransactions = translation.recentTransactions;

    return translatedBrand;
  }
}

module.exports = new BrandTranslations();