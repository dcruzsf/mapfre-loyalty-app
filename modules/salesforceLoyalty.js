const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME || 'Club Mapfre';
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
             // Sincronización usando el nombre exacto con tilde
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

  // 2. PROCESAMIENTO DE TRANSACCIONES (Con objetos JournalType y JournalSubType)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date) {
    try {
      console.log(`🍀 Club MAPFRE: Registrando ${points} Tréboles...`);
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      // Buscamos IDs con los nombres de objetos corregidos
      const programId = await this.getIdByQuery(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}'`);
      
      // JournalType: Accrual
      const journalTypeId = await this.getIdByQuery(`SELECT Id FROM JournalType WHERE Name = 'Accrual'`);
      
      // JournalSubType: Purchase
      const journalSubTypeId = await this.getIdByQuery(`SELECT Id FROM JournalSubType WHERE Name = 'Purchase'`);

      if (!programId || !journalTypeId || !journalSubTypeId) {
        console.error('❌ Error de metadatos: ProgramId:', programId, 'JournalTypeId:', journalTypeId, 'SubTypeId:', journalSubTypeId);
        return null;
      }

      const payload = {
        ActivityDate: date || new Date().toISOString(),
        LoyaltyProgramId: programId,
        MemberId: memberId,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: journalSubTypeId,
        TransactionAmount: Math.abs(points),
        Status: 'Pending'
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      const txRes = await axios.post(url, payload, { headers });
      
      console.log(`✅ Transacción MAPFRE enviada con éxito: ${txRes.data.id}`);
      return txRes.data;
    } catch (error) { 
      console.error('❌ Error en processTransaction:', error.response ? JSON.stringify(error.response.data) : error.message); 
      return null;
    }
  }

  // 3. FUNCIONES DE SOPORTE PARA EVITAR ERRORES "NOT A FUNCTION"
  async getMemberTransactions(identifier, limit = 10) { return []; }
  async getMemberBadges() { return []; }
}

module.exports = new SalesforceLoyalty();