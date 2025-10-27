const express = require('express');
const router = express.Router();
const salesforceAuth = require('../modules/salesforceAuth');
const axios = require('axios');

// Ruta temporal para describir objeto LoyaltyPgmMbrAttributeVal
router.get('/describe-attribute', async (req, res) => {
  try {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const token = await salesforceAuth.getAccessToken();

    const url = `${instanceUrl}/services/data/v61.0/sobjects/LoyaltyPgmMbrAttributeVal/describe`;

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // Extraer solo los campos relevantes
    const fields = response.data.fields.map(f => ({
      name: f.name,
      label: f.label,
      type: f.type,
      referenceTo: f.referenceTo
    }));

    res.json({
      objectName: response.data.name,
      label: response.data.label,
      totalFields: fields.length,
      fields: fields
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Ruta temporal para query completo del atributo
router.get('/query-attribute/:id', async (req, res) => {
  try {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const token = await salesforceAuth.getAccessToken();

    // Primero obtener los campos disponibles
    const describeUrl = `${instanceUrl}/services/data/v61.0/sobjects/LoyaltyPgmMbrAttributeVal/describe`;
    const describeResponse = await axios.get(describeUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // Construir query con TODOS los campos
    const fieldNames = describeResponse.data.fields
      .map(f => f.name)
      .filter(name => !name.includes('.')) // Excluir campos de relación
      .join(', ');

    const query = `SELECT ${fieldNames} FROM LoyaltyPgmMbrAttributeVal WHERE Id = '${req.params.id}'`;

    console.log('🔍 Query completa:', query);

    const queryUrl = `${instanceUrl}/services/data/v61.0/query?q=${encodeURIComponent(query)}`;
    const queryResponse = await axios.get(queryUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    res.json({
      query: query,
      result: queryResponse.data
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Ruta temporal para query de engagement attribute (el milestone)
router.get('/query-engagement-attribute/:id', async (req, res) => {
  try {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const token = await salesforceAuth.getAccessToken();

    // Primero obtener los campos disponibles
    const describeUrl = `${instanceUrl}/services/data/v61.0/sobjects/LoyaltyPgmEngmtAttribute/describe`;
    const describeResponse = await axios.get(describeUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // Construir query con TODOS los campos
    const fieldNames = describeResponse.data.fields
      .map(f => f.name)
      .filter(name => !name.includes('.')) // Excluir campos de relación
      .join(', ');

    const query = `SELECT ${fieldNames} FROM LoyaltyPgmEngmtAttribute WHERE Id = '${req.params.id}'`;

    console.log('🔍 Query completa:', query);

    const queryUrl = `${instanceUrl}/services/data/v61.0/query?q=${encodeURIComponent(query)}`;
    const queryResponse = await axios.get(queryUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    res.json({
      query: query,
      result: queryResponse.data
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

// Ruta para query completo de milestones de una promoción
router.get('/query-promotion-milestones/:memberId/:promotionId', async (req, res) => {
  try {
    const instanceUrl = await salesforceAuth.getInstanceUrl();
    const token = await salesforceAuth.getAccessToken();

    // Query completo con JOIN
    const query = `
      SELECT Id, Name, CurrentValue, CumulativeValue, StartDate, EndDate,
             LoyaltyPgmEngmtAttributeId,
             LoyaltyPgmEngmtAttribute.Name,
             LoyaltyPgmEngmtAttribute.TargetValue,
             LoyaltyPgmEngmtAttribute.Description,
             LoyaltyPgmEngmtAttribute.AttributeStatus,
             LoyaltyPgmEngmtAttribute.PromotionId
      FROM LoyaltyPgmMbrAttributeVal
      WHERE LoyaltyProgramMemberId = '${req.params.memberId}'
      AND LoyaltyPgmEngmtAttribute.PromotionId = '${req.params.promotionId}'
    `;

    console.log('🔍 Query con JOIN:', query);

    const queryUrl = `${instanceUrl}/services/data/v61.0/query?q=${encodeURIComponent(query)}`;
    const queryResponse = await axios.get(queryUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    res.json({
      query: query,
      result: queryResponse.data
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.response?.data
    });
  }
});

module.exports = router;
