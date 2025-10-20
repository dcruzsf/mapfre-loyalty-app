// modules/brandTranslations.js - Traducciones CaixaBank Experience
class BrandTranslations {
  constructor() {
    this.translations = {
      es: {
        messages: {
          welcome: '¡Bienvenido a CaixaBank Experience!',
          welcomeDescription: 'Tu banca 100% digital que premia tu estilo de vida',
          tagline: 'Banca digital que te impulsa',
          joinClub: 'COMENZAR EXPERIENCE',
          benefits: {
            title: 'BENEFICIOS DIGITALES',
            list: [
              'Gana Caixapoints con cada operación digital',
              'Cashback instantáneo en tus compras',
              'Acceso prioritario a nuevas funcionalidades',
              'Experiencias exclusivas personalizadas'
            ]
          },
          features: [
            {
              title: 'Gana Caixapoints',
              description: 'Acumula Caixapoints con cada operación digital: transferencias, pagos móviles, inversiones y más.'
            },
            {
              title: 'Desbloquea logros',
              description: 'Completa retos digitales y alcanza objetivos financieros mientras ganas recompensas.'
            },
            {
              title: 'Evoluciona tu categoría',
              description: 'Desde Basic hasta Elite: más uso digital, mejores beneficios exclusivos.'
            }
          ]
        },
        categories: [
          { id: 'digital_banking', label: 'Banca digital y pagos móviles' },
          { id: 'investments', label: 'Inversiones y ahorro inteligente' },
          { id: 'lifestyle', label: 'Experiencias y lifestyle' }
        ],
        recentTransactions: 'Actividad Reciente',
        points: 'Caixapoints',
        pointsSymbol: '⭐'
      },
      en: {
        messages: {
          welcome: 'Welcome to CaixaBank Experience!',
          welcomeDescription: 'Your 100% digital banking that rewards your lifestyle',
          tagline: 'Digital banking that drives you forward',
          joinClub: 'START EXPERIENCE',
          benefits: {
            title: 'DIGITAL BENEFITS',
            list: [
              'Earn Caixapoints with every digital operation',
              'Instant cashback on your purchases',
              'Priority access to new features',
              'Exclusive personalized experiences'
            ]
          },
          features: [
            {
              title: 'Earn Caixapoints',
              description: 'Accumulate Caixapoints with every digital operation: transfers, mobile payments, investments and more.'
            },
            {
              title: 'Unlock achievements',
              description: 'Complete digital challenges and reach financial goals while earning rewards.'
            },
            {
              title: 'Evolve your tier',
              description: 'From Basic to Elite: more digital usage, better exclusive benefits.'
            }
          ]
        },
        categories: [
          { id: 'digital_banking', label: 'Digital banking and mobile payments' },
          { id: 'investments', label: 'Investments and smart savings' },
          { id: 'lifestyle', label: 'Experiences and lifestyle' }
        ],
        recentTransactions: 'Recent Activity',
        points: 'Caixapoints',
        pointsSymbol: '⭐'
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

    // Añadir traducciones extras
    translatedBrand.recentTransactions = translation.recentTransactions;

    return translatedBrand;
  }
}

module.exports = new BrandTranslations();