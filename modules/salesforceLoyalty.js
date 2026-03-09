const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME || 'Club Mapfre';
    
    // Mapa de Partners
    this.partnerMap = {
      'Compra en El Corte Inglés': '0ldJ70000000052IAA',
      'Compra en Amazon': '0ldJ7000000004xIAA',
      'Repostaje en Repsol': '0ldJ70000000057IAA',
      'Pago con Tarjeta Mapfre': '0ldJ70000000057IAA' 
    };
  }

  async getHeaders() {
    const token = await salesforceAuth.getAccessToken();
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  async getInstanceUrl() {
    return await salesforceAuth.getInstanceUrl();
  }

  async getIdByQuery(query) {
    try {
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();
      const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`, { headers });
      return res.data.records?.[0]?.Id;
    } catch (e) { 
      console.error('Error en getIdByQuery:', e.message);
      return null; 
    }
  }

  // 1. GESTIÓN DE MIEMBROS Y PUNTOS
  async syncMemberPoints(member, salesforceMemberId) {
    try {
      if (!salesforceMemberId) return member;
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();
      const q = `SELECT Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${salesforceMemberId}'`;
      const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`, { headers });
      
      if (res.data.records) {
          res.data.records.forEach(c => {
             if (c.Name === 'Tréboles') member.rewardPoints = c.PointsBalance;
             if (c.Name === 'Puntos_Nivel') member.levelPoints = c.PointsBalance;
          });
      }
      const tierQ = `SELECT Name FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQ)}`, { headers });
      if (tierRes.data.records?.length > 0) member.tier = tierRes.data.records[0].Name;
      return member;
    } catch (error) { return member; }
  }

  // 2. PROCESAMIENTO DE TRANSACCIONES (Corregido Partner e IDs)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date, journalSubTypeId) {
    try {
      console.log(`🍀 Club MAPFRE: Procesando Journal ${jType} para ${jSubType}...`);
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      // Buscamos IDs base
      const programId = await this.getIdByQuery(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}'`);
      
      // Buscamos el ID del Tipo de Journal (Accrual o Redemption) enviado por el router
      const journalTypeId = await this.getIdByQuery(`SELECT Id FROM JournalType WHERE Name = '${jType}'`);
      
      /**
       * GESTIÓN DE SUBTIPO:
       * Si el router envía un ID específico (como el de Redemption), lo usamos.
       * Si no, usamos el ID fijo de Accrual que nos indicaste.
       */
      const finalSubTypeId = journalSubTypeId || '0lS7Q000000srPgUAI'; 

      /**
       * GESTIÓN DE PARTNER:
       * Si es 'Pago con Tarjeta Mapfre', forzamos el partner a NULL 
       * para evitar que se asocie erróneamente a Repsol.
       */
      let partnerId = null;
      if (jSubType !== 'Pago con Tarjeta Mapfre') {
        partnerId = this.partnerMap[jSubType] || null;
      }

      if (!programId || !journalTypeId) {
        console.error('❌ Error metadatos:', { programId, journalTypeId });
        return null;
      }

      const payload = {
        ActivityDate: date || new Date().toISOString(),
        LoyaltyProgramId: programId,
        MemberId: memberId,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: finalSubTypeId,
        PartnerId: partnerId,
        TransactionAmount: Math.abs(points), // SF Loyalty procesa según Journal Type
        Status: 'Pending'
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      const txRes = await axios.post(url, payload, { headers });
      
      console.log(`✅ Tx enviada: ${jType} | SubTypeID: ${finalSubTypeId} | Partner: ${partnerId || 'Ninguno'}`);
      return txRes.data;
    } catch (error) { 
      console.error('❌ Error en processTransaction:', error.message); 
      return null;
    }
  }

  async getMemberTransactions(identifier, limit = 10) { return []; }
  async getMemberBadges() { return []; }
}

module.exports = new SalesforceLoyalty();