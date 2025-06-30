// routes/squareDevices.js
const { Client, Environment } = require('square');
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET',
};
function attachCORS(response) {
  response.headers = { ...corsHeaders, ...(response.headers || {}) };
  return response;
}
const client = new Client({ environment: Environment.Production,
    accessToken: process.env.SQUARE_ACCESS_TOKEN });
const devicesApi = client.devicesApi;

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') {
      return attachCORS({ statusCode: 200, body: '' });
    }
    try {
        const resp = await devicesApi.listDevices();
        return attachCORS({ statusCode: 200, body: JSON.stringify(resp.result.devices) });
    } catch (err) {
        return attachCORS({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    }
};