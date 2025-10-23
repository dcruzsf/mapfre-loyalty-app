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
   * @param {string} loyaltyProgramMemberId - ID del miembro en Salesforce
   * @returns {Promise<Object>} - Objeto con currencies { qualifying: number, nonQualifying: number }
   */
  async getMemberCurrencies(loyaltyProgramMemberId) {
    try {
      if (!loyaltyProgramMemberId) {
        throw new Error('Se requiere el ID del miembro de loyalty');
      }

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const encodedProgramName = encodeURIComponent(this.loyaltyProgramName);
      const url = `${instanceUrl}/services/data/${this.apiVersion}/loyalty-programs/${encodedProgramName}/program-members/${loyaltyProgramMemberId}/member-currencies`;

      console.log('💰 Obteniendo currencies del miembro desde Salesforce...');
      console.log(`🔗 URL: ${url}`);

      const headers = await this.getHeaders();

      const response = await Promise.race([
        axios.get(url, { headers, timeout: 15000 }),
        this._createTimeoutPromise(15000, 'Timeout obteniendo currencies')
      ]);

      console.log('✅ Currencies obtenidas correctamente');

      // Procesar las currencies de la respuesta
      const currencies = response.data.currencyBalances || [];
      const result = {
        qualifying: 0,
        nonQualifying: 0
      };

      // Mapear las currencies según sus nombres configurados
      const qualifyingName = process.env.SF_CURRENCY_QUALIFYING_NAME || 'Caixapoints';
      const nonQualifyingName = process.env.SF_CURRENCY_NONQUALIFYING_NAME || 'Cashback';

      currencies.forEach(currency => {
        if (currency.loyaltyMemberCurrencyName === qualifyingName) {
          result.qualifying = currency.totalPoints || 0;
        } else if (currency.loyaltyMemberCurrencyName === nonQualifyingName) {
          result.nonQualifying = currency.totalPoints || 0;
        }
      });

      console.log(`💰 Currencies: ${qualifyingName}=${result.qualifying}, ${nonQualifyingName}=${result.nonQualifying}`);
      return result;

    } catch (error) {
      console.error('❌ Error al obtener currencies:', error.message);

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

      // Buscar los IDs de JournalType y JournalSubType
      console.log(`🔍 Buscando IDs de JournalType: ${journalTypeName} y JournalSubType: ${journalSubTypeName}...`);
      const journalTypeId = await this.getJournalTypeId(journalTypeName);
      const journalSubTypeId = await this.getJournalSubTypeId(journalSubTypeName);

      if (!journalTypeId) {
        throw new Error(`No se encontró TransactionJournalType con nombre: ${journalTypeName}`);
      }
      if (!journalSubTypeId) {
        throw new Error(`No se encontró TransactionJournalSubtype con nombre: ${journalSubTypeName}`);
      }

      console.log(`✅ JournalType ID: ${journalTypeId}, JournalSubType ID: ${journalSubTypeId}`);

      const instanceUrl = await salesforceAuth.getInstanceUrl();
      const url = `${instanceUrl}/services/data/${this.apiVersion}/sobjects/TransactionJournal`;
      console.log(`🔗 URL: ${url}`);

      // Determinar el nombre de la currency según el tipo
      const currencyName = currencyType === 'qualifying'
        ? (process.env.SF_CURRENCY_QUALIFYING_NAME || 'Caixapoints')
        : (process.env.SF_CURRENCY_NONQUALIFYING_NAME || 'Cashback');

      // Construir el payload usando los IDs de las relaciones
      const payload = {
        ActivityDate: activityDate,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: journalSubTypeId,
        LoyaltyProgramMemberId: loyaltyProgramMemberId,
        MemberCurrency: currencyName,
        Points: pointsChange,
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