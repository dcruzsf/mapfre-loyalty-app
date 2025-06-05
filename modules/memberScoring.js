// modules/memberScoring.js
/**
 * Módulo para calcular el scoring de engagement de los miembros
 * Proporciona un valor entre 0-100 basado en los logros, puntos y nivel del miembro
 */

class MemberScoring {
    /**
     * Calcula el scoring de engagement de un miembro
     * @param {Object} member - Objeto miembro con todos sus atributos
     * @param {number} maxAchievements - Número máximo de logros posibles (10 por defecto)
     * @param {number} initialBalance - Saldo inicial (para calcular % de saldo restante)
     * @returns {number} - Scoring entre 0 y 100
     */
    calculateEngagementScore(member, maxAchievements = 10, initialBalance = 250) {
      if (!member) return 0;
  
      // Pesos para cada factor (total = 100%)
      const weights = {
        achievements: 0.40,  // 40% - Logros desbloqueados
        levelPoints:  0.25,  // 25% - Puntos de nivel
        rewardPoints: 0.15,  // 15% - Puntos de rewards
        tier:         0.15,  // 15% - Nivel alcanzado
        balance:      0.05   // 5%  - Saldo restante
      };
  
      // 1. Puntuación por logros (40% del total)
      const achievementsUnlocked = member.achievements ? member.achievements.length : 0;
      const achievementsScore = (achievementsUnlocked / maxAchievements) * 100;
  
      // 2. Puntuación por puntos de nivel (25% del total)
      // Asumimos que 2000 puntos es un buen punto de referencia para el máximo
      const maxLevelPoints = 2000;
      const levelPointsScore = Math.min((member.levelPoints / maxLevelPoints) * 100, 100);
  
      // 3. Puntuación por puntos de rewards (15% del total)
      // Similar a los puntos de nivel, pero con menor peso
      const rewardPointsScore = Math.min((member.rewardPoints / maxLevelPoints) * 100, 100);
  
      // 4. Puntuación por nivel (15% del total)
      const tierValues = {
        'Bronze': 25,    // 25% del máximo 
        'Silver': 50,    // 50% del máximo
        'Gold': 75,      // 75% del máximo
        'Platinum': 100  // 100% del máximo
      };
      const tierScore = tierValues[member.tier] || 0;
  
      // 5. Puntuación por saldo restante (5% del total)
      // Valoramos que los usuarios que hacen compras estratégicas y mantienen saldo
      const balanceScore = (member.balance / initialBalance) * 100;
  
      // Cálculo final ponderado
      const finalScore = (
        (achievementsScore * weights.achievements) +
        (levelPointsScore * weights.levelPoints) +
        (rewardPointsScore * weights.rewardPoints) +
        (tierScore * weights.tier) +
        (balanceScore * weights.balance)
      );
  
      // Redondear a 2 decimales y asegurar que está entre 0-100
      return Math.min(Math.max(Math.round(finalScore * 100) / 100, 0), 100);
    }
  
    /**
     * Obtiene una descripción textual del nivel de engagement
     * @param {number} score - Scoring calculado (0-100)
     * @returns {string} - Descripción del nivel
     */
    getEngagementLevel(score) {
      if (score >= 90) return 'Experto';
      if (score >= 75) return 'Entusiasta';
      if (score >= 60) return 'Comprometido';
      if (score >= 40) return 'Activo';
      if (score >= 20) return 'Casual';
      return 'Principiante';
    }
  
    /**
     * Obtiene detalles del cálculo para explicar cómo se llegó al scoring
     * @param {Object} member - Objeto miembro
     * @param {number} maxAchievements - Número máximo de logros
     * @param {number} initialBalance - Saldo inicial
     * @returns {Object} - Objeto con los componentes del scoring
     */
    getScoreDetails(member, maxAchievements = 10, initialBalance = 250) {
      if (!member) return {};
  
      const achievementsUnlocked = member.achievements ? member.achievements.length : 0;
      
      return {
        achievements: {
          value: achievementsUnlocked,
          maxValue: maxAchievements,
          percentage: (achievementsUnlocked / maxAchievements) * 100,
          weight: 40
        },
        levelPoints: {
          value: member.levelPoints,
          percentage: Math.min((member.levelPoints / 2000) * 100, 100),
          weight: 25
        },
        rewardPoints: {
          value: member.rewardPoints,
          percentage: Math.min((member.rewardPoints / 2000) * 100, 100),
          weight: 15
        },
        tier: {
          value: member.tier,
          percentage: {
            'Bronze': 25,
            'Silver': 50,
            'Gold': 75,
            'Platinum': 100
          }[member.tier] || 0,
          weight: 15
        },
        balance: {
          value: member.balance,
          maxValue: initialBalance,
          percentage: (member.balance / initialBalance) * 100,
          weight: 5
        }
      };
    }
  }
  
  // Exportamos una única instancia para toda la aplicación
  module.exports = new MemberScoring();