// routes/squareDeviceCodes.js
const { Client, Environment } = require('square');
const client = new Client({ environment: Environment.Production,
    accessToken: process.env.SQUARE_ACCESS_TOKEN });
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