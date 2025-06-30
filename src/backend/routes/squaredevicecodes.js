const crypto = require('crypto');
const { Client } = require('square');

// CORS helper (same as your other square routes)
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
};
function attachCORS(response) {
  response.headers = { ...corsHeaders, ...(response.headers || {}) };
  return response;
}

const client = new Client({
  environment: 'Production',
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});
const terminalApi = client.terminalApi;

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders };
    const { locationId, name } = JSON.parse(event.body);
    try {
        const resp = await terminalApi.createDeviceCode({
            idempotencyKey: crypto.randomUUID(),
            locationId,
            deviceCodeName: name,
        });
        return attachCORS({
            statusCode: 201,
            body: JSON.stringify(resp.result.deviceCode),
        });
    } catch (err) {
        return attachCORS({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    }
};