// modules/salesforceLoyalty.js - Versión Final (Lógica Hero Ajustada + Tier Fix)
const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME;
    this.timeout = 25000; 
  }

  // ---------------------------------------------------------------------------
  // 1. GESTIÓN DE MIEMBROS
  // ---------------------------------------------------------------------------

  async enrollMember(memberData) {
    try {
      if (!this.loyaltyProgramName) throw new Error('No se ha definido el nombre del programa');

      console.log('⏱️ Iniciando registro en Salesforce...');
      const accessToken = await Promise.race([
        salesforceAuth.getAccessToken(),
        this._createTimeoutPromise(10000, 'Timeout Token')
      ]);

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const enrollmentDate = new Date().toISOString();
      const membershipNumber = `Member-${Date.now()}`;

      const payload = {
        enrollmentDate,
        membershipNumber,
        associatedContactDetails: {
          firstName: memberData.name.split(' ')[0] || memberData.name,
          lastName: memberData.name.split(' ').slice(1).join(' ') || 'Apellido',
          email: memberData.email,
          allowDuplicateRecords: "false"
        },
        memberStatus: "Active",
        createTransactionJournals: "true",
        transactionJournalStatementFrequency: "Monthly",
        transactionJournalStatementMethod: "Email",
        enrollmentChannel: "Web",
        canReceivePromotions: "true",
        canReceivePartnerPromotions: "true",
        membershipEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
      };

      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/individual-member-enrollments`;
      
      const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };
      const response = await Promise.race([
        axios.post(url, payload, { headers, timeout: this.timeout }),
        this._createTimeoutPromise(this.timeout, 'Timeout Enrollment')
      ]);

      console.log('✅ Miembro inscrito correctamente');
      return response.data;
    } catch (error) {
      console.error('❌ Error enrollMember:', error.message);
      if (error.response?.data?.error) throw new Error(`SF Error: ${error.response.data.error.message}`);
      throw error;
    }
  }

  async getMemberByEmail(email) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/members?contactEmail=${encodeURIComponent(email)}`;
      const headers = await this.getHeaders();
      const response = await axios.get(url, { headers, timeout: 15000 });
      return response.data.records?.[0] || null;
    } catch (error) { return null; }
  }

  async getMemberCurrencies(loyaltyProgramMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const query = `SELECT Id, Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${loyaltyProgramMemberId}'`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
      
      const response = await axios.get(url, { headers, timeout: 15000 });
      const result = { qualifying: 0, nonQualifying: 0 };
      const qName = process.env.SF_CURRENCY_QUALIFYING_NAME || 'Caixapoints';
      const nqName = process.env.SF_CURRENCY_NONQUALIFYING_NAME || 'Cashback';

      (response.data.records || []).forEach(c => {
        if (c.Name === qName) result.qualifying = c.PointsBalance || 0;
        else if (c.Name === nqName) result.nonQualifying = c.PointsBalance || 0;
      });
      return result;
    } catch (error) { return { qualifying: 0, nonQualifying: 0 }; }
  }

  async getMembershipNumber(salesforceMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const query = `SELECT MembershipNumber FROM LoyaltyProgramMember WHERE Id = '${salesforceMemberId}' LIMIT 1`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, { headers, timeout: 10000 });
      if (response.data.records?.length > 0) return response.data.records[0].MembershipNumber;
      throw new Error('No MembershipNumber found');
    } catch (error) { throw error; }
  }

  /**
   * CORREGIDO: Mapeo de Tiers para arreglar el bug visual "tiers.plata"
   */
  async syncMemberPoints(member, salesforceMemberId) {
    try {
      const currencies = await this.getMemberCurrencies(salesforceMemberId);
      member.levelPoints = currencies.qualifying;
      member.rewardPoints = currencies.nonQualifying;

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const tierQuery = `SELECT Name FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQuery)}`;
      const tierResponse = await axios.get(tierUrl, { headers, timeout: 10000 });

      if (tierResponse.data.records?.length > 0) {
        const sfTierName = tierResponse.data.records[0].Name;
        
        // DICCIONARIO DE TRADUCCIÓN (IMPORTANTE)
        const tierMapping = {
            'Bronze': 'Bronze', 'Bronce': 'Bronze', 
            'Silver': 'Silver', 'Plata': 'Silver', 
            'Gold': 'Gold', 'Oro': 'Gold', 
            'Platinum': 'Platinum', 'Platino': 'Platinum',
            'Basic': 'Bronze', 'Premium': 'Gold', 'Elite': 'Platinum'
        };

        if (sfTierName) {
            // Usamos el mapeo o el nombre original si no está en la lista
            member.tier = tierMapping[sfTierName] || sfTierName;
        }
      }
      return member;
    } catch (error) { return member; }
  }

  // ---------------------------------------------------------------------------
  // 2. GESTIÓN DE PROMOCIONES E HITOS (LOGICA CORREGIDA PARA HERO)
  // ---------------------------------------------------------------------------

  async getEnrolledPromotions(salesforceMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/program-processes/Get%20Promotions`;
      const requestBody = { processParameters: [{ MemberId: salesforceMemberId }] };
      const headers = await this.getHeaders();
      const response = await axios.post(url, requestBody, { headers, timeout: 15000 });
      return response.data.outputParameters?.outputParameters?.results || [];
    } catch (error) { return []; }
  }

  async getEngagementTrail(membershipNumber, promotionId) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
    const encodedMembershipNumber = encodeURIComponent(membershipNumber);
    const headers = await this.getHeaders();

    const variations = [
       `/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-attributes?promotionId=${promotionId}`,
       `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-trail?promotionId=${promotionId}`
    ];

    for (const endpoint of variations) {
        try {
            const res = await axios.get(`${instanceUrl}${endpoint}`, { headers, timeout: 8000 });
            return res.data;
        } catch(e) {}
    }
    return null;
  }

  async getPromotionDataViaSOQL(salesforceMemberId, promotionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      let promotionData = null;
      let milestones = [];
      let dataSource = 'None';

      // 1. Info Básica
      try {
        const q = `SELECT Id, Name, Description, StartDate, EndDate FROM Promotion WHERE Id = '${promotionId}'`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`;
        const res = await axios.get(url, { headers, timeout: 10000 });
        if (!res.data.records?.length) return null;
        promotionData = res.data.records[0];
      } catch (e) { return null; }

      // 2. Intentar CHECKLIST
      try {
        const q = `SELECT Id, Name, CurrentValue, TargetValue, Status FROM LoyaltyProgramMbrPromChecklt WHERE LoyaltyProgramMemberId = '${salesforceMemberId}' AND PromotionId = '${promotionId}'`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`;
        const res = await axios.get(url, { headers, timeout: 5000 });
        if (res.data.records?.length > 0) {
          milestones = res.data.records.map(r => ({
            id: r.Id, name: r.Name, 
            currentValue: parseFloat(r.CurrentValue)||0, targetValue: parseFloat(r.TargetValue)||1, 
            completed: r.Status === 'Completed'
          }));
          dataSource = 'RealChecklist';
        }
      } catch (e) {}

      // 3. FALLBACK CON FILTRO MANUAL CORREGIDO
      if (milestones.length === 0) {
        try {
          // Traemos TODOS los atributos
          const q = `SELECT Id, Name, TargetValue FROM LoyaltyPgmEngmtAttribute WHERE LoyaltyProgramId IN (SELECT LoyaltyProgramId FROM Promotion WHERE Id = '${promotionId}')`;
          const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`;
          const res = await axios.get(url, { headers, timeout: 8000 });
          
          let progressMap = {};
          try {
             const progQ = `SELECT LoyaltyPgmEngmtAttributeId, CurrentValue FROM LoyaltyPgmMbrAttributeVal WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'`;
             const progRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(progQ)}`, { headers, timeout: 5000 });
             if(progRes.data.records) progRes.data.records.forEach(p => progressMap[p.LoyaltyPgmEngmtAttributeId] = parseFloat(p.CurrentValue)||0);
          } catch(err) {}

          if (res.data.records?.length > 0) {
             const allAttrs = res.data.records;
             let filteredAttrs = [];

             // -----------------------------------------------------------
             // REGLAS DE NEGOCIO DEFINITIVAS
             // -----------------------------------------------------------
             const promoName = promotionData.Name.toLowerCase();

             if (promoName.includes('premio') || (promoName.includes('compras') && promoName.includes('tarjeta'))) {
                // CASO PREMIO: Solo "Pago"
                filteredAttrs = allAttrs.filter(a => a.Name.toLowerCase().includes('pago'));
             } else {
                // CASO HERO: Queremos todo MENOS "Compra" (evita duplicado) PERO INCLUYENDO "Pago"
                filteredAttrs = allAttrs.filter(a => {
                    const n = a.Name.toLowerCase();
                    return !n.includes('compra'); // Eliminamos solo "compra", dejamos "pago"
                });
             }

             // Mapear y Forzar Targets
             milestones = filteredAttrs.map(a => {
               const cleanName = a.Name.split('__')[0].replace(/_/g, ' ');
               const nLower = cleanName.toLowerCase();
               
               let target = parseFloat(a.TargetValue) || 1;
               
               // Lógica de Targets para "Pago"
               if (nLower.includes('pago')) {
                   if (promoName.includes('premio') || promoName.includes('compras')) {
                       target = 5; // En "Premio" son 5
                   } else {
                       target = 2; // En "Hero" son 2
                   }
               }

               return {
                 id: a.Id, 
                 name: cleanName, 
                 currentValue: progressMap[a.Id] || 0, 
                 targetValue: target, 
                 completed: (progressMap[a.Id] || 0) >= target,
                 isGeneric: true
               };
             });
             dataSource = 'ManualFilteredRules';
          }
        } catch (e) { console.error(e); }
      }

      return { promotion: promotionData, milestones, dataSource };
    } catch (error) { return null; }
  }

  // ---------------------------------------------------------------------------
  // 3. TRANSACCIONES Y UTILIDADES
  // ---------------------------------------------------------------------------

  async getJournalTypeId(typeName) {
      return this._genericIdLookup(typeName, ['TransactionJournalType', 'JournalType']);
  }
  
  async getJournalSubTypeId(subtypeName) {
      return this._genericIdLookup(subtypeName, ['JournalSubType', 'TransactionJournalSubType']); 
  }

  async _genericIdLookup(name, objects) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const headers = await this.getHeaders();
    for (const obj of objects) {
      try {
        const q = `SELECT Id FROM ${obj} WHERE Name = '${name}' LIMIT 1`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`;
        const res = await axios.get(url, { headers, timeout: 5000 });
        if (res.data.records?.length) return res.data.records[0].Id;
      } catch(e){}
    }
    return null;
  }

  async getLoyaltyProgramId() {
    try {
        const instanceUrl = await salesforceAuth.getInstanceUrl();
        const headers = await this.getHeaders();
        const q = `SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}' LIMIT 1`;
        const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`, { headers });
        if (res.data.records?.length) return res.data.records[0].Id;
        throw new Error('Program ID not found');
    } catch(e) { throw e; }
  }

  async processTransaction(memberId, type, points, currency, jType, jSubType, date, jSubTypeId, custom = {}) {
    try {
      console.log(`📝 Registrando ${type}...`);
      const progId = await this.getLoyaltyProgramId();
      const typeId = await this.getJournalTypeId(jType);
      const subTypeId = jSubTypeId || await this.getJournalSubTypeId(jSubType);

      if (!progId || !typeId || !subTypeId) throw new Error('Missing IDs');

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const payload = {
        ActivityDate: date, JournalTypeId: typeId, JournalSubTypeId: subTypeId,
        LoyaltyProgramId: progId, MemberId: memberId, TransactionAmount: Math.abs(points),
        Status: 'Pending', ...custom
      };
      
      const headers = await this.getHeaders();
      const res = await axios.post(`${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`, payload, { headers, timeout: 20000 });
      console.log(`✅ Tx registrada: ${res.data.id}`);
      return res.data;
    } catch (e) {
      console.warn('⚠️ Tx falló en SF (continuando):', e.message);
      return null;
    }
  }

  async checkAndAssignPromotionBadge(salesforceMemberId, promotionId, milestones) {
      const allCompleted = milestones.length > 0 && milestones.every(m => m.completed);
      return { allCompleted, badgeAssigned: false };
  }

  async assignBadgeToMember(salesforceMemberId, badgeDefinitionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/LoyaltyProgramMemberBadge`;
      const badgeData = { LoyaltyProgramMemberId: salesforceMemberId, LoyaltyProgramBadgeId: badgeDefinitionId };
      const response = await axios.post(url, badgeData, { headers, timeout: 15000 });
      return { success: true, id: response.data.id };
    } catch (error) { return null; }
  }

  async getHeaders() {
    const token = await salesforceAuth.getAccessToken();
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  }
  
  _createTimeoutPromise(ms, msg) {
      return new Promise((_, r) => setTimeout(() => r(new Error(msg)), ms));
  }
}

module.exports = new SalesforceLoyalty();