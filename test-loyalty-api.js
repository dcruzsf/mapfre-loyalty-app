/**
 * test-loyalty-api-v2.js
 * 
 * Herramienta actualizada para probar la conexión con la API de Salesforce Loyalty Management
 * usando el endpoint correcto identificado en Postman
 * 
 * Uso:
 * node test-loyalty-api-v2.js
 */

require('dotenv').config();
const axios = require('axios');
const querystring = require('querystring');

// Función principal
async function testLoyaltyAPI() {
  console.log('=== TEST DE CONEXIÓN A SALESFORCE LOYALTY API (V2) ===\n');
  
  try {
    // Paso 1: Verificar variables de entorno
    console.log('1. Verificando variables de entorno...');
    
    const requiredVars = [
      'SF_CLIENT_ID', 
      'SF_CLIENT_SECRET', 
      'SF_USERNAME', 
      'SF_PASSWORD',
      'SF_LOYALTY_PROGRAM_NAME'
    ];
    
    let missingVars = [];
    requiredVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    });
    
    if (missingVars.length > 0) {
      console.error(`ADVERTENCIA: Faltan las siguientes variables de entorno: ${missingVars.join(', ')}`);
      console.error('Asegúrate de tener un archivo .env correctamente configurado');
    } else {
      console.log('✓ Todas las variables de entorno necesarias están configuradas');
    }
    
    // Paso 2: Obtener token de acceso
    console.log('\n2. Obteniendo token de acceso...');
    
    const loginUrl = process.env.SF_LOGIN_URL || 'https://login.salesforce.com';
    const tokenUrl = `${loginUrl}/services/oauth2/token`;
    
    const tokenData = querystring.stringify({
      grant_type: 'password',
      client_id: process.env.SF_CLIENT_ID,
      client_secret: process.env.SF_CLIENT_SECRET,
      username: process.env.SF_USERNAME,
      password: process.env.SF_PASSWORD
    });
    
    const tokenResponse = await axios.post(tokenUrl, tokenData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    const { access_token, instance_url } = tokenResponse.data;
    
    console.log('✓ Token de acceso obtenido correctamente');
    console.log(`- Instance URL: ${instance_url}`);

    // Paso 3: Probar el endpoint correcto identificado en Postman
    console.log('\n3. Probando endpoint correcto identificado en Postman...');
    
    const apiVersion = process.env.SF_API_VERSION || 'v61.0';
    const programName = process.env.SF_LOYALTY_PROGRAM_NAME;
    
    const enrollmentUrl = `${instance_url}/services/data/${apiVersion}/loyalty-programs/${programName}/individual-member-enrollments`;
    
    console.log(`URL: ${enrollmentUrl}`);
    
    const headers = {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    };
    
    // Crear payload para probar la creación de un miembro
    const memberPayload = {
      enrollmentDate: new Date().toISOString(),
      membershipNumber: `TestMember-${Date.now()}`,
      associatedContactDetails: {
        firstName: "Usuario",
        lastName: "Prueba",
        email: `test_${Date.now()}@example.com`,
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
    
    try {
      const createResponse = await axios.post(enrollmentUrl, memberPayload, { headers });
      console.log('✓ Miembro de prueba creado correctamente!');
      console.log(`- Respuesta:`, createResponse.data);
      console.log('\n¡TODO ESTÁ LISTO PARA USAR LA API DE LOYALTY MANAGEMENT!');
      console.log('Tu configuración actual es correcta. No necesitas hacer más cambios.');
    } catch (createError) {
      console.log('✗ Error al crear miembro de prueba:');
      console.log(`- Status: ${createError.response?.status}`);
      console.log(`- Mensaje: ${createError.response?.statusText}`);
      
      if (createError.response?.data) {
        console.log('- Detalles:');
        console.log(JSON.stringify(createError.response.data, null, 2));
      }
      
      console.log('\nPosibles soluciones:');
      console.log('1. Verifica que el nombre del programa de loyalty sea correcto');
      console.log('2. Confirma que tienes todos los permisos necesarios');
      console.log('3. Asegúrate de que la URL del login (SF_LOGIN_URL) sea correcta');
      console.log('4. Si usas un dominio personalizado, asegúrate de incluirlo completo');
    }
  } catch (error) {
    console.error('\n✗ ERROR DURANTE LA PRUEBA:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Detalles del error:');
      console.error('- Status:', error.response.status);
      console.error('- Mensaje:', error.response.statusText);
      console.error('- Datos:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Ejecutar prueba
testLoyaltyAPI().catch(error => {
  console.error('Error en la ejecución del test:', error);
});