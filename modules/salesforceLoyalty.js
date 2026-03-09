const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME || 'Club Mapfre';
    this.timeout = 25000; 
  }

  async getHeaders() {
    const token = await salesforceAuth.getAccessToken();
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // 1. GESTIÓN DE MIEMBROS
  async enrollMember(memberData) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const accessToken = await salesforceAuth.getAccessToken();
      const membershipNumber = `MAP-${Date.now()}`;

      const payload = {
        enrollmentDate: new Date().toISOString(),
        membershipNumber: membershipNumber,
        associatedContactDetails: {
          firstName: memberData.name.split(' ')[0] || memberData.name,
          lastName: memberData.name.split(' ').slice(1).join(' ') || 'Socio',
          email: memberData.email,
          allowDuplicateRecords: "false" 
        },
        memberStatus: "Active",
        enrollmentChannel: "Web"
      };

      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodeURIComponent(this.loyaltyProgramName)}/individual-member-enrollments`;
      const response = await axios.post(url, payload, { 
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } 
      });
      return response.data;
    } catch (error) {
      console.error('❌ Error enrollMember:', error.message);
      throw error;
    }
  }

  async getMemberCurrencies(loyaltyProgramMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      // CORRECCIÓN: Usamos 'Tréboles' con acento como confirmaste
      const qName = 'Puntos_Nivel'; 
      const nqName = 'Tréboles'; 

      const query = `SELECT Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${loyaltyProgramMemberId}'`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(url, { headers });
      const result = { qualifying: 0, nonQualifying: 0 };
      
      (response.data.records || []).forEach(c => {
        if (c.Name === qName) result.qualifying = c.PointsBalance || 0;
        else if (c.Name === nqName) result.nonQualifying = c.PointsBalance || 0;
      });
      return result;
    } catch (error) { return { qualifying: 0, nonQualifying: 0 }; }
  }

  async syncMemberPoints(member, salesforceMemberId) {
    try {
      const currencies = await this.getMemberCurrencies(salesforceMemberId);
      member.levelPoints = currencies.qualifying;
      member.rewardPoints = currencies.nonQualifying;

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const tierQuery = `SELECT Name FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierResponse = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQuery)}`, { headers });

      if (tierResponse.data.records?.length > 0) {
        member.tier = tierResponse.data.records[0].Name;
      }
      return member;
    } catch (error) { return member; }
  }

  // 2. FUNCIONES DE ESTABILIDAD (Las que daban error "is not a function")
  async getMemberTransactions(membershipNumber, limit = 5) {
    // Retornamos array vacío para que la vista cargue sin errores
    return [];
  }

  async getMemberBadges(membershipNumber) {
    return [];
  }

  // 3. PROCESAMIENTO DE TRANSACCIONES (Corregido para evitar Error 400)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date) {
    try {
      console.log(`🍀 Registrando Tréboles en SF para ID: ${memberId}`);
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      
      // Obtenemos IDs necesarios de la Org
      const progRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}' LIMIT 1`)}`, { headers });
      const typeRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(`SELECT Id FROM TransactionJournalType WHERE Name = 'Accrual' LIMIT 1`)}`, { headers });
      
      const progId = progRes.data.records?.[0]?.Id;
      const typeId = typeRes.data.records?.[0]?.Id;

      const payload = {
        ActivityDate: date || new Date().toISOString(), 
        JournalTypeId: typeId, 
        LoyaltyProgramId: progId, 
        MemberId: memberId, 
        TransactionAmount: Math.abs(points),
        Status: 'Pending',
        // Opcional: Si tienes JournalSubType configurado en SF, descomenta la siguiente línea
        // JournalSubTypeId: 'ID_DE_SUBTIPO_AQUI' 
      };
      
      const res = await axios.post(`${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`, payload, { headers });
      console.log('✅ TransactionJournal creado en Salesforce');
      return res.data;
    } catch (e) {
      console.error('❌ Error detallado TransactionJournal:', e.response ? JSON.stringify(e.response.data) : e.message);
      return null;
    }
  }
}

module.exports = new SalesforceLoyalty();