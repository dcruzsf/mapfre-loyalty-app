const i18n = require('./i18n');

class TransactionTranslations {
  constructor() {
    // Patrones de descripción para traducción (Mapfre: Tréboles y Protección)
    this.descriptionPatterns = {
      es: {
        // Actualizaciones de nivel
        'Actualización a nivel': 'Subida de categoría a',
        // Tréboles por operaciones y servicios
        'Caixapoints por': 'Tréboles por',
        'Puntos por compra de': 'Tréboles por contratación de',
        'Redención:': 'Uso de Tréboles:',
        'Canje:': 'Uso de Tréboles:',
        'Compra de': 'Seguro:',
        'puntos': 'tréboles',
        'Puntos': 'Tréboles'
      },
      en: {
        // Tier updates
        'Actualización a nivel': 'Tier upgrade to',
        // Tréboles/Clovers translation
        'Caixapoints por': 'Tréboles from',
        'Puntos por compra de': 'Tréboles from',
        'Redención:': 'Redemption:',
        'Canje:': 'Redemption:',
        'Compra de': 'Insurance:',
        'Operación:': 'Service:',
        'puntos': 'tréboles',
        'Puntos': 'Tréboles',
        'Tréboles': 'Tréboles'
      }
    };
  }

  translateTransaction(transaction, locale = 'es') {
    const translatedTransaction = { ...transaction };

    // Traducir el tipo de transacción (ej: Accrual -> Acumulación)
    const typeKey = `transactions.types.${transaction.type}`;
    translatedTransaction.type = i18n.t(typeKey, locale) || transaction.type;

    // Traducir la descripción (donde suelen aparecer los nombres de producto)
    translatedTransaction.description = this.translateDescription(transaction.description, locale);

    return translatedTransaction;
  }

  translateDescription(description, locale = 'es') {
    if (!description) return description;

    let translatedDescription = description;

    // Aplicar patrones según el idioma
    const patterns = this.descriptionPatterns[locale] || this.descriptionPatterns.es;

    for (const [key, value] of Object.entries(patterns)) {
      // Reemplazo global para asegurar que "puntos" o "Caixapoints" desaparezcan
      const regex = new RegExp(key, 'gi');
      translatedDescription = translatedDescription.replace(regex, value);
    }

    // Manejo específico para subidas de nivel (Plata, Oro, Platino, Diamante)
    if (translatedDescription.includes('nivel')) {
      const tierMatch = translatedDescription.match(/(nivel|category)\s+(\w+)/i);
      if (tierMatch) {
        const tierName = tierMatch[2];
        // Buscamos la traducción del nivel en nuestro i18n
        const translatedTierName = i18n.t(`tiers.${tierName.toLowerCase()}`, locale) || tierName;
        
        if (locale === 'es') {
          translatedDescription = `Subida de categoría a nivel ${translatedTierName}`;
        } else {
          translatedDescription = `Tier upgrade to ${translatedTierName} level`;
        }
      }
    }

    return translatedDescription;
  }
}

// Exportar instancia única
module.exports = new TransactionTranslations();