class CatalogTranslations {
  constructor() {
    this.translations = {
      es: {
        // Operaciones y Seguros (Productos)
        products: {
          1: {
            name: 'Seguro de Automóvil Pago como Conduzco',
            description: 'Seguro inteligente que premia tu buena conducción con Tréboles directos y descuentos.'
          },
          2: {
            name: 'Seguro de Hogar Digital',
            description: 'Protección completa con gestión de siniestros 100% online desde tu App Mapfre.'
          },
          3: {
            name: 'Revisión Oficial Pre-ITV',
            description: 'Pon a punto tu vehículo en nuestra red de talleres distinguidos y gana puntos de nivel.'
          }
        },

        // Actividades de fidelización
        activities: {
          1: { name: 'Descarga App Mapfre', description: 'Tu oficina de seguros siempre contigo.' },
          2: { name: 'Video-Consulta Médica', description: 'Habla con un especialista sin salir de casa.' },
          3: { name: 'Curso de Conducción Segura', description: 'Mejora tu técnica y reduce el riesgo de accidentes.' }
        },

        // Recompensas del Club Te Cuidamos
        rewards: {
          1: { name: 'Descuento en Renovación', description: 'Usa tus Tréboles para reducir el coste de tu próximo recibo.' },
          2: { name: 'Cheque Carburante 20€', description: 'Ahorra en tus desplazamientos con nuestra red de gasolineras.' },
          3: { name: 'Servicio de Bricolaje', description: 'Un profesional te ayuda con las pequeñas reparaciones del hogar.' },
          4: { name: 'Amazon Gift Card', description: 'Canjea tus Tréboles por tarjetas regalo de 50€.' }
        },

        // Logros (Achievements)
        achievements: {
          welcome: {
            name: 'Bienvenido a Te Cuidamos',
            description: 'Has iniciado tu camino hacia una protección total.'
          },
          tier_plus: {
            name: 'Cliente Oro',
            description: 'Has alcanzado el nivel Oro por tu fidelidad.',
            hint: 'Acumula 500 Tréboles'
          },
          tier_premium: {
            name: 'Cliente Platino',
            description: 'Nivel Platino desbloqueado: máxima protección.',
            hint: 'Acumula 1500 Tréboles'
          },
          tier_elite: {
            name: 'Cliente Diamante',
            description: 'Eres uno de nuestros clientes más exclusivos.',
            hint: 'Acumula 3000 Tréboles'
          },
          no_claims: {
            name: 'Conductor Seguro',
            description: 'Un año sin siniestros registrados.',
            hint: 'Mantén tu póliza limpia de partes un año'
          }
        }
      },

      en: {
        products: {
          1: {
            name: 'Pay-How-You-Drive Car Insurance',
            description: 'Smart insurance that rewards safe driving with direct Clovers and discounts.'
          },
          2: {
            name: 'Digital Home Insurance',
            description: 'Full protection with 100% online claims management through your Mapfre App.'
          },
          3: {
            name: 'Pre-ITV Official Inspection',
            description: 'Get your vehicle ready at our premium workshop network and earn tier points.'
          }
        },

        activities: {
          1: { name: 'Download Mapfre App', description: 'Your insurance office always with you.' },
          2: { name: 'Medical Video-Consultation', description: 'Speak with a specialist without leaving home.' },
          3: { name: 'Safe Driving Course', description: 'Improve your technique and reduce accident risks.' }
        },

        rewards: {
          1: { name: 'Renewal Discount', description: 'Use your Clovers to reduce the cost of your next policy.' },
          2: { name: '€20 Fuel Voucher', description: 'Save on your travels at our partner gas stations.' },
          3: { name: 'Home DIY Service', description: 'A professional helps you with small repairs at home.' },
          4: { name: 'Amazon Gift Card', description: 'Exchange your Clovers for €50 gift cards.' }
        },

        achievements: {
          welcome: {
            name: 'Welcome to We Care',
            description: 'You have started your journey towards total protection.'
          },
          tier_plus: {
            name: 'Gold Customer',
            description: 'You have reached Gold level due to your loyalty.',
            hint: 'Accumulate 500 Clovers'
          },
          tier_premium: {
            name: 'Platinum Customer',
            description: 'Platinum level unlocked: maximum protection.',
            hint: 'Accumulate 1500 Clovers'
          },
          tier_elite: {
            name: 'Diamond Customer',
            description: 'You are one of our most exclusive customers.',
            hint: 'Accumulate 3000 Clovers'
          },
          no_claims: {
            name: 'Safe Driver',
            description: 'One full year without any claims reported.',
            hint: 'Keep your policy claim-free for a year'
          }
        }
      }
    };
  }

  getTranslatedCatalog(originalCatalog, locale = 'es') {
    if (!this.translations[locale]) {
      locale = 'es';
    }

    const translatedCatalog = JSON.parse(JSON.stringify(originalCatalog));
    const translation = this.translations[locale];

    // Mapeo genérico para todas las colecciones
    const collections = ['products', 'activities', 'rewards', 'achievements'];
    
    collections.forEach(collectionKey => {
      if (translatedCatalog[collectionKey] && translation[collectionKey]) {
        translatedCatalog[collectionKey] = translatedCatalog[collectionKey].map(item => {
          const itemTranslation = translation[collectionKey][item.id || item.key || item.id_name]; 
          // Nota: adaptado para manejar tanto IDs numéricos como claves de texto (como en achievements)
          const key = item.id || item.id_name || item.key;
          const t = translation[collectionKey][key];
          
          return t ? { ...item, ...t } : item;
        });
      }
    });

    return translatedCatalog;
  }
}

module.exports = new CatalogTranslations();