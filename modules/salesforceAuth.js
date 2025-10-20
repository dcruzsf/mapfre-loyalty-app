// modules/salesforceAuth.js
const axios = require('axios');
const querystring = require('querystring');

class SalesforceAuth {
  constructor() {
    this.accessToken = null;
    this.instanceUrl = null;
  }

  /**
   * Obtiene un token de acceso usando client_credentials
   */
  async getAccessToken() {
    try {
      const clientId = process.env.SF_CLIENT_ID;
      const clientSecret = process.env.SF_CLIENT_SECRET;
      const instanceUrl = process.env.SF_INSTANCE; // ← aquí tu dominio, ej: https://mi-org-dev-ed.my.salesforce.com

      if (!clientId || !clientSecret || !instanceUrl) {
        throw new Error('Faltan variables de entorno SF_CLIENT_ID, SF_CLIENT_SECRET o SF_INSTANCE');
      }

      const data = querystring.stringify({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
        // ⚠️ NO incluir scope
      });

      console.log('🔐 Solicitando token con client_credentials...');

      const response = await axios.post(`${instanceUrl}/services/oauth2/token`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url || instanceUrl;

      console.log('✅ Token obtenido correctamente');
      console.log(`🌐 Instance URL: ${this.instanceUrl}`);

      return this.accessToken;
    } catch (error) {
      console.error('❌ Error al obtener token con client_credentials:');
      if (error.response) {
        console.error('- Status:', error.response.status);
        console.error('- Datos:', error.response.data);
      } else {
        console.error('- Mensaje:', error.message);
      }

      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }

  async getInstanceUrl() {
    if (!this.instanceUrl) {
      await this.getAccessToken();
    }
    return this.instanceUrl;
  }
}

module.exports = new SalesforceAuth();