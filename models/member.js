// Almacenamiento en memoria para la demo
const members = [];
let currentId = 1;

// Importar configuraciones centralizadas
const brandConfig = require('../config/brand');
const catalogConfig = require('../config/catalog');
const tiersConfig = require('../config/tiers');

class Member {
  constructor(name, email, preferences = []) {
    this.id = currentId++;
    this.name = name;
    this.email = email;
    this.preferences = preferences;
    this.balance = 250; // Saldo inicial de 250€
    this.levelPoints = 0; // Puntos de nivel (solo suman)
    this.rewardPoints = 0; // Puntos de rewards (suman y restan)
    this.tier = tiersConfig.tiers[0].name; // Primer tier por defecto
    this.transactions = [];
    this.challenges = []; // Retos activos
    this.achievements = []; // Logros desbloqueados
    this.createdAt = new Date();
    this.salesforceId = null; // ID del miembro en Salesforce
    
    // Atributos para el leaderboard
    this.leaderboardSubmitted = false;
    this.leaderboardScore = null;
    this.leaderboardSubmittedAt = null;
    
    // Contadores dinámicos para retos
    this.counters = {};
    
    // Inicializar retos y logros desde configuración
    this.initializeChallenges();
    this.initializeWelcomeAchievement();
  }

  // Inicializar retos desde configuración
  initializeChallenges() {
    this.challenges = catalogConfig.challenges.map(challenge => ({
      ...challenge,
      progress: 0,
      completed: false
    }));
  }

  // Inicializar logro de bienvenida
  initializeWelcomeAchievement() {
    const welcomeAchievement = catalogConfig.achievements.find(a => a.autoUnlock);
    if (welcomeAchievement) {
      this.unlockAchievement({
        id: welcomeAchievement.id,
        name: welcomeAchievement.name,
        description: brandConfig.messages.welcomeDescription,
        points: welcomeAchievement.points,
        icon: welcomeAchievement.icon
      });
    }
  }

  // Métodos para gestionar puntos
  addPoints(amount, reason, affectsRewards = true) {
    // Siempre añadir a puntos de nivel
    this.levelPoints += amount;
    
    // Si affectsRewards es true, añadir también a puntos de rewards
    if (affectsRewards) {
      this.rewardPoints += amount;
    }
    
    this._addTransaction('Accrual', reason, amount, 0, amount, affectsRewards ? amount : 0);
    this._checkTierUpdate();
    this._checkChallengeProgress(reason);
    
    return {
      levelPoints: this.levelPoints,
      rewardPoints: this.rewardPoints
    };
  }

  usePoints(amount, reason) {
    if (this.rewardPoints < amount) {
      throw new Error('Puntos de rewards insuficientes');
    }
    
    // Solo restar de puntos de rewards
    this.rewardPoints -= amount;
    
    this._addTransaction('Redemption', reason, -amount, 0, 0, -amount);
    
    // Trigger achievement si es la primera redención
    this._triggerAchievement('redemption', reason);
    
    return this.rewardPoints;
  }

  reduceBalance(amount, reason) {
    if (this.balance < amount) {
      throw new Error('Saldo insuficiente');
    }
    this.balance -= amount;
    this._addTransaction('Purchase', reason, 0, -amount, 0, 0);
    
    // Trigger achievements de compra
    this._triggerAchievement('purchase', reason);
    
    // Verificar si es una compra premium
    const isPremiumPurchase = catalogConfig.products.some(p => {
      if (p.isPremium) {
        // Si tiene premiumTrigger específico, usarlo
        if (p.premiumTrigger) {
          return reason.includes(p.premiumTrigger);
        }
        // Si no, usar el nombre del producto
        return reason.includes(p.name);
      }
      return false;
    });
    
    if (isPremiumPurchase) {
      this._triggerAchievement('premium_purchase', reason);
    }
    
    return this.balance;
  }

  // Método unificado para triggear achievements
  _triggerAchievement(triggerType, reason) {
    const achievements = catalogConfig.achievements.filter(a => a.trigger === triggerType);
    
    achievements.forEach(achievement => {
      if (this.hasAchievement(achievement.id)) return;
      
      let shouldUnlock = false;
      
      switch (triggerType) {
        case 'purchase':
          shouldUnlock = true;
          break;
        case 'premium_purchase':
          // Buscar si algún producto premium fue comprado usando name o premiumTrigger
          const premiumProduct = catalogConfig.products.find(p => {
            if (p.isPremium) {
              // Si tiene premiumTrigger específico, usarlo
              if (p.premiumTrigger) {
                return reason.includes(p.premiumTrigger);
              }
              // Si no, usar el nombre del producto
              return reason.includes(p.name);
            }
            return false;
          });
          shouldUnlock = !!premiumProduct;
          break;
        case 'redemption':
          shouldUnlock = reason.includes('Redención');
          break;
        case 'tier_update':
          shouldUnlock = this.tier === achievement.tierRequired;
          break;
      }
      
      if (shouldUnlock) {
        this.unlockAchievement({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          points: achievement.points,
          icon: achievement.icon
        });
      }
    });
  }
  
  // Actualizar progreso de un reto
  updateChallengeProgress(challengeId, increment = 1) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    
    if (challenge && !challenge.completed) {
      challenge.progress += increment;
      
      // Si se completa el reto
      if (challenge.progress >= challenge.goal) {
        challenge.completed = true;
        this.addPoints(challenge.reward, `Reto completado: ${challenge.name}`);
        
        // Desbloquear logro relacionado si existe
        const relatedAchievement = catalogConfig.achievements.find(a => 
          a.trigger === 'challenge_complete' && a.id === `challenge_${challengeId}`
        );
        
        if (relatedAchievement) {
          this.unlockAchievement({
            id: relatedAchievement.id,
            name: relatedAchievement.name,
            description: relatedAchievement.description,
            points: 0, // Ya se dieron puntos por el reto
            icon: relatedAchievement.icon
          });
        }
      }
    }
  }
  
  // Desbloquear un logro
  unlockAchievement(achievement) {
    if (!this.hasAchievement(achievement.id)) {
      achievement.unlockedAt = new Date();
      this.achievements.push(achievement);
      
      // Si el logro tiene puntos, añadirlos
      if (achievement.points > 0) {
        this.addPoints(achievement.points, `Logro: ${achievement.name}`);
      }
      
      return achievement;
    }
    return null;
  }
  
  // Comprobar si ya tiene un logro
  hasAchievement(achievementId) {
    return this.achievements.some(a => a.id === achievementId);
  }

  // Método privado para añadir transacciones
  _addTransaction(type, description, pointsAmount = 0, moneyAmount = 0, levelPointsAmount = 0, rewardPointsAmount = 0) {
    const transaction = {
      id: Date.now(),
      type,
      description,
      pointsAmount, // Para compatibilidad con la versión anterior
      moneyAmount,
      levelPointsAmount,
      rewardPointsAmount,
      timestamp: new Date()
    };
    this.transactions.push(transaction);
    return transaction;
  }
  
  // Verificar si algún reto progresa con la acción realizada
  _checkChallengeProgress(action) {
    // Buscar challenges que se puedan actualizar por actividades
    catalogConfig.activities.forEach(activity => {
      if (action.includes(activity.name) && activity.challengeTrigger) {
        this.updateChallengeProgress(activity.challengeTrigger);
      }
    });
    
    // Buscar challenges que se actualicen por compras de categoría
    catalogConfig.products.forEach(product => {
      if (action.includes(product.name)) {
        // Buscar challenges que se triggeren por esta categoría
        const challenge = catalogConfig.challenges.find(c => c.triggerCategory === product.category);
        if (challenge) {
          this.updateChallengeProgress(challenge.id);
        }
      }
    });
  }

  // Método privado para actualizar tier usando configuración centralizada
  _checkTierUpdate() {
    const currentTierObj = tiersConfig.getTierByPoints(this.levelPoints);
    const newTierName = currentTierObj.name;

    // Si hubo cambio de tier
    if (newTierName !== this.tier) {
      const oldTier = this.tier;
      this.tier = newTierName;
      this._addTransaction('System', `Actualización a nivel ${newTierName}`, 0, 0, 0, 0);
      
      // Trigger achievement de tier
      this._triggerAchievement('tier_update');
    }
  }
  
  // Obtener el próximo tier usando configuración centralizada
  getNextTier() {
    return tiersConfig.getNextTier(this.tier)?.name || null;
  }
  
  // Obtener puntos necesarios para el próximo tier
  getPointsForNextTier() {
    const nextTier = tiersConfig.getNextTier(this.tier);
    return nextTier ? nextTier.threshold : null;
  }
  
  // Calcular progreso hacia el próximo nivel (0-100%)
  getProgressToNextTier() {
    const currentTierObj = tiersConfig.getTierByName(this.tier);
    const nextTierObj = tiersConfig.getNextTier(this.tier);
    
    if (!nextTierObj) return 100; // Ya está en el máximo tier
    
    return tiersConfig.getProgressCalculation(this.levelPoints, currentTierObj, nextTierObj);
  }

  // Métodos estáticos
  static findById(id) {
    return members.find(member => member.id === parseInt(id));
  }

  static findByEmail(email) {
    return members.find(member => member.email === email);
  }

  static findBySalesforceId(sfId) {
    return members.find(member => member.salesforceId === sfId);
  }

  static save(member) {
    members.push(member);
    return member;
  }

  static getAll() {
    return members;
  }
}

module.exports = Member;