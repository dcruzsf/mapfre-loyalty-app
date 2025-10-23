// modules/catalogTranslations.js - Traducciones del catálogo de productos, actividades, recompensas y logros
class CatalogTranslations {
  constructor() {
    this.translations = {
      es: {
        // Operaciones digitales (productos)
        products: {
          1: {
            name: 'Transferencia Inmediata Bizum',
            description: 'Envía dinero al instante con Bizum. Sin comisiones, 100% digital. Gana Caixapoints por cada transacción.'
          },
          2: {
            name: 'Pago Contactless o Apple/Google Pay',
            description: 'Paga con tu móvil o tarjeta contactless. Rápido, seguro y sin contacto. Acumula Caixapoints automáticamente.'
          },
          3: {
            name: 'Inversión Automática en Fondos',
            description: 'Activa inversiones automáticas desde la app. Haz crecer tu dinero mientras duermes. Gran bonificación en Caixapoints.'
          },
          4: {
            name: 'Pago de Recibos desde la App',
            description: 'Gestiona todos tus recibos desde la app móvil. Paga luz, agua, internet y gana Caixapoints por cada uno.'
          },
          5: {
            name: 'Compra Online con Tarjeta Virtual',
            description: 'Crea tarjetas virtuales temporales para compras online ultra seguras. Máxima protección + Caixapoints.'
          },
          6: {
            name: 'Contratar Seguro de Vida SegurCaixa',
            description: 'Protege a los tuyos con un seguro de vida 100% digital. Contratación online en minutos + gran bonificación en Caixapoints.'
          }
        },

        // Actividades digitales
        activities: {
          1: {
            name: 'Descarga App CaixaBankNow',
            description: 'Descarga la app y activa tu banca móvil. Tu banco en el bolsillo.'
          },
          2: {
            name: 'Completar perfil financiero',
            description: 'Completa tu información financiera y preferencias de inversión.'
          },
          3: {
            name: 'Invitar amigos a CaixaBank Experience',
            description: 'Comparte tu código. Tú ganas, tu amigo gana.'
          },
          4: {
            name: 'Activar Face ID / Huella Digital',
            description: 'Máxima seguridad biométrica para tu app.'
          },
          5: {
            name: 'Desafío Quiz Financiero',
            description: 'Demuestra tus conocimientos financieros y gana Caixapoints. Pon a prueba tu cultura financiera.'
          },
          6: {
            name: 'Domiciliación de Nómina Digital',
            description: 'Domicilia tu nómina 100% online y recibe una mega bonificación de Caixapoints. Tu sueldo, más rentable.'
          }
        },

        // Recompensas digitales
        rewards: {
          1: {
            name: 'Cashback Instantáneo 10€',
            description: 'Dinero directo a tu cuenta. Sin esperas, sin complicaciones.'
          },
          2: {
            name: 'Cashback Instantáneo 25€',
            description: 'Recompensa inmediata en tu saldo disponible.'
          },
          3: {
            name: 'Avios Iberia',
            description: 'Canjea tus Caixapoints por Avios de Iberia y vuela más cerca de tu próximo destino.'
          },
          4: {
            name: 'Acceso Sala VIP Aeropuerto',
            description: 'Disfruta de acceso exclusivo a salas VIP en aeropuertos. Confort y tranquilidad antes de tu vuelo.'
          },
          5: {
            name: 'Donación Fundación "la Caixa"',
            description: 'Convierte tus Caixapoints en una donación de 30€ a la Fundación "la Caixa" para proyectos sociales.'
          },
          6: {
            name: 'Gift Card Amazon',
            description: 'Gift card de Amazon para que compres lo que quieras. Canjea tus puntos por productos y tecnología.'
          },
          7: {
            name: 'Asesoría Personalizada en Finanzas',
            description: 'Sesión personalizada con un asesor financiero experto. Planifica tu futuro con ayuda profesional.'
          },
          8: {
            name: 'Curso Regulación en Trading',
            description: 'Curso completo sobre trading y regulación financiera. Aprende a invertir de forma inteligente y segura.'
          },
          9: {
            name: 'Tarjeta de Crédito Sin Comisiones',
            description: 'Tarjeta de crédito premium sin comisiones durante 1 año. Límite ampliado y beneficios exclusivos.'
          }
        },

        // Logros
        achievements: {
          welcome: {
            name: 'Bienvenida',
            description: 'Te has unido al programa de lealtad'
          },
          first_purchase: {
            name: 'Primera Compra',
            description: 'Has realizado tu primera compra',
            hint: 'Realiza tu primera compra en la tienda'
          },
          premium_purchase: {
            name: 'Compra Premium',
            description: 'Has comprado la Vintage Tan Rider Jacket',
            hint: 'Compra la Vintage Tan Rider Jacket'
          },
          first_redemption: {
            name: 'Primer Canje',
            description: 'Has canjeado tus puntos por primera vez',
            hint: 'Canjea tus puntos por una recompensa'
          },
          challenge_accessories_lover: {
            name: 'Amor por los accesorios',
            description: 'Completaste el reto de comprar accesorios',
            hint: 'Compra los dos accesorios disponibles (gorro y calcetines)'
          },
          challenge_profile_complete: {
            name: 'Experto en finanzas',
            description: 'Completaste el reto de perfil (4 veces)',
            hint: 'Completa toda la información de tu perfil 4 veces'
          },
          challenge_social_share: {
            name: 'Social ambassador',
            description: 'Completaste el reto de compartir en redes',
            hint: 'Comparte 3 productos en redes sociales'
          },
          tier_plus: {
            name: 'Nivel Plus',
            description: 'Has alcanzado el nivel Plus',
            hint: 'Alcanza 500 Caixapoints'
          },
          tier_premium: {
            name: 'Nivel Premium',
            description: 'Has alcanzado el nivel Premium',
            hint: 'Alcanza 1000 Caixapoints'
          },
          tier_elite: {
            name: 'Nivel Elite',
            description: 'Has alcanzado el nivel Elite',
            hint: 'Alcanza 2000 Caixapoints'
          }
        }
      },

      en: {
        // Digital operations (products)
        products: {
          1: {
            name: 'Instant Bizum Transfer',
            description: 'Send money instantly with Bizum. No fees, 100% digital. Earn Caixapoints with every transaction.'
          },
          2: {
            name: 'Contactless or Apple/Google Pay',
            description: 'Pay with your phone or contactless card. Fast, secure and contactless. Accumulate Caixapoints automatically.'
          },
          3: {
            name: 'Automatic Fund Investment',
            description: 'Activate automatic investments from the app. Grow your money while you sleep. Great Caixapoints bonus.'
          },
          4: {
            name: 'Bill Payment from App',
            description: 'Manage all your bills from the mobile app. Pay electricity, water, internet and earn Caixapoints for each one.'
          },
          5: {
            name: 'Online Purchase with Virtual Card',
            description: 'Create temporary virtual cards for ultra-secure online shopping. Maximum protection + Caixapoints.'
          },
          6: {
            name: 'Contract Life Insurance SegurCaixa',
            description: 'Protect your loved ones with 100% digital life insurance. Online contracting in minutes + great Caixapoints bonus.'
          }
        },

        // Digital activities
        activities: {
          1: {
            name: 'Download CaixaBankNow App',
            description: 'Download the app and activate your mobile banking. Your bank in your pocket.'
          },
          2: {
            name: 'Complete financial profile',
            description: 'Complete your financial information and investment preferences.'
          },
          3: {
            name: 'Invite friends to CaixaBank Experience',
            description: 'Share your code. You earn, your friend earns.'
          },
          4: {
            name: 'Activate Face ID / Fingerprint',
            description: 'Maximum biometric security for your app.'
          },
          5: {
            name: 'Financial Quiz Challenge',
            description: 'Demonstrate your financial knowledge and earn Caixapoints. Test your financial literacy.'
          },
          6: {
            name: 'Digital Payroll Direct Deposit',
            description: 'Set up your payroll 100% online and receive a mega Caixapoints bonus. Your salary, more profitable.'
          }
        },

        // Digital rewards
        rewards: {
          1: {
            name: 'Instant Cashback €10',
            description: 'Money direct to your account. No waiting, no complications.'
          },
          2: {
            name: 'Instant Cashback €25',
            description: 'Immediate reward in your available balance.'
          },
          3: {
            name: 'Iberia Avios',
            description: 'Exchange your Caixapoints for Iberia Avios and fly closer to your next destination.'
          },
          4: {
            name: 'Airport VIP Lounge Access',
            description: 'Enjoy exclusive access to VIP lounges at airports. Comfort and tranquility before your flight.'
          },
          5: {
            name: 'Donation to "la Caixa" Foundation',
            description: 'Convert your Caixapoints into a €30 donation to the "la Caixa" Foundation for social projects.'
          },
          6: {
            name: 'Amazon Gift Card',
            description: 'Amazon gift card to buy whatever you want. Exchange your points for products and technology.'
          },
          7: {
            name: 'Personalized Financial Advice',
            description: 'Personalized session with an expert financial advisor. Plan your future with professional help.'
          },
          8: {
            name: 'Trading Regulation Course',
            description: 'Complete course on trading and financial regulation. Learn to invest intelligently and safely.'
          },
          9: {
            name: 'Credit Card Without Fees',
            description: 'Premium credit card with no fees for 1 year. Extended limit and exclusive benefits.'
          }
        },

        // Logros
        achievements: {
          welcome: {
            name: 'Welcome',
            description: 'You have joined the loyalty program'
          },
          first_purchase: {
            name: 'First Purchase',
            description: 'You have made your first purchase',
            hint: 'Make your first purchase in the store'
          },
          premium_purchase: {
            name: 'Premium Purchase',
            description: 'You have purchased the Vintage Tan Rider Jacket',
            hint: 'Buy the Vintage Tan Rider Jacket'
          },
          first_redemption: {
            name: 'First Redemption',
            description: 'You have redeemed your points for the first time',
            hint: 'Redeem your points for a reward'
          },
          challenge_accessories_lover: {
            name: 'Accessories Lover',
            description: 'You completed the accessory shopping challenge',
            hint: 'Buy both available accessories (hat and socks)'
          },
          challenge_profile_complete: {
            name: 'Finance Expert',
            description: 'You completed the profile challenge (4 times)',
            hint: 'Complete all your profile information 4 times'
          },
          challenge_social_share: {
            name: 'Social Ambassador',
            description: 'You completed the social sharing challenge',
            hint: 'Share 3 products on social media'
          },
          tier_plus: {
            name: 'Plus Level',
            description: 'You have reached Plus level',
            hint: 'Reach 500 Caixapoints'
          },
          tier_premium: {
            name: 'Premium Level',
            description: 'You have reached Premium level',
            hint: 'Reach 1000 Caixapoints'
          },
          tier_elite: {
            name: 'Elite Level',
            description: 'You have reached Elite level',
            hint: 'Reach 2000 Caixapoints'
          }
        }
      }
    };
  }

  getTranslatedCatalog(originalCatalog, locale = 'es') {
    if (!this.translations[locale]) {
      locale = 'es'; // fallback
    }

    const translatedCatalog = JSON.parse(JSON.stringify(originalCatalog));
    const translation = this.translations[locale];

    // Traducir productos
    if (translatedCatalog.products && translation.products) {
      translatedCatalog.products = translatedCatalog.products.map(product => ({
        ...product,
        name: translation.products[product.id]?.name || product.name,
        description: translation.products[product.id]?.description || product.description
      }));
    }

    // Traducir actividades
    if (translatedCatalog.activities && translation.activities) {
      translatedCatalog.activities = translatedCatalog.activities.map(activity => ({
        ...activity,
        name: translation.activities[activity.id]?.name || activity.name
      }));
    }

    // Traducir recompensas
    if (translatedCatalog.rewards && translation.rewards) {
      translatedCatalog.rewards = translatedCatalog.rewards.map(reward => ({
        ...reward,
        name: translation.rewards[reward.id]?.name || reward.name
      }));
    }

    // Traducir logros
    if (translatedCatalog.achievements && translation.achievements) {
      translatedCatalog.achievements = translatedCatalog.achievements.map(achievement => ({
        ...achievement,
        name: translation.achievements[achievement.id]?.name || achievement.name,
        description: translation.achievements[achievement.id]?.description || achievement.description,
        hint: translation.achievements[achievement.id]?.hint || achievement.hint
      }));
    }

    return translatedCatalog;
  }
}

module.exports = new CatalogTranslations();