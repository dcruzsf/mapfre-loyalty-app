const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME || 'Club Mapfre';
    this.timeout = 25000; 
  }

  // Helper para headers
  async getHeaders() {
    const token = await salesforceAuth.getAccessToken();
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }

  // ---------------------------------------------------------------------------
  // 1. GESTIÓN DE MIEMBROS MAPFRE (Registro corregido)
  // ---------------------------------------------------------------------------

  async enrollMember(memberData) {
    try {
      if (!this.loyaltyProgramName) throw new Error('Nombre del programa Mapfre no definido en Config Vars');

      console.log(`⏱️ Registrando cliente en "${this.loyaltyProgramName}" (SF)...`);
      
      const accessToken = await salesforceAuth.getAccessToken();
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const enrollmentDate = new Date().toISOString();
      
      // MembershipNumber manual con prefijo MAP (Necesario si no es automático en SF)
      const membershipNumber = `MAP-${Date.now()}`;

      const payload = {
        enrollmentDate: enrollmentDate,
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

      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/individual-member-enrollments`;
      
      const headers = { 
        'Authorization': `Bearer ${accessToken}`, 
        'Content-Type': 'application/json' 
      };

      console.log('📡 Enviando inscripción simplificada a Salesforce...');
      const response = await axios.post(url, payload, { headers, timeout: 20000 });

      console.log('✅ Cliente Mapfre dado de alta en Salesforce');
      return response.data;
      
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('❌ DETALLE ERROR 400 SF:', JSON.stringify(error.response.data));
      } else {
        console.error('❌ Error enrollMember Mapfre:', error.message);
      }
      throw error;
    }
  }

  async getMemberCurrencies(loyaltyProgramMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      // Buscamos Tréboles y Puntos de Nivel
      const query = `SELECT Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${loyaltyProgramMemberId}'`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(url, { headers, timeout: 15000 });
      const result = { qualifying: 0, nonQualifying: 0 };
      
      const qName = process.env.SF_CURRENCY_QUALIFYING_NAME || 'Puntos_Nivel'; 
      const nqName = process.env.SF_CURRENCY_NONQUALIFYING_NAME || 'Treboles';

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
      member.rewardPoints = currencies.nonQualifying; // Tréboles

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const tierQuery = `SELECT Name FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQuery)}`;
      const tierResponse = await axios.get(tierUrl, { headers, timeout: 10000 });

      if (tierResponse.data.records?.length > 0) {
        const sfTierName = tierResponse.data.records[0].Name;
        const tierMapping = { 'Silver': 'Plata', 'Gold': 'Oro', 'Platinum': 'Platino', 'Diamond': 'Diamante' };
        if (sfTierName) member.tier = tierMapping[sfTierName] || sfTierName;
      }
      return member;
    } catch (error) { return member; }
  }

  // ---------------------------------------------------------------------------
  // 2. PROMOCIONES E HITOS (Retos Mapfre)
  // ---------------------------------------------------------------------------

  async getPromotionDataViaSOQL(salesforceMemberId, promotionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      
      const q = `SELECT Id, Name, Description FROM Promotion WHERE Id = '${promotionId}'`;
      const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`, { headers });
      if (!res.data.records?.length) return null;
      const promotionData = res.data.records[0];

      const attrQ = `SELECT Id, Name, TargetValue FROM LoyaltyPgmEngmtAttribute WHERE LoyaltyProgramId IN (SELECT LoyaltyProgramId FROM Promotion WHERE Id = '${promotionId}')`;
      const attrRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(attrQ)}`, { headers });
      
      let progressMap = {};
      const progQ = `SELECT LoyaltyPgmEngmtAttributeId, CurrentValue FROM LoyaltyPgmMbrAttributeVal WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'`;
      const progRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(progQ)}`, { headers });
      if(progRes.data.records) progRes.data.records.forEach(p => progressMap[p.LoyaltyPgmEngmtAttributeId] = parseFloat(p.CurrentValue)||0);

      const milestones = (attrRes.data.records || []).map(a => {
        const nLower = a.Name.toLowerCase();
        let target = parseFloat(a.TargetValue) || 1;
        if (nLower.includes('poliza') || nLower.includes('seguro')) target = 3; 
        if (nLower.includes('siniestro')) target = 365; 

        return {
          id: a.Id, 
          name: a.Name.replace(/_/g, ' '), 
          currentValue: progressMap[a.Id] || 0, 
          targetValue: target, 
          completed: (progressMap[a.Id] || 0) >= target
        };
      });

      return { promotion: promotionData, milestones };
    } catch (error) { return null; }
  }

  // ---------------------------------------------------------------------------
  // 3. PROCESAMIENTO DE TRANSACCIONES (Tréboles)
  // ---------------------------------------------------------------------------

  async processTransaction(memberId, type, points, currency, jType, jSubType, date, jSubTypeId) {
    try {
      console.log(`🍀 Registrando movimiento de Tréboles: ${jSubType}...`);
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      
      const progQ = `SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}' LIMIT 1`;
      const progRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(progQ)}`, { headers });
      const progId = progRes.data.records?.[0]?.Id;

      const typeQ = `SELECT Id FROM TransactionJournalType WHERE Name = '${jType || 'Accrual'}' LIMIT 1`;
      const typeRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(typeQ)}`, { headers });
      const typeId = typeRes.data.records?.[0]?.Id;

      const payload = {
        ActivityDate: date, 
        JournalTypeId: typeId, 
        JournalSubTypeId: jSubTypeId, // ID del subtipo (ej. Compra Seguro)
        LoyaltyProgramId: progId, 
        MemberId: memberId, 
        TransactionAmount: Math.abs(points),
        Status: 'Pending'
      };
      
      const res = await axios.post(`${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`, payload, { headers });
      return res.data;
    } catch (e) {
      console.warn('⚠️ Error en TransactionJournal:', e.message);
      return null;
    }
  }

  _createTimeoutPromise(ms, msg) {
      return new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
  }
}

module.exports = new SalesforceLoyalty();