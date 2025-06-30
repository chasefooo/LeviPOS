// routes/squareLocations.js

const { Client, Environment } = require('square');

// Reuse your global CORS headers
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

// Initialize Square client once
const squareClient = new Client({
    environment: Environment.Production,
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
});
const locationsApi = squareClient.locationsApi;

exports.handler = async (event) => {
    console.log('TRACE squareLocations.handler:', event.httpMethod, 'proxy:', event.pathParameters?.proxy);

    // Preflight
    if (event.httpMethod === 'OPTIONS') {
        return attachCORS({ statusCode: 200, body: '' });
    }

    // Only allow GET here
    if (event.httpMethod !== 'GET') {
        return attachCORS({
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        });
    }

    try {
        const resp = await locationsApi.listLocations();
        const list = resp.result.locations || [];
        console.log(`Square returned ${list.length} locations`);
        return attachCORS({
            statusCode: 200,
            body: JSON.stringify(list),
        });
    } catch (err) {
        console.error('ERROR in squareLocations.handler:', err);
        return attachCORS({
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        });
    }
};