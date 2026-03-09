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

  // Función crítica para obtener los IDs que Salesforce necesita
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
      
      // Consultamos Tréboles y Puntos Nivel
      const q = `SELECT Name, PointsBalance FROM LoyaltyMemberCurrency WHERE LoyaltyMemberId = '${salesforceMemberId}'`;
      const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`, { headers });
      
      if (res.data.records) {
          res.data.records.forEach(c => {
             // Sincronización de Tréboles (Moneda de Recompensa)
             if (c.Name === 'Tréboles') {
                 member.rewardPoints = c.PointsBalance;
             } 
             // Sincronización de Puntos Nivel (Cualificables)
             if (c.Name === 'Puntos_Nivel' || c.Name.toLowerCase().includes('qualifying')) {
                 member.levelPoints = c.PointsBalance;
             }
          });
      }

      // Sincronización de Categoría (Tier)
      const tierQ = `SELECT Name FROM LoyaltyMemberTier WHERE LoyaltyMemberId = '${salesforceMemberId}' ORDER BY EffectiveDate DESC LIMIT 1`;
      const tierRes = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(tierQ)}`, { headers });
      if (tierRes.data.records?.length > 0) {
          member.tier = tierRes.data.records[0].Name;
      }

      return member;
    } catch (error) { return member; }
  }

  // 2. TRANSACCIONES (PROCESO CORREGIDO)
  async processTransaction(memberId, type, points, currency, jType, jSubType, date) {
    try {
      console.log(`🍀 Club MAPFRE: Procesando ${points} Tréboles...`);
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      // Buscamos los IDs dinámicamente como en el ejemplo que funciona
      const programId = await this.getIdByQuery(`SELECT Id FROM LoyaltyProgram WHERE Name = '${this.loyaltyProgramName}'`);
      
      // Intentamos buscar el ID del tipo de diario (Accrual)
      let journalTypeId = await this.getIdByQuery(`SELECT Id FROM TransactionJournalType WHERE Name = '${jType || 'Accrual'}'`);
      
      // Buscamos el ID del subtipo (Ej: 'Compra' o 'Purchase')
      // Si el subtipo enviado no existe, intentamos con uno genérico 'Accrual'
      let finalSubTypeId = await this.getIdByQuery(`SELECT Id FROM JournalSubType WHERE Name = '${jSubType}'`) 
                         || await this.getIdByQuery(`SELECT Id FROM JournalSubType WHERE Name = 'Accrual'`);

      if (!programId || !journalTypeId) {
        console.error('❌ No se encontraron los metadatos necesarios en SF (ProgramId o JournalTypeId)');
        return null;
      }

      const payload = {
        ActivityDate: date || new Date().toISOString(),
        LoyaltyProgramId: programId,
        MemberId: memberId,
        JournalTypeId: journalTypeId,
        JournalSubTypeId: finalSubTypeId, // Si es null, Salesforce podría dar error 400
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

  // 3. FUNCIONES DE COMPATIBILIDAD PARA EL DASHBOARD
  async getMemberTransactions(identifier, limit = 10) {
    try {
      if (!identifier || !identifier.startsWith('0lM')) return [];
      const instanceUrl = await this.getInstanceUrl();
      const headers = await this.getHeaders();

      const q = `SELECT Id, ActivityDate, TransactionAmount, Status, JournalSubType.Name 
                 FROM TransactionJournal WHERE MemberId = '${identifier}' 
                 ORDER BY ActivityDate DESC LIMIT ${limit}`;
      const res = await axios.get(`${instanceUrl}/services/data/${this.apiVersion}/query?q=${encodeURIComponent(q)}`, { headers });

      return (res.data.records || []).map(tx => ({
        id: tx.Id,
        date: new Date(tx.ActivityDate).toLocaleDateString('es-ES'),
        description: tx.JournalSubType ? tx.JournalSubType.Name : 'Compra Club MAPFRE',
        amount: Math.abs(tx.TransactionAmount),
        isNegative: tx.TransactionAmount < 0,
        status: tx.Status
      }));
    } catch (e) { return []; }
  }

  async getMemberBadges() { return []; }
}

module.exports = new SalesforceLoyalty();