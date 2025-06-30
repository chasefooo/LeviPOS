// routes/squareDevices.js
const { Client, Environment } = require('@square/square');
const client = new Client({ environment: Environment.Production,
    accessToken: process.env.SQUARE_ACCESS_TOKEN });
const devicesApi = client.devicesApi;

exports.handler = async (event) => {
    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: corsHeaders };
    try {
        const resp = await devicesApi.listDevices();
        return attachCORS({ statusCode: 200, body: JSON.stringify(resp.result.devices) });
    } catch (err) {
        return attachCORS({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    }
};