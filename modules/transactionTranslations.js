const i18n = require('./i18n');

class TransactionTranslations {
  constructor() {
    // Description patterns for translation (usando "Caixapoints" en lugar de "Puntos")
    this.descriptionPatterns = {
      es: {
        // Tier updates
        'Actualización a nivel': 'Actualización a nivel',
        // Caixapoints from digital operations/activities
        'Caixapoints por': 'Caixapoints por',
        'Puntos por compra de': 'Caixapoints por',
        'Redención:': 'Canje:',
        'Compra de': 'Operación:',
        'puntos': 'Caixapoints',
        'Puntos': 'Caixapoints'
      },
      en: {
        // Tier updates
        'Actualización a nivel': 'Tier upgrade to level',
        // Caixapoints from digital operations/activities
        'Caixapoints por': 'Caixapoints from',
        'Puntos por compra de': 'Caixapoints from',
        'Redención:': 'Redemption:',
        'Canje:': 'Redemption:',
        'Compra de': 'Operation:',
        'Operación:': 'Operation:',
        'puntos': 'Caixapoints',
        'Puntos': 'Caixapoints',
        'Caixapoints': 'Caixapoints'
      }
    };
  }

  translateTransaction(transaction, locale = 'es') {
    const translatedTransaction = { ...transaction };

    // Translate transaction type
    const typeKey = `transactions.types.${transaction.type}`;
    translatedTransaction.type = i18n.t(typeKey, locale) || transaction.type;

    // Translate description
    translatedTransaction.description = this.translateDescription(transaction.description, locale);

    return translatedTransaction;
  }

  translateDescription(description, locale = 'es') {
    if (!description) return description;

    // If already in the target locale, return as is
    if (locale === 'es') {
      return description;
    }

    // Apply translation patterns for English
    let translatedDescription = description;

    for (const [spanishPattern, englishPattern] of Object.entries(this.descriptionPatterns.en)) {
      if (translatedDescription.includes(spanishPattern)) {
        translatedDescription = translatedDescription.replace(spanishPattern, englishPattern);
      }
    }

    // Handle tier updates with dynamic tier names
    if (translatedDescription.includes('Actualización a nivel')) {
      const tierMatch = translatedDescription.match(/Actualización a nivel (\w+)/);
      if (tierMatch) {
        const tierName = tierMatch[1];
        const translatedTierName = i18n.t(`tiers.${tierName.toLowerCase()}`, locale) || tierName;
        translatedDescription = `Tier upgrade to ${translatedTierName}`;
      }
    }

    return translatedDescription;
  }
}

// Export singleton instance
module.exports = new TransactionTranslations();