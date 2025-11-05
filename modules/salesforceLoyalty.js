// modules/salesforceLoyalty.js - Versión mejorada con manejo de timeout
const axios = require('axios');
const salesforceAuth = require('./salesforceAuth');

class SalesforceLoyalty {
  constructor() {
    this.apiVersion = process.env.SF_API_VERSION || 'v61.0';
    this.loyaltyProgramName = process.env.SF_LOYALTY_PROGRAM_NAME;
    this.timeout = 25000; // 25 segundos - menos que el timeout de Heroku (30s)
  }

  /**
   * Crea un nuevo miembro de loyalty en Salesforce con manejo mejorado de timeout
   * @param {Object} memberData - Datos del miembro
   * @returns {Promise<Object>} - Respuesta de Salesforce
   */
  async enrollMember(memberData) {
    try {
      if (!this.loyaltyProgramName) {
        throw new Error('No se ha definido el nombre del programa de loyalty (SF_LOYALTY_PROGRAM_NAME)');
      }

      console.log('⏱️ Iniciando registro en Salesforce (timeout: 25s)...');

      // Obtener token y URL de instancia con timeout
      const accessToken = await Promise.race([
        salesforceAuth.getAccessToken(),
        this._createTimeoutPromise(10000, 'Timeout obteniendo token de Salesforce')
      ]);

      const instanceUrl = await salesforceAuth.getInstanceUrl();

      // Construir el payload para el enrollment
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

      // Construir la URL del endpoint
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/individual-member-enrollments`;
      
      console.log('📤 Enviando solicitud de enrollment a Salesforce...');
      console.log('URL:', url);

      // Configurar headers y timeout
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      };

      // Realizar la petición con timeout personalizado
      const response = await Promise.race([
        axios.post(url, payload, { 
          headers,
          timeout: this.timeout 
        }),
        this._createTimeoutPromise(this.timeout, 'Timeout en registro de Salesforce')
      ]);

      console.log('✅ Miembro inscrito correctamente en Salesforce');
      return response.data;

    } catch (error) {
      console.error('❌ Error al inscribir miembro en Loyalty:', error.message);
      
      // Manejo específico de diferentes tipos de error
      if (error.message.includes('Timeout')) {
        console.error('⏰ La operación tardó demasiado tiempo. Salesforce puede estar experimentando lentitud.');
        throw new Error('El registro está tardando más de lo esperado. Por favor, inténtalo de nuevo en unos minutos.');
      }
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Tiempo de espera agotado. Salesforce puede estar ocupado. Inténtalo de nuevo.');
      }
      
      if (error.response) {
        console.error('📋 Detalles del error HTTP:');
        console.error('- Status:', error.response.status);
        
        if (error.response.data) {
          console.error('- Respuesta detallada:', JSON.stringify(error.response.data, null, 2));
          
          // Manejo específico de errores de Salesforce
          if (error.response.data.error && error.response.data.error.message) {
            throw new Error(`Error de Salesforce: ${error.response.data.error.message}`);
          }
        }
        
        throw new Error(`Error HTTP ${error.response.status}: ${error.response.statusText}`);
      }
      
      throw error;
    }
  }

  /**
   * Crea una promesa que se rechaza después del timeout especificado
   * @param {number} ms - Milisegundos para el timeout
   * @param {string} message - Mensaje de error
   * @returns {Promise} - Promesa que se rechaza
   */
  _createTimeoutPromise(ms, message) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(message));
      }, ms);
    });
  }

  /**
   * Obtiene los detalles de un miembro de loyalty por email
   * @param {string} email - Email del miembro
   * @returns {Promise<Object>} - Detalles del miembro
   */
  async getMemberByEmail(email) {
    try {
      if (!this.loyaltyProgramName) {
        throw new Error('No se ha definido el nombre del programa de loyalty (SF_LOYALTY_PROGRAM_NAME)');
      }

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/members?contactEmail=${encodeURIComponent(email)}`;

      console.log('🔍 Buscando miembro por email en Salesforce:', email);
      
      const headers = await this.getHeaders();
      
      // Búsqueda con timeout más corto
      const response = await Promise.race([
        axios.get(url, { headers, timeout: 15000 }),
        this._createTimeoutPromise(15000, 'Timeout buscando miembro')
      ]);

      console.log('✅ Búsqueda completada');
      return response.data.records && response.data.records.length > 0 
        ? response.data.records[0] 
        : null;

    } catch (error) {
      if (error.response?.status === 404) {
        console.log('ℹ️ Miembro no encontrado (404)');
        return null;
      }
      
      if (error.message.includes('Timeout')) {
        console.error('⏰ Timeout buscando miembro - continuando sin búsqueda previa');
        return null;
      }
      
      console.error('⚠️ Error al buscar miembro por email:', error.message);
      return null; // No bloquear el flujo de registro
    }
  }

  /**
   * Obtiene las currencies de un miembro de loyalty desde Salesforce
   * Usa query SOQL al objeto LoyaltyMemberCurrency
   * @param {string} loyaltyProgramMemberId - ID del miembro en Salesforce
   * @returns {Promise<Object>} - Objeto con currencies { qualifying: number, nonQualifying: number }
   */
  async getMemberCurrencies(loyaltyProgramMemberId) {
    try {
      if (!loyaltyProgramMemberId) {
        throw new Error('Se requiere el ID del miembro de loyalty');
      }

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      console.log('💰 Obteniendo currencies del miembro desde Salesforce...');

      // Query SOQL para obtener LoyaltyMemberCurrency
      // El campo Name contiene el nombre de la currency (ej: "Caixapoints", "Cashback")
      const query = `SELECT Id, Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${loyaltyProgramMemberId}'`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

      console.log(`🔗 Query: ${query}`);

      const response = await Promise.race([
        axios.get(url, { headers, timeout: 15000 }),
        this._createTimeoutPromise(15000, 'Timeout obteniendo currencies')
      ]);

      console.log('✅ Currencies obtenidas correctamente');

      // Procesar las currencies de la respuesta
      const currencies = response.data.records || [];
      const result = {
        qualifying: 0,
        nonQualifying: 0
      };

      // Mapear las currencies según sus nombres configurados
      const qualifyingName = process.env.SF_CURRENCY_QUALIFYING_NAME || 'Caixapoints';
      const nonQualifyingName = process.env.SF_CURRENCY_NONQUALIFYING_NAME || 'Cashback';

      currencies.forEach(currency => {
        const currencyName = currency.Name; // El campo Name del LoyaltyMemberCurrency
        if (currencyName === qualifyingName) {
          result.qualifying = currency.PointsBalance || 0;
        } else if (currencyName === nonQualifyingName) {
          result.nonQualifying = currency.PointsBalance || 0;
        }
      });

      console.log(`💰 Currencies: ${qualifyingName}=${result.qualifying}, ${nonQualifyingName}=${result.nonQualifying}`);
      return result;

    } catch (error) {
      console.error('❌ Error al obtener currencies:', error.message);
      if (error.response) {
        console.error('📋 Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }

      if (error.message.includes('Timeout')) {
        console.error('⏰ Timeout obteniendo currencies - usando valores por defecto');
        return { qualifying: 0, nonQualifying: 0 };
      }

      if (error.response?.status === 404) {
        console.log('ℹ️ No se encontraron currencies para este miembro');
        return { qualifying: 0, nonQualifying: 0 };
      }

      throw error;
    }
  }

  /**
   * Obtiene el membershipNumber de un LoyaltyProgramMember
   * @param {string} salesforceMemberId - ID del miembro en Salesforce
   * @returns {Promise<string>} - MembershipNumber del miembro
   */
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

  /**
   * Obtiene las promociones enrolladas del miembro usando program-processes
   * @param {string} salesforceMemberId - ID del LoyaltyProgramMember en Salesforce
   * @returns {Promise<Array>} - Array de promociones enrolladas
   */
  async getEnrolledPromotions(salesforceMemberId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);

      // API para obtener promociones del miembro usando program-processes
      const url = `${instanceUrl}/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/program-processes/Get%20Promotions`;

      const requestBody = {
        processParameters: [
          {
            MemberId: salesforceMemberId
          }
        ]
      };

      console.log('🎯 Obteniendo promociones enrolladas del miembro...');
      console.log(`🔗 URL: ${url}`);
      console.log(`📋 Request body:`, JSON.stringify(requestBody, null, 2));

      const headers = await this.getHeaders();

      const response = await axios.post(url, requestBody, { headers, timeout: 15000 });

      console.log('✅ Promociones enrolladas obtenidas correctamente');
      console.log('📋 Respuesta completa:', JSON.stringify(response.data, null, 2));

      // La estructura real es: outputParameters.outputParameters.results
      const promotions = response.data.outputParameters?.outputParameters?.results || [];
      console.log(`📊 Total promociones enrolladas: ${promotions.length}`);

      return promotions;

    } catch (error) {
      console.error('❌ Error obteniendo promociones enrolladas:', error.message);
      if (error.response) {
        console.error('📋 Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }

      // Si falla, devolver array vacío para no bloquear la UI
      return [];
    }
  }

  /**
   * Obtiene el engagement trail de una promoción específica
   * @param {string} membershipNumber - MembershipNumber del miembro
   * @param {string} promotionId - ID de la promoción
   * @returns {Promise<Object|null>} - Engagement trail con milestones y progreso
   */
  async getEngagementTrail(membershipNumber, promotionId) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
    const encodedMembershipNumber = encodeURIComponent(membershipNumber);
    const headers = await this.getHeaders();

    // Definir múltiples variaciones de endpoints posibles
    const endpointVariations = [
      // Variación 1: Connect API con engagement-attributes
      `/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-attributes?promotionId=${promotionId}`,

      // Variación 2: Sin Connect API, con engagement-attributes
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-attributes?promotionId=${promotionId}`,

      // Variación 3: Con member-engagement-attributes
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/member-engagement-attributes?promotionId=${promotionId}`,

      // Variación 4: Original engagement-trail
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-trail?promotionId=${promotionId}`,

      // Variación 5: Promotions endpoint con member
      `/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/promotions/${promotionId}/members/${encodedMembershipNumber}/engagement`,

      // Variación 6: Connect API + engagement-trail
      `/services/data/${this.apiVersion}/connect/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-trail?promotionId=${promotionId}`
    ];

    // Intentar cada variación hasta que una funcione
    for (let i = 0; i < endpointVariations.length; i++) {
      const endpoint = endpointVariations[i];
      const url = `${instanceUrl}${endpoint}`;

      try {
        console.log(`\n🎯 Intentando variación ${i + 1}/${endpointVariations.length}...`);
        console.log(`🔗 URL: ${url}`);

        const response = await axios.get(url, { headers, timeout: 15000 });

        console.log(`✅ ¡ÉXITO! Variación ${i + 1} funcionó correctamente`);
        console.log(`📋 Respuesta:`, JSON.stringify(response.data, null, 2));

        return response.data;

      } catch (error) {
        console.error(`❌ Variación ${i + 1} falló: ${error.response?.status || error.message}`);
        if (error.response?.status === 404) {
          console.log(`   → Endpoint no existe, probando siguiente...`);
        } else if (error.response) {
          console.error(`   → Status: ${error.response.status}`);
          console.error(`   → Data:`, JSON.stringify(error.response.data, null, 2));
        }
      }
    }

    // Si todas las variaciones fallaron
    console.error(`\n❌ Todas las ${endpointVariations.length} variaciones de endpoint fallaron`);
    return null;
  }

  /**
   * MÉTODO ALTERNATIVO: Query SOQL para obtener datos de promoción y milestones
   * @param {string} salesforceMemberId - ID del LoyaltyProgramMember
   * @param {string} promotionId - ID de la promoción
   * @returns {Promise<Object>} - Datos de la promoción con milestones
   */
  async getPromotionDataViaSOQL(salesforceMemberId, promotionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      // Query 1: Obtener información básica de la promoción
      const promotionQuery = `SELECT Id, Name, StartDate, EndDate
        FROM Promotion
        WHERE Id = '${promotionId}'`;

      console.log('🔍 SOQL Query 1 - Información de la promoción:');
      console.log(promotionQuery);

      const promotionUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(promotionQuery)}`;
      const promotionResponse = await axios.get(promotionUrl, { headers, timeout: 15000 });

      console.log('✅ Query 1 completado');

      // Query 2: Obtener SOLO los engagement attributes asociados a esta promoción específica
      // Usamos PromotionSegmentBuyerGroup para la relación entre Promotion y LoyaltyPgmEngmtAttribute
      const allAttributesQuery = `
        SELECT Id, Name, TargetValue, DefaultValue, Description, Status, StartDate, EndDate
        FROM LoyaltyPgmEngmtAttribute
        WHERE Id IN (
          SELECT LoyaltyPgmEngmtAttributeId
          FROM PromotionSegmentBuyerGroup
          WHERE PromotionId = '${promotionId}'
        )
        ORDER BY Name
      `.trim();

      console.log('🔍 SOQL Query 2 - Todos los engagement attributes de la promoción:');

      const allAttributesUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(allAttributesQuery)}`;
      const allAttributesResponse = await axios.get(allAttributesUrl, { headers, timeout: 15000 });

      console.log(`✅ Query 2 completado - Total attributes: ${allAttributesResponse.data.records.length}`);

      // Query 3: Obtener progreso del miembro en estos attributes
      const memberProgressQuery = `
        SELECT Id, CurrentValue, CumulativeValue, LoyaltyPgmEngmtAttributeId
        FROM LoyaltyPgmMbrAttributeVal
        WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'
      `.trim();

      console.log('🔍 SOQL Query 3 - Progreso del miembro:');

      const memberProgressUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(memberProgressQuery)}`;
      const memberProgressResponse = await axios.get(memberProgressUrl, { headers, timeout: 15000 });

      console.log(`✅ Query 3 completado - Total progress records: ${memberProgressResponse.data.records.length}`);

      // Crear un mapa de progreso del miembro por attributeId
      const progressMap = {};
      memberProgressResponse.data.records.forEach(record => {
        progressMap[record.LoyaltyPgmEngmtAttributeId] = {
          currentValue: parseFloat(record.CurrentValue) || 0,
          cumulativeValue: record.CumulativeValue || 0
        };
      });

      // Mapeo de targets hardcodeados (no disponibles en Salesforce API)
      const targetMap = {
        'Contratación de tarjeta': 1,
        'Contratacion de tarjeta': 1,
        'Compra en Facilitea': 1,
        'Pago con tarjeta': 1,
        'Pago con Bizum': 2,
        'Contratación seguro': 1,
        'Contratacion seguro': 1
      };

      // Combinar todos los attributes con el progreso del miembro
      const milestones = allAttributesResponse.data.records.map(attribute => {
        const progress = progressMap[attribute.Id] || { currentValue: 0, cumulativeValue: 0 };
        const currentValue = progress.currentValue;

        // Limpiar el nombre del attribute (quitar el sufijo técnico)
        const cleanName = attribute.Name.split('__')[0].replace(/_/g, ' ');

        // Obtener target del mapa hardcodeado (fallback a TargetValue de Salesforce si existe)
        const targetValue = attribute.TargetValue
          ? parseFloat(attribute.TargetValue)
          : (targetMap[cleanName] || 1); // Default a 1 si no está en el mapa

        return {
          id: attribute.Id,
          name: cleanName,
          currentValue: currentValue,
          targetValue: targetValue,
          defaultValue: parseFloat(attribute.DefaultValue || 0),
          description: attribute.Description,
          status: attribute.Status,
          startDate: attribute.StartDate,
          endDate: attribute.EndDate,
          completed: currentValue >= targetValue
        };
      });

      console.log(`📊 Total milestones procesados: ${milestones.length}`);
      milestones.forEach(m => {
        console.log(`   - ${m.name}: ${m.currentValue}${m.targetValue ? '/' + m.targetValue : ''} ${m.completed ? '✅' : '⭕'}`);
      });

      // Combinar resultados
      return {
        promotion: promotionResponse.data.records[0] || null,
        milestones: milestones,
        totalQueries: 3
      };

    } catch (error) {
      console.error('❌ Error en queries SOQL:', error.message);
      if (error.response) {
        console.error('📋 Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }
      return null;
    }
  }

  /**
   * Enrolla a un miembro en una promoción
   * @param {string} salesforceMemberId - ID del LoyaltyProgramMember
   * @param {string} promotionId - ID de la promoción
   * @returns {Promise<Object>} - Resultado del enrollment
   */
  async enrollMemberInPromotion(salesforceMemberId, promotionId) {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      // Endpoint para enrollar en promoción
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/PromotionEnrollment`;

      const enrollmentData = {
        LoyaltyProgramMemberId: salesforceMemberId,
        PromotionId: promotionId,
        EnrollmentStatus: 'Enrolled'
      };

      console.log('🎁 Enrollando miembro en promoción...');
      console.log(`🔗 URL: ${url}`);
      console.log(`📋 Data:`, JSON.stringify(enrollmentData, null, 2));

      const response = await axios.post(url, enrollmentData, { headers, timeout: 15000 });

      console.log('✅ Miembro enrollado en promoción correctamente');
      console.log(`🆔 Enrollment ID: ${response.data.id}`);

      return response.data;

    } catch (error) {
      console.error('❌ Error enrollando en promoción:', error.message);
      if (error.response) {
        console.error('📋 Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }

      // No bloquear el flujo si falla el enrollment
      return null;
    }
  }

  /**
   * Sincroniza los puntos de un miembro desde Salesforce hacia la app local
   * @param {Object} member - Objeto del miembro local
   * @param {string} salesforceMemberId - ID del miembro en Salesforce
   * @returns {Promise<Object>} - Miembro actualizado con currencies de Salesforce
   */
  async syncMemberPoints(member, salesforceMemberId) {
    try {
      console.log('🔄 Sincronizando puntos y tier desde Salesforce...');

      const currencies = await this.getMemberCurrencies(salesforceMemberId);

      // Actualizar el miembro local con los valores de Salesforce
      member.levelPoints = currencies.qualifying;
      member.rewardPoints = currencies.nonQualifying;

      // Obtener el tier desde LoyaltyMemberTier usando LoyaltyMemberId
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();
      const tierQuery = `SELECT Id, Name, EffectiveDate FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQuery)}`;

      console.log(`🔍 Obteniendo tier desde LoyaltyMemberTier para member ID: ${salesforceMemberId}`);
      console.log(`🔗 Query: ${tierQuery}`);

      const tierResponse = await axios.get(tierUrl, { headers, timeout: 10000 });

      if (tierResponse.data.records && tierResponse.data.records.length > 0) {
        const tierRecord = tierResponse.data.records[0];
        const sfTierName = tierRecord.Name;
        console.log(`🔍 Tier recibido desde Salesforce: "${sfTierName}" (EffectiveDate: ${tierRecord.EffectiveDate})`);
        console.log(`🔍 Puntos del member: Caixapoints=${member.levelPoints}, Cashback=${member.rewardPoints}`);

        if (sfTierName) {
          // Normalizar tier names de Salesforce a los esperados por la app
          const tierMapping = {
            'Bronze': 'Bronze',
            'Bronce': 'Bronze',
            'Silver': 'Silver',
            'Plata': 'Silver',
            'Gold': 'Gold',
            'Oro': 'Gold',
            'Platinum': 'Platinum',
            'Platino': 'Platinum',
            'Basic': 'Bronze',
            'Plus': 'Silver',
            'Premium': 'Gold',
            'Elite': 'Platinum'
          };
          const normalizedTier = tierMapping[sfTierName] || sfTierName;
          member.tier = normalizedTier;
          console.log(`✅ Tier sincronizado desde Salesforce: "${sfTierName}" → "${member.tier}"`);
        } else {
          console.log(`⚠️ TierGroupName está vacío en LoyaltyMemberTier`);
        }
      } else {
        console.log(`⚠️ No se encontró LoyaltyMemberTier para member ID ${salesforceMemberId}`);
        console.log(`⚠️ Fallback: calculando tier localmente basado en ${member.levelPoints} Caixapoints`);

        // Fallback: calcular tier localmente si no existe en Salesforce
        if (member.levelPoints >= 2000) {
          member.tier = 'Platinum';
        } else if (member.levelPoints >= 1000) {
          member.tier = 'Gold';
        } else if (member.levelPoints >= 500) {
          member.tier = 'Silver';
        } else {
          member.tier = 'Bronze';
        }
        console.log(`✅ Tier calculado localmente: ${member.tier}`);
      }

      console.log('✅ Puntos y tier sincronizados correctamente');
      return member;

    } catch (error) {
      console.error('⚠️ Error sincronizando puntos, usando valores locales:', error.message);
      if (error.response) {
        console.error('📋 Error response status:', error.response.status);
        console.error('📋 Error response data:', JSON.stringify(error.response.data));
      }
      // No bloquear el flujo, usar los valores locales existentes
      return member;
    }
  }

  /**
   * Busca el ID de un TransactionJournalType por nombre
   * Intenta múltiples nombres de objetos posibles
   * @param {string} typeName - Nombre del tipo de journal
   * @returns {Promise<string|null>} - ID del tipo o null si no existe
   */
  async getJournalTypeId(typeName) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const headers = await this.getHeaders();

    // Intentar con diferentes nombres de objetos
    const possibleObjects = [
      'TransactionJournalType',
      'LoyaltyProgramTransactionJournalType',
      'JournalType'
    ];

    for (const objectName of possibleObjects) {
      try {
        const query = `SELECT Id FROM ${objectName} WHERE Name = '${typeName}' LIMIT 1`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

        const response = await axios.get(url, { headers, timeout: 10000 });

        if (response.data.records && response.data.records.length > 0) {
          console.log(`✅ Encontrado ${objectName} con ID: ${response.data.records[0].Id}`);
          return response.data.records[0].Id;
        }
      } catch (error) {
        console.log(`❌ No existe objeto: ${objectName} (intentando siguiente...)`);
        if (error.response?.data) {
          console.log(`   Detalle: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

    console.error(`⚠️ No se encontró JournalType ${typeName} en ningún objeto conocido`);
    return null;
  }

  /**
   * Busca el ID de un TransactionJournalSubtype por nombre
   * Intenta múltiples nombres de objetos posibles
   * @param {string} subtypeName - Nombre del subtipo de journal
   * @returns {Promise<string|null>} - ID del subtipo o null si no existe
   */
  async getJournalSubTypeId(subtypeName) {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const headers = await this.getHeaders();

    // Intentar con diferentes nombres de objetos (sin la 'e' final en Subtype)
    const possibleObjects = [
      'JournalSubType',
      'TransactionJournalSubType',
      'LoyaltyProgramTransactionJournalSubType'
    ];

    for (const objectName of possibleObjects) {
      try {
        const query = `SELECT Id, Name FROM ${objectName} WHERE Name = '${subtypeName}' LIMIT 1`;
        const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

        const response = await axios.get(url, { headers, timeout: 10000 });

        if (response.data.records && response.data.records.length > 0) {
          console.log(`✅ Encontrado ${objectName} '${subtypeName}' con ID: ${response.data.records[0].Id}`);
          return response.data.records[0].Id;
        } else {
          // Si no se encontró por nombre exacto, listar los disponibles
          console.log(`⚠️ No se encontró '${subtypeName}' en ${objectName}, listando disponibles...`);
          const listQuery = `SELECT Id, Name FROM ${objectName} LIMIT 20`;
          const listUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(listQuery)}`;
          const listResponse = await axios.get(listUrl, { headers, timeout: 10000 });

          if (listResponse.data.records && listResponse.data.records.length > 0) {
            console.log(`📋 JournalSubTypes disponibles en ${objectName}:`);
            listResponse.data.records.forEach(record => {
              console.log(`   - ${record.Name} (ID: ${record.Id})`);
            });
          }
        }
      } catch (error) {
        console.log(`❌ No existe objeto: ${objectName} (intentando siguiente...)`);
        if (error.response?.data) {
          console.log(`   Detalle: ${JSON.stringify(error.response.data)}`);
        }
      }
    }

    console.error(`⚠️ No se encontró JournalSubType ${subtypeName} en ningún objeto conocido`);
    return null;
  }

  /**
   * Obtiene el ID del Loyalty Program mediante query SOQL
   * @returns {Promise<string>} - ID del programa de loyalty
   */
  async getLoyaltyProgramId() {
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const headers = await this.getHeaders();

      const query = `SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}' LIMIT 1`;
      const url = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(query)}`;

      const response = await axios.get(url, { headers, timeout: 10000 });

      if (response.data.records && response.data.records.length > 0) {
        const programId = response.data.records[0].Id;
        console.log(`✅ LoyaltyProgram ID encontrado: ${programId}`);
        return programId;
      }

      throw new Error(`No se encontró LoyaltyProgram con nombre: ${this.loyaltyProgramName}`);
    } catch (error) {
      console.error('❌ Error obteniendo LoyaltyProgram ID:', error.message);
      throw error;
    }
  }

  /**
   * Registra una transacción (accrual o redemption) en Salesforce Loyalty Management
   * Usa la API REST estándar de Salesforce para crear objetos TransactionJournal directamente
   * @param {string} loyaltyProgramMemberId - ID del miembro en Salesforce
   * @param {string} transactionType - Tipo: 'Accrual' o 'Redemption'
   * @param {number} pointsChange - Cantidad de puntos (positivo o negativo)
   * @param {string} currencyType - Tipo de currency: 'qualifying' o 'nonQualifying'
   * @param {string} journalTypeName - Nombre del tipo de journal
   * @param {string} journalSubTypeName - Nombre del subtipo de journal
   * @param {string} activityDate - Fecha de la actividad (ISO string)
   * @param {string} journalSubTypeId - (Opcional) ID directo del JournalSubType para evitar búsqueda
   * @param {Object} customFields - (Opcional) Campos personalizados adicionales para el TransactionJournal
   * @returns {Promise<Object>} - Respuesta de Salesforce
   */
  async processTransaction(loyaltyProgramMemberId, transactionType, pointsChange, currencyType, journalTypeName, journalSubTypeName, activityDate, journalSubTypeId = null, customFields = {}) {
    try {
      if (!loyaltyProgramMemberId) {
        throw new Error('Se requiere el ID del miembro de loyalty');
      }

      console.log(`📝 Registrando ${transactionType} en Salesforce usando API REST estándar...`);

      // Buscar los IDs necesarios: LoyaltyProgram, JournalType y JournalSubType
      console.log(`🔍 Obteniendo IDs necesarios para TransactionJournal...`);
      const loyaltyProgramId = await this.getLoyaltyProgramId();
      const journalTypeId = await this.getJournalTypeId(journalTypeName);

      // Si se proporcionó el ID directamente, usarlo; si no, buscarlo
      let finalJournalSubTypeId = journalSubTypeId;
      if (!finalJournalSubTypeId) {
        console.log(`🔍 ID de JournalSubType no proporcionado, buscando por nombre: ${journalSubTypeName}`);
        finalJournalSubTypeId = await this.getJournalSubTypeId(journalSubTypeName);
      } else {
        console.log(`✅ Usando JournalSubType ID proporcionado directamente: ${finalJournalSubTypeId}`);
      }

      if (!loyaltyProgramId) {
        throw new Error(`No se encontró LoyaltyProgram: ${this.loyaltyProgramName}`);
      }
      if (!journalTypeId) {
        throw new Error(`No se encontró JournalType: ${journalTypeName}`);
      }
      if (!finalJournalSubTypeId) {
        throw new Error(`No se encontró JournalSubType: ${journalSubTypeName}`);
      }

      console.log(`✅ IDs obtenidos - Program: ${loyaltyProgramId}, JournalType: ${journalTypeId}, JournalSubType: ${finalJournalSubTypeId}`);

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      console.log(`🔗 URL: ${url}`);

      // Construir el payload usando los IDs de las relaciones
      // Campos correctos según la documentación oficial de Salesforce Loyalty Management
      // Los puntos NO van aquí - Salesforce los calcula internamente mediante procesos
      const payload = {
        ActivityDate: activityDate,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: finalJournalSubTypeId,
        LoyaltyProgramId: loyaltyProgramId,
        MemberId: loyaltyProgramMemberId,
        TransactionAmount: Math.abs(pointsChange),
        Status: 'Pending',
        ...customFields  // Agregar campos personalizados si se proporcionan
      };

      console.log('📤 Payload:', JSON.stringify(payload, null, 2));

      const headers = await this.getHeaders();

      const response = await Promise.race([
        axios.post(url, payload, { headers, timeout: 20000 }),
        this._createTimeoutPromise(20000, 'Timeout registrando transacción')
      ]);

      console.log(`✅ ${transactionType} registrado correctamente en Salesforce`);
      console.log(`🆔 TransactionJournal ID: ${response.data.id}`);
      return response.data;

    } catch (error) {
      console.error(`❌ Error al registrar ${transactionType}:`, error.message);

      if (error.response) {
        console.error('📋 Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }

      if (error.message.includes('Timeout')) {
        console.error('⏰ Timeout registrando transacción - la transacción puede haberse procesado');
      }

      // No lanzar error para no bloquear el flujo de la app
      // La transacción local ya se ha realizado
      console.warn('⚠️ Continuando sin registrar en Salesforce');
      return null;
    }
  }

  /**
   * Obtiene los headers necesarios para las peticiones a la API
   * @returns {Promise<Object>} Headers para las peticiones
   */
  async getHeaders() {
    const accessToken = await salesforceAuth.getAccessToken();
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    };
  }
}

module.exports = new SalesforceLoyalty();