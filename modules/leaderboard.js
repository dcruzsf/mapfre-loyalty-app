// modules/leaderboard.js
const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');
const memberScoring = require('./memberScoring');

class LeaderboardService {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME;
  }

  /**
   * Envía el scoring del miembro al leaderboard en Salesforce
   * @param {Object} member - Objeto miembro con todos sus atributos
   * @returns {Promise<Object>} - Respuesta de Salesforce
   */
  async submitToLeaderboard(member) {
    try {
      if (!member) {
        throw new Error('No se ha proporcionado un miembro válido');
      }

      // Calcular el scoring
      const score = memberScoring.calculateEngagementScore(member, 10, 250);
      
      // Verificar si estamos en modo Salesforce
      const useSalesforce = process.env.USE_SALESFORCE === 'true';
      
      // Si no estamos usando Salesforce, solo actualizamos localmente
      if (!useSalesforce) {
        console.log('Modo Demo: Simulando envío a Salesforce');
        return { 
          success: true, 
          demo: true,
          score, 
          level: memberScoring.getEngagementLevel(score),
          details: memberScoring.getScoreDetails(member, 10, 250),
          timestamp: new Date()
        };
      }
      
      // A partir de aquí, es el flujo real de Salesforce
      if (!member.salesforceId) {
        console.error('Error: El miembro no tiene un ID de Salesforce asignado');
        console.error('Datos del miembro:', {
          id: member.id,
          name: member.name,
          email: member.email,
          salesforceId: member.salesforceId
        });
        throw new Error('El miembro no tiene un ID de Salesforce asignado');
      }

      // Obtener acceso a Salesforce
      const accessToken = await salesforceAuth.getAccessToken();
      const instanceUrl = await salesforceAuth.getInstanceUrl();

      // Construir URL para actualizar el miembro de loyalty
      // Usar la API REST estándar para actualizar el objeto LoyaltyProgramMember
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/LoyaltyProgramMember/${member.salesforceId}`;
      
      // Payload con el campo custom de scoring
      const payload = {
        Leaderboard_Scoring__c: score  // Campo custom en el objeto LoyaltyProgramMember
      };

      console.log(`Enviando scoring (${score}) del miembro ${member.name} a Salesforce...`);
      console.log(`URL: ${url}`);
      console.log(`ID del miembro en SF: ${member.salesforceId}`);
      
      // Configurar headers
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // En Salesforce, PATCH es para actualizar registros existentes con campos específicos
      const response = await axios.patch(url, payload, { headers });
      
      // Si la respuesta tiene código 204 (No Content), la operación fue exitosa
      if (response.status === 204) {
        console.log(`Scoring enviado exitosamente para ${member.name}`);
        return { 
          success: true, 
          score, 
          level: memberScoring.getEngagementLevel(score),
          details: memberScoring.getScoreDetails(member, 10, 250),
          timestamp: new Date()
        };
      } else {
        throw new Error(`Respuesta inesperada: ${response.status}`);
      }
    } catch (error) {
      console.error('Error al enviar scoring al leaderboard:', error.message);
      
      if (error.response) {
        console.error('Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Datos:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw new Error(`Error al enviar scoring al leaderboard: ${error.message}`);
    }
  }

  /**
   * Calcula el scoring sin enviarlo a Salesforce (para preview)
   * @param {Object} member - Objeto miembro
   * @returns {Object} - Objeto con el scoring calculado
   */
  calculatePreview(member) {
    const score = memberScoring.calculateEngagementScore(member, 10, 250);
    return {
      score,
      level: memberScoring.getEngagementLevel(score),
      details: memberScoring.getScoreDetails(member, 10, 250)
    };
  }
}

module.exports = new LeaderboardService();