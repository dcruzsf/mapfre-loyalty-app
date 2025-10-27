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
    try {
      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const encodedMembershipNumber = encodeURIComponent(membershipNumber);

      // API para obtener engagement trail con promotionId como query param
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty/programs/${encodedProgramName}/members/${encodedMembershipNumber}/engagement-trail?promotionId=${promotionId}`;

      console.log('🎯 Obteniendo engagement trail...');
      console.log(`🔗 URL: ${url}`);

      const headers = await this.getHeaders();

      const response = await axios.get(url, { headers, timeout: 15000 });

      console.log('✅ Engagement trail obtenido correctamente');

      return response.data;

    } catch (error) {
      console.error(`❌ Error obteniendo engagement trail para promoción ${promotionId}:`, error.message);
      if (error.response) {
        console.error('📋 Detalles del error:');
        console.error('- Status:', error.response.status);
        console.error('- Data:', JSON.stringify(error.response.data, null, 2));
      }

      // Si falla, devolver null
      return null;
    }
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
      console.log('📋 Resultado:', JSON.stringify(promotionResponse.data, null, 2));

      // Query 2: Obtener enrollment del miembro en la promoción
      const enrollmentQuery = `SELECT Id, PromotionId, LoyaltyProgramMemberId, EnrollmentStatus, EnrollmentDate
        FROM PromotionEnrollment
        WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'
        AND PromotionId = '${promotionId}'`;

      console.log('🔍 SOQL Query 2 - Enrollment del miembro:');
      console.log(enrollmentQuery);

      const enrollmentUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(enrollmentQuery)}`;
      const enrollmentResponse = await axios.get(enrollmentUrl, { headers, timeout: 15000 });

      console.log('✅ Query 2 completado');
      console.log('📋 Resultado:', JSON.stringify(enrollmentResponse.data, null, 2));

      // Query 3: Obtener atributos/milestones del miembro para esta promoción
      const attributesQuery = `SELECT Id, AttributeName, AttributeValue, LastModifiedDate
        FROM LoyaltyPgmMbrAttributeVal
        WHERE LoyaltyProgramMemberId = '${salesforceMemberId}'`;

      console.log('🔍 SOQL Query 3 - Atributos del miembro (milestones):');
      console.log(attributesQuery);

      const attributesUrl = `${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(attributesQuery)}`;
      const attributesResponse = await axios.get(attributesUrl, { headers, timeout: 15000 });

      console.log('✅ Query 3 completado');
      console.log('📋 Resultado:', JSON.stringify(attributesResponse.data, null, 2));

      // Combinar resultados
      return {
        promotion: promotionResponse.data.records[0] || null,
        enrollment: enrollmentResponse.data.records[0] || null,
        attributes: attributesResponse.data.records || [],
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
      console.log('🔄 Sincronizando puntos desde Salesforce...');

      const currencies = await this.getMemberCurrencies(salesforceMemberId);

      // Actualizar el miembro local con los valores de Salesforce
      member.levelPoints = currencies.qualifying;
      member.rewardPoints = currencies.nonQualifying;

      console.log('✅ Puntos sincronizados correctamente');
      return member;

    } catch (error) {
      console.error('⚠️ Error sincronizando puntos, usando valores locales:', error.message);
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

    // Intentar con diferentes nombres de objetos
    const possibleObjects = [
      'TransactionJournalSubtype',
      'LoyaltyProgramTransactionJournalSubtype',
      'JournalSubtype'
    ];

    for (const objectName of possibleObjects) {
      try {
        const query = `SELECT Id FROM ${objectName} WHERE Name = '${subtypeName}' LIMIT 1`;
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
   * @returns {Promise<Object>} - Respuesta de Salesforce
   */
  async processTransaction(loyaltyProgramMemberId, transactionType, pointsChange, currencyType, journalTypeName, journalSubTypeName, activityDate) {
    try {
      if (!loyaltyProgramMemberId) {
        throw new Error('Se requiere el ID del miembro de loyalty');
      }

      console.log(`📝 Registrando ${transactionType} en Salesforce usando API REST estándar...`);

      // Buscar los IDs necesarios: LoyaltyProgram, JournalType y JournalSubType
      console.log(`🔍 Obteniendo IDs necesarios para TransactionJournal...`);
      const loyaltyProgramId = await this.getLoyaltyProgramId();
      const journalTypeId = await this.getJournalTypeId(journalTypeName);
      const journalSubTypeId = await this.getJournalSubTypeId(journalSubTypeName);

      if (!loyaltyProgramId) {
        throw new Error(`No se encontró LoyaltyProgram: ${this.loyaltyProgramName}`);
      }
      if (!journalTypeId) {
        throw new Error(`No se encontró JournalType: ${journalTypeName}`);
      }
      if (!journalSubTypeId) {
        throw new Error(`No se encontró JournalSubType: ${journalSubTypeName}`);
      }

      console.log(`✅ IDs obtenidos - Program: ${loyaltyProgramId}, JournalType: ${journalTypeId}, JournalSubType: ${journalSubTypeId}`);

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      console.log(`🔗 URL: ${url}`);

      // Construir el payload usando los IDs de las relaciones
      // Campos correctos según la documentación oficial de Salesforce Loyalty Management
      // Los puntos NO van aquí - Salesforce los calcula internamente mediante procesos
      const payload = {
        ActivityDate: activityDate,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: journalSubTypeId,
        LoyaltyProgramId: loyaltyProgramId,
        MemberId: loyaltyProgramMemberId,
        TransactionAmount: Math.abs(pointsChange),
        Status: 'Pending'
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