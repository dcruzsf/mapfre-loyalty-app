const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME || 'Club Mapfre';
    
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

  // 1. REGISTRO DE MIEMBROS (Restaurado para que vuelva a funcionar)
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
      console.log('✅ Miembro registrado en SF:', res.data.loyaltyProgramMemberId);
      return res.data; 
    } catch (error) { 
      console.error('❌ Error en enrollMember:', error.response ? JSON.stringify(error.response.data) : error.message);
      throw error; 
    }
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
             if (c.Name === 'Tréboles') member.rewardPoints = c.PointsBalance;
             if (c.Name === 'Puntos_Nivel') member.levelPoints = c.PointsBalance;
          });
      }
      return member;
    } catch (error) { return member; }
  }

  // 2. PROCESAMIENTO DE TRANSACCIONES (Corregido y Simplificado)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date, journalSubTypeId) {
    try {
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      // IDs de metadatos
      const programId = await this.getIdByQuery(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}'`);
      
      // Usamos el jType que viene (Accrual o Redemption) para buscar el ID
      const journalTypeId = await this.getIdByQuery(`SELECT Id FROM JournalType WHERE Name = '${jType || 'Accrual'}'`);
      
      // Si jSubType es Tarjeta, partner es null. Si no, buscamos en el mapa.
      let partnerId = null;
      if (jSubType !== 'Pago con Tarjeta Mapfre') {
        partnerId = this.partnerMap[jSubType] || null;
      }

      // El ID de subtipo: si el router envía uno (redención), lo usamos. Si no, el fijo de Accrual.
      const finalSubTypeId = journalSubTypeId || '0lS7Q000000srPgUAI';

      const payload = {
        ActivityDate: date || new Date().toISOString(),
        LoyaltyProgramId: programId,
        MemberId: memberId,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: finalSubTypeId,
        PartnerId: partnerId,
        TransactionAmount: Math.abs(points),
        Status: 'Pending'
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      const txRes = await axios.post(url, payload, { headers });
      
      console.log(`✅ Transacción registrada: ${jType} - Partner: ${partnerId || 'None'}`);
      return txRes.data;
    } catch (error) { 
      console.error('❌ Error en processTransaction:', error.response ? JSON.stringify(error.response.data) : error.message); 
      return null;
    }
  }

  async getMemberTransactions() { return []; }
  async getMemberBadges() { return []; }
}

module.exports = new SalesforceLoyalty();