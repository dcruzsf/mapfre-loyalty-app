const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME || 'Club Mapfre';
    
    // Mapa de Partners con los IDs proporcionados
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

  // 1. GESTIÓN DE MIEMBROS
  async enrollMember(memberData) {
    try {
      const headers = await this.getHeaders();
      const instanceUrl = await this.getInstanceUrl();
      const membershipNumber = `MAP-${Date.now()}`;
      
      const payload = {
        enrollmentDate: new Date().toISOString(),
        membershipNumber: membershipNumber,
        associatedContactDetails: {
          firstName: memberData.name.split(' ')[0],
          lastName: memberData.name.split(' ').slice(1).join(' ') || 'Socio',
          email: memberData.email,
          allowDuplicateRecords: "false"
        },
        memberStatus: "Active",
        enrollmentChannel: "Web"
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodeURIComponent(this.loyaltyProgramName)}/individual-member-enrollments`;
      const res = await axios.post(url, payload, { headers, timeout: 20000 });
      return res.data; 
    } catch (error) { throw error; }
  }

  async syncMemberPoints(member, salesforceMemberId) {
    try {
      if (!salesforceMemberId) return member;
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();
      
      const q = `SELECT Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${salesforceMemberId}'`;
      const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`, { headers });
      
      if (res.data.records) {
          res.data.records.forEach(c => {
             // Sincronización de Tréboles y Puntos Nivel
             if (c.Name === 'Tréboles') {
                 member.rewardPoints = c.PointsBalance;
             } 
             if (c.Name === 'Puntos_Nivel') {
                 member.levelPoints = c.PointsBalance;
             }
          });
      }

      // Sincronizar Categoría (Tier)
      const tierQ = `SELECT Name FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQ)}`, { headers });
      if (tierRes.data.records?.length > 0) {
          member.tier = tierRes.data.records[0].Name;
      }

      return member;
    } catch (error) { return member; }
  }

  // 2. PROCESAMIENTO DE TRANSACCIONES (ID de Subtipo Corregido para Accrual)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date) {
    try {
      console.log(`🍀 Club MAPFRE: Registrando ${points} Tréboles para socio ${memberId}...`);
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      // Buscamos IDs base (Programa y Tipo)
      const programId = await this.getIdByQuery(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}'`);
      const journalTypeId = await this.getIdByQuery(`SELECT Id FROM JournalType WHERE Name = 'Accrual'`);
      
      /**
       * ID DE SUBTIPO FIJO PARA ACCRUAL:
       * Forzamos el ID '0lS7Q000000srPgUAI' para evitar que Salesforce 
       * lo confunda con el ID de Redemption.
       */
      const journalSubTypeId = '0lS7Q000000srPgUAI'; 

      // Identificamos el PartnerId basado en el jSubType (Nombre del comercio)
      const partnerId = this.partnerMap[jSubType] || null;

      if (!programId || !journalTypeId) {
        console.error('❌ Error metadatos:', { programId, journalTypeId });
        return null;
      }

      const payload = {
        ActivityDate: date || new Date().toISOString(),
        LoyaltyProgramId: programId,
        MemberId: memberId,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: journalSubTypeId, // ID correcto de Accrual/Purchase
        PartnerId: partnerId,
        TransactionAmount: Math.abs(points),
        Status: 'Pending'
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      const txRes = await axios.post(url, payload, { headers });
      
      console.log(`✅ Tx enviada con éxito (ACCRUAL). Partner: ${jSubType} (${partnerId}). ID: ${txRes.data.id}`);
      return txRes.data;
    } catch (error) { 
      console.error('❌ Error detallado en processTransaction:', error.response ? JSON.stringify(error.response.data) : error.message); 
      return null;
    }
  }

  async getMemberTransactions(identifier, limit = 10) { return []; }
  async getMemberBadges() { return []; }
}

module.exports = new SalesforceLoyalty();