// test-sf-auth.js - Script para probar autenticación con Salesforce
const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

async function testAuth() {
  try {
    const clientId = process.env.SF_CLIENT_ID;
    const clientSecret = process.env.SF_CLIENT_SECRET;
    const username = process.env.SF_USERNAME;
    const password = process.env.SF_PASSWORD;
    const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';

    console.log('🔐 Probando autenticación con Salesforce...');
    console.log('Usuario:', username);
    console.log('Password length:', password?.length);
    console.log('Login URL:', loginUrl);
    console.log('Client ID:', clientId?.substring(0, 20) + '...');

    const data = querystring.stringify({
      grant_type: 'password',
      client_id: clientId,
      client_secret: clientSecret,
      username: username,
      password: password
    });

    const response = await axios.post(`${loginUrl}/services/oauth2/token`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('✅ Autenticación exitosa!');
    console.log('Access Token:', response.data.access_token.substring(0, 20) + '...');
    console.log('Instance URL:', response.data.instance_url);
  } catch (error) {
    console.error('❌ Error de autenticación:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Datos:', error.response.data);
    } else {
      console.error('Mensaje:', error.message);
    }
  }
}

testAuth();
