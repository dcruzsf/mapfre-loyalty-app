// modules/salesforceLoyalty.js
const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME;
    this.timeout = 25000; // 25 segundos
  }

  /**
   * Crea un nuevo miembro de loyalty en Salesforce
   */
  async enrollMember(memberData) {
    try {
      if (!this.loyaltyProgramName) {
        throw new Error('No se ha definido el nombre del programa de loyalty (SF_LOYALTY_PROGRAM_NAME)');
      }

      console.log('⏱️ Iniciando registro en Salesforce (timeout: 25s)...');

      const accessToken = await Promise.race([
        salesforceAuth.getAccessToken(),
        this._createTimeoutPromise(10000, 'Timeout obteniendo token de Salesforce')
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
      
      console.log('📤 Enviando solicitud de enrollment a Salesforce...');
      console.log('URL:', url);

      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      const response = await Promise.race([
        axios.post(url, payload, { headers, timeout: this.timeout }),
        this._createTimeoutPromise(this.timeout, 'Timeout en registro de Salesforce')
      ]);

      console.log('✅ Miembro inscrito correctamente en Salesforce');
      return response.data;

    } catch (error) {
      console.error('❌ Error al inscribir miembro en Loyalty:', error.message);
      
      if (error.message.includes('Timeout')) {
        console.error('⏰ La operación tardó demasiado tiempo.');
        throw new Error('El registro está tardando más de lo esperado. Por favor, inténtalo de nuevo en unos minutos.');
      }
      
      if (error.response) {
        console.error('📋 Detalles del error HTTP:', error.response.status);
        if (error.response.data && error.response.data.error) {
            throw new Error(`Error de Salesforce: ${error.response.data.error.message}`);
        }
      }
      throw error;
    }
  }

  _createTimeoutPromise(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => { reject(new Error(message)); }, ms);
    });
  }

  /**
   * Obtiene los detalles de un miembro de loyalty por email
   */
  async getMemberByEmail(email) {
    try {
      if (!this.loyaltyProgramName) throw new Error('No se ha definido el nombre del programa');

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/members?contactEmail=${encodeURIComponent(email)}`;

      console.log('🔍 Buscando miembro por email en Salesforce:', email);
      
      const headers = await this.getHeaders();
      
      const response = await Promise.race([
        axios.get(url, { headers, timeout: 15000 }),
        this._createTimeoutPromise(15000, 'Timeout buscando miembro')
      ]);

      console.log('✅ Búsqueda completada');
      return response.data.records && response.data.records.length > 0 ? response.data.records[0] : null;

    } catch (error) {
      if (error.response?.status === 404) return null;
      if (error.message.includes('Timeout')) return null;
      console.error('⚠️ Error al buscar miembro por email:', error.message);
      return null;
    }
  }

  /**
   * Obtiene las currencies de un miembro
   */
  async getMemberCurrencies(loyaltyProgramMemberId) {
    try {
      if (!loyaltyProgramMemberId) throw new Error('Se requiere el ID del miembro de loyalty');

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      console.log('💰 Obteniendo currencies del miembro desde Salesforce...');
      const query = `SELECT Id, Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${loyaltyProgramMemberId}'`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

      const response = await Promise.race([
        axios.get(url, { headers, timeout: 15000 }),
        this._createTimeoutPromise(15000, 'Timeout obteniendo currencies')
      ]);

      const currencies = response.data.records || [];
      const result = { qualifying: 0, nonQualifying: 0 };
      const qualifyingName = process.env.SF_CURRENCY_QUALIFYING_NAME || 'Caixapoints';
      const nonQualifyingName = process.env.SF_CURRENCY_NONQUALIFYING_NAME || 'Cashback';

      currencies.forEach(currency => {
        if (currency.Name === qualifyingName) result.qualifying = currency.PointsBalance || 0;
        else if (currency.Name === nonQualifyingName) result.nonQualifying = currency.PointsBalance || 0;
      });

      console.log(`💰 Currencies: ${qualifyingName}=${result.qualifying}, ${nonQualifyingName}=${result.nonQualifying}`);
      return result;

    } catch (error) {
      console.error('❌ Error al obtener currencies:', error.message);
      return { qualifying: 0, nonQualifying: 0 };
    }
  }

  async getMembershipNumber(salesforceMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const query = `SELECT MembershipNumber FROM LoyaltyProgramMember WHERE Id = '${salesforceMemberId}' LIMIT 1`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data.records && response.data.records.length > 0) {
        return response.data.records[0].MembershipNumber;
      }
      throw new Error('No se encontró MembershipNumber para este miembro');
    } catch (error) {
      console.error('❌ Error obteniendo MembershipNumber:', error.message);
      throw error;
    }
  }

  async getEnrolledPromotions(salesforceMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/program-processes/Get%20Promotions`;

      const requestBody = {
        processParameters: [{ MemberId: salesforceMemberId }]
      };

      console.log('🎯 Obteniendo promociones enrolladas del miembro...');
      const headers = await this.getHeaders();
      const response = await axios.post(url, requestBody, { headers, timeout: 15000 });

      const promotions = response.data.outputParameters?.outputParameters?.results || [];
      console.log(`📊 Total promociones enrolladas: ${promotions.length}`);
      return promotions;

    } catch (error) {
      console.error('❌ Error obteniendo promociones enrolladas:', error.message);
      return [];
    }
  }

  /**
   * Obtiene el engagement trail (Restaurado completo)
   */
  async getEngagementTrail(membershipNumber, promotionId) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
    const encodedMembershipNumber = encodeURIComponent(membershipNumber);
    const headers = await this.getHeaders();

    const endpointVariations = [
      `/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-attributes?promotionId=${promotionId}`,
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-attributes?promotionId=${promotionId}`,
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/member-engagement-attributes?promotionId=${promotionId}`,
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-trail?promotionId=${promotionId}`,
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/promotions/${promotionId}/members/${encodedMembershipNumber}/engagement`,
      `/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-trail?promotionId=${promotionId}`
    ];

    for (let i = 0; i < endpointVariations.length; i++) {
      const endpoint = endpointVariations[i];
      const url = `${instanceUrl}${endpoint}`;

      try {
        console.log(`\n🎯 Intentando variación ${i + 1}/${endpointVariations.length}...`);
        const response = await axios.get(url, { headers, timeout: 15000 });
        console.log(`✅ ¡ÉXITO! Variación ${i + 1} funcionó correctamente`);
        return response.data;
      } catch (error) {
        console.error(`❌ Variación ${i + 1} falló: ${error.response?.status || error.message}`);
        if (error.response?.status === 404) {
          console.log(`   → Endpoint no existe, probando siguiente...`);
        }
      }
    }

    console.error(`\n❌ Todas las ${endpointVariations.length} variaciones de endpoint fallaron`);
    return null;
  }

  /**
   * MÉTODO CON SMART FALLBACK (Corregido y Optimizado)
   */
  async getPromotionDataViaSOQL(salesforceMemberId, promotionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      let promotionData = null;
      let milestones = [];
      let dataSource = 'None';

      // 1. Obtener datos básicos de la promoción
      try {
        const promotionQuery = `SELECT Id, Name, Description, StartDate, EndDate 
          FROM Promotion 
          WHERE Id = '${promotionId}'`;
        const promotionUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(promotionQuery)}`;
        const promotionResponse = await axios.get(promotionUrl, { headers, timeout: 10000 });
        
        if (!promotionResponse.data.records || promotionResponse.data.records.length === 0) return null;
        promotionData = promotionResponse.data.records[0];
      } catch (basicError) { return null; }

      // 2. INTENTO A: Tabla "LoyaltyProgramMbrPromChecklt"
      try {
        console.log("🔍 [Intento A] Buscando hitos reales en LoyaltyProgramMbrPromChecklt...");
        const checklistQuery = `
          SELECT Id, Name, CurrentValue, TargetValue, Status
          FROM LoyaltyProgramMbrPromChecklt
          WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'
          AND PromotionId = '${promotionId}'
        `.trim();
        const checklistUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(checklistQuery)}`;
        const checklistResponse = await axios.get(checklistUrl, { headers, timeout: 5000 });

        if (checklistResponse.data.records && checklistResponse.data.records.length > 0) {
          console.log(`✅ Hitos reales encontrados: ${checklistResponse.data.records.length}`);
          milestones = checklistResponse.data.records.map(record => ({
            id: record.Id,
            name: record.Name,
            currentValue: parseFloat(record.CurrentValue) || 0,
            targetValue: parseFloat(record.TargetValue) || 1,
            completed: record.Status === 'Completed' || (parseFloat(record.CurrentValue) >= parseFloat(record.TargetValue))
          }));
          dataSource = 'RealChecklist';
        }
      } catch (checkError) {
         // Fallo silencioso para ir al fallback
         console.warn(`⚠️ [Fallo Intento A] - Continuando a Fallback`);
      }

      // 3. INTENTO B (SMART FALLBACK)
      if (milestones.length === 0) {
         console.log("🔄 [Intento B] Activando Smart Fallback...");
         try {
            const attributesQuery = `
              SELECT Id, Name, TargetValue, Description
              FROM LoyaltyPgmEngmtAttribute
              WHERE LoyaltyProgramId IN (SELECT LoyaltyProgramId FROM Promotion WHERE Id = '${promotionId}')
              ORDER BY Name ASC
            `.trim();
            const attrUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(attributesQuery)}`;
            const attrResponse = await axios.get(attrUrl, { headers, timeout: 10000 });
            
            const progressQuery = `SELECT LoyaltyPgmEngmtAttributeId, CurrentValue FROM LoyaltyPgmMbrAttributeVal WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'`;
            const progressUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(progressQuery)}`;
            const progressRes = await axios.get(progressUrl, { headers, timeout: 10000 });
            
            const progressMap = {};
            if(progressRes.data.records) progressRes.data.records.forEach(p => progressMap[p.LoyaltyPgmEngmtAttributeId] = parseFloat(p.CurrentValue) || 0);

            // LOGICA SMART: Repartir hitos según ID de promo
            const promoHash = promotionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            if (attrResponse.data.records) {
              const allAttributes = attrResponse.data.records;
              const filteredAttrs = allAttributes.length < 4 
                ? allAttributes 
                : allAttributes.filter((_, index) => (index + promoHash) % 2 === 0);

              milestones = filteredAttrs.map(attribute => {
                const cleanName = attribute.Name.split('__')[0].replace(/_/g, ' ');
                const current = progressMap[attribute.Id] || 0;
                const target = attribute.TargetValue ? parseFloat(attribute.TargetValue) : 3; 

                return {
                  id: attribute.Id,
                  name: cleanName,
                  currentValue: current,
                  targetValue: target,
                  completed: current >= target,
                  isGeneric: true
                };
              });
              dataSource = 'SmartFallback';
              console.log(`✅ Hitos genéricos (fallback) cargados: ${milestones.length}`);
            }
         } catch (fallbackError) {
            console.error(`❌ Error en fallback: ${fallbackError.message}`);
         }
      }

      return {
        promotion: promotionData,
        milestones: milestones,
        dataSource: dataSource
      };

    } catch (error) {
      console.error('❌ Error fatal en SOQL:', error.message);
      return null;
    }
  }

  async enrollMemberInPromotion(salesforceMemberId, promotionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/PromotionEnrollment`;

      const enrollmentData = {
        LoyaltyProgramMemberId: salesforceMemberId,
        PromotionId: promotionId,
        EnrollmentStatus: 'Enrolled'
      };

      console.log('🎁 Enrollando miembro en promoción...');
      const response = await axios.post(url, enrollmentData, { headers, timeout: 15000 });
      console.log('✅ Miembro enrollado en promoción correctamente');
      return response.data;

    } catch (error) {
      console.error('❌ Error enrollando en promoción:', error.message);
      return null;
    }
  }

  async syncMemberPoints(member, salesforceMemberId) {
    try {
      console.log('🔄 Sincronizando puntos y tier desde Salesforce...');
      const currencies = await this.getMemberCurrencies(salesforceMemberId);

      member.levelPoints = currencies.qualifying;
      member.rewardPoints = currencies.nonQualifying;

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const tierQuery = `SELECT Id, Name, EffectiveDate FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQuery)}`;
      const tierResponse = await axios.get(tierUrl, { headers, timeout: 10000 });

      if (tierResponse.data.records && tierResponse.data.records.length > 0) {
        const tierRecord = tierResponse.data.records[0];
        const sfTierName = tierRecord.Name;
        if (sfTierName) {
          const tierMapping = {
            'Bronze': 'Bronze', 'Bronce': 'Bronze', 'Silver': 'Silver', 'Plata': 'Silver',
            'Gold': 'Gold', 'Oro': 'Gold', 'Platinum': 'Platinum', 'Platino': 'Platinum',
            'Basic': 'Bronze', 'Plus': 'Silver', 'Premium': 'Gold', 'Elite': 'Platinum'
          };
          member.tier = tierMapping[sfTierName] || sfTierName;
          console.log(`✅ Tier sincronizado: "${sfTierName}" → "${member.tier}"`);
        }
      } else {
        if (member.levelPoints >= 2000) member.tier = 'Platinum';
        else if (member.levelPoints >= 1000) member.tier = 'Gold';
        else if (member.levelPoints >= 500) member.tier = 'Silver';
        else member.tier = 'Bronze';
      }
      return member;
    } catch (error) {
      console.error('⚠️ Error sincronizando puntos:', error.message);
      return member;
    }
  }

  async getJournalTypeId(typeName) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const headers = await this.getHeaders();
    const possibleObjects = ['TransactionJournalType', 'LoyaltyProgramTransactionJournalType', 'JournalType'];

    for (const objectName of possibleObjects) {
      try {
        const query = `SELECT Id FROM ${objectName} WHERE Name = '${typeName}' LIMIT 1`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { headers, timeout: 10000 });
        if (response.data.records && response.data.records.length > 0) {
          console.log(`✅ Encontrado ${objectName} con ID: ${response.data.records[0].Id}`);
          return response.data.records[0].Id;
        }
      } catch (error) {}
    }
    return null;
  }

  async getJournalSubTypeId(subtypeName) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const headers = await this.getHeaders();
    const possibleObjects = ['JournalSubType', 'TransactionJournalSubType', 'LoyaltyProgramTransactionJournalSubType'];

    for (const objectName of possibleObjects) {
      try {
        const query = `SELECT Id, Name FROM ${objectName} WHERE Name = '${subtypeName}' LIMIT 1`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { headers, timeout: 10000 });
        if (response.data.records && response.data.records.length > 0) {
          console.log(`✅ Encontrado ${objectName} con ID: ${response.data.records[0].Id}`);
          return response.data.records[0].Id;
        }
      } catch (error) {}
    }
    return null;
  }

  async getLoyaltyProgramId() {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const query = `SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}' LIMIT 1`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data.records && response.data.records.length > 0) {
        return response.data.records[0].Id;
      }
      throw new Error(`No se encontró LoyaltyProgram con nombre: ${this.loyaltyProgramName}`);
    } catch (error) {
      console.error('❌ Error obteniendo LoyaltyProgram ID:', error.message);
      throw error;
    }
  }

  async processTransaction(loyaltyProgramMemberId, transactionType, pointsChange, currencyType, journalTypeName, journalSubTypeName, activityDate, journalSubTypeId = null, customFields = {}) {
    try {
      if (!loyaltyProgramMemberId) throw new Error('Se requiere el ID del miembro de loyalty');

      console.log(`📝 Registrando ${transactionType} en Salesforce...`);
      const loyaltyProgramId = await this.getLoyaltyProgramId();
      const journalTypeId = await this.getJournalTypeId(journalTypeName);

      let finalJournalSubTypeId = journalSubTypeId;
      if (!finalJournalSubTypeId) {
        finalJournalSubTypeId = await this.getJournalSubTypeId(journalSubTypeName);
      }

      if (!loyaltyProgramId || !journalTypeId || !finalJournalSubTypeId) {
        throw new Error(`Faltan IDs: Program=${loyaltyProgramId}, Type=${journalTypeId}, SubType=${finalJournalSubTypeId}`);
      }

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      
      const payload = {
        ActivityDate: activityDate,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: finalJournalSubTypeId,
        LoyaltyProgramId: loyaltyProgramId,
        MemberId: loyaltyProgramMemberId,
        TransactionAmount: Math.abs(pointsChange),
        Status: 'Pending',
        ...customFields
      };

      console.log('📤 Payload:', JSON.stringify(payload, null, 2));
      const headers = await this.getHeaders();
      const response = await Promise.race([
        axios.post(url, payload, { headers, timeout: 20000 }),
        this._createTimeoutPromise(20000, 'Timeout registrando transacción')
      ]);

      console.log(`✅ ${transactionType} registrado correctamente en Salesforce. ID: ${response.data.id}`);
      return response.data;

    } catch (error) {
      console.warn('⚠️ Continuando sin registrar en Salesforce:', error.message);
      return null;
    }
  }

  async getHeaders() {
    const accessToken = await salesforceAuth.getAccessToken();
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }

  async assignBadgeToMember(salesforceMemberId, badgeDefinitionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      const checkQuery = `SELECT Id FROM LoyaltyProgramMemberBadge WHERE LoyaltyProgramMemberId = '${salesforceMemberId}' AND LoyaltyProgramBadgeId = '${badgeDefinitionId}'`;
      const checkUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(checkQuery)}`;
      const checkResponse = await axios.get(checkUrl, { headers, timeout: 10000 });

      if (checkResponse.data.records && checkResponse.data.records.length > 0) {
        return { alreadyExists: true, id: checkResponse.data.records[0].Id };
      }

      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/LoyaltyProgramMemberBadge`;
      const badgeData = {
        LoyaltyProgramMemberId: salesforceMemberId,
        LoyaltyProgramBadgeId: badgeDefinitionId
      };

      const response = await axios.post(url, badgeData, { headers, timeout: 15000 });
      console.log('✅ Badge asignado correctamente');
      return { success: true, id: response.data.id };

    } catch (error) {
      console.error('❌ Error asignando badge:', error.message);
      return null;
    }
  }

  async getMemberBadges(salesforceMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      const query = `
        SELECT Id, LoyaltyProgramBadgeId, LoyaltyProgramBadge.Name, LoyaltyProgramBadge.ImageUrl, CreatedDate
        FROM LoyaltyProgramMemberBadge
        WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'
        ORDER BY CreatedDate DESC
      `.trim();

      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;
      const response = await axios.get(url, { headers, timeout: 10000 });
      return response.data.records || [];

    } catch (error) {
      return [];
    }
  }

  async checkAndAssignPromotionBadge(salesforceMemberId, promotionId, milestones) {
    try {
      const allCompleted = milestones.every(m => m.completed);
      if (!allCompleted) return { allCompleted: false };

      console.log('✅ Todos los hitos completados! Verificando badge...');
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      const badgeQuery = `SELECT BadgeId FROM Promotion WHERE Id = '${promotionId}'`;
      const badgeUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(badgeQuery)}`;
      const badgeResponse = await axios.get(badgeUrl, { headers, timeout: 10000 });

      if (!badgeResponse.data.records || badgeResponse.data.records.length === 0) {
        console.log('⚠️ La promoción no tiene un badge asociado');
        return { allCompleted: true, badgeAssigned: false };
      }

      const badgeDefinitionId = badgeResponse.data.records[0].BadgeId;
      if (!badgeDefinitionId) return { allCompleted: true, badgeAssigned: false };

      const result = await this.assignBadgeToMember(salesforceMemberId, badgeDefinitionId);

      if (result && (result.success || result.alreadyExists)) {
        return {
          allCompleted: true,
          badgeAssigned: true,
          badgeId: result.id,
          isNewBadge: result.success === true
        };
      }
      return { allCompleted: true, badgeAssigned: false };

    } catch (error) {
      console.error('❌ Error verificando/asignando badge:', error.message);
      return { allCompleted: milestones.every(m => m.completed), badgeAssigned: false };
    }
  }
}

module.exports = new SalesforceLoyalty();