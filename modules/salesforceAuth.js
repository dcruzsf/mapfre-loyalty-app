// modules/salesforceAuth.js
const axios = require('axios');
const querystring = require('querystring');

class SalesforceAuth {
  constructor() {
    this.accessToken = null;
    this.instanceUrl = null;
  }

  /**
   * Obtiene un token de acceso usando OAuth 2.0 username-password flow
   */
  async getAccessToken() {
    try {
      const clientId = process.env.SF_CLIENT_ID;
      const clientSecret = process.env.SF_CLIENT_SECRET;
      const username = process.env.SF_USERNAME;
      const password = process.env.SF_PASSWORD;
      const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

      if (!clientId || !clientSecret || !username || !password) {
        throw new Error('Faltan credenciales de Salesforce en las variables de entorno');
      }

      const data = querystring.stringify({
        grant_type: 'password',
        client_id: clientId,
        client_secret: clientSecret,
        username: username,
        password: password
      });

      console.log('🔐 Solicitando token de acceso a Salesforce con username-password flow...');

      const response = await axios.post(`${loginUrl}/services/oauth2/token`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      this.instanceUrl = response.data.instance_url;

      console.log('✅ Token de Salesforce obtenido correctamente');
      console.log(`🌐 Instance URL: ${this.instanceUrl}`);

      return this.accessToken;
    } catch (error) {
      console.error('❌ Error al obtener token de Salesforce:');
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