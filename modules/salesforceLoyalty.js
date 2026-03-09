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
      'Repostaje en Repsol': '0ldJ70000000057IAA'
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
             if (c.Name === 'Tréboles') {
                 member.rewardPoints = c.PointsBalance;
             } 
             if (c.Name === 'Puntos_Nivel') {
                 member.levelPoints = c.PointsBalance;
             }
          });
      }
      return member;
    } catch (error) { return member; }
  }

  // 2. PROCESAMIENTO DE TRANSACCIONES (Actualizado con PartnerId)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date) {
    try {
      console.log(`🍀 Club MAPFRE: Registrando ${points} Tréboles para socio ${memberId}...`);
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      // Buscamos IDs base
      const programId = await this.getIdByQuery(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}'`);
      const journalTypeId = await this.getIdByQuery(`SELECT Id FROM JournalType WHERE Name = 'Accrual'`);
      const journalSubTypeId = await this.getIdByQuery(`SELECT Id FROM JournalSubType WHERE Name = 'Purchase'`);

      // Identificamos el PartnerId basado en el jSubType que viene de la vista
      const partnerId = this.partnerMap[jSubType] || null;

      if (!programId || !journalTypeId || !journalSubTypeId) {
        console.error('❌ Error metadatos:', { programId, journalTypeId, journalSubTypeId });
        return null;
      }

      const payload = {
        ActivityDate: date || new Date().toISOString(),
        LoyaltyProgramId: programId,
        MemberId: memberId,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: journalSubTypeId,
        PartnerId: partnerId, // <--- Aquí se inyecta el ID del comercio (0ldJ...)
        TransactionAmount: Math.abs(points),
        Status: 'Pending'
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      const txRes = await axios.post(url, payload, { headers });
      
      console.log(`✅ Tx enviada con éxito. Partner: ${jSubType} (${partnerId}). ID: ${txRes.data.id}`);
      return txRes.data;
    } catch (error) { 
      console.error('❌ Error en processTransaction:', error.response ? JSON.stringify(error.response.data) : error.message); 
      return null;
    }
  }

  async getMemberTransactions(identifier, limit = 10) { return []; }
  async getMemberBadges() { return []; }
}

module.exports = new SalesforceLoyalty();