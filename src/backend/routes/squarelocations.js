// routes/squareLocations.js

// Support both CommonJS default and named exports
const { SquareClient, SquareEnvironment, SquareError } = require('square');

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
const client = new SquareClient({
    token: process.env.SQUARE_ACCESS_TOKEN,
    environment: SquareEnvironment.Production,
});

exports.handler = async (event) => {
    // 1) Log entry + critical context
    console.log('squareLocations.handler ▶ entry', {
        httpMethod: event.httpMethod,
        fullPath: event.path,
        proxy: event.pathParameters?.proxy,
        tokenLoaded: !!process.env.SQUARE_ACCESS_TOKEN,
    });

    // 2) Handle preflight right away
    if (event.httpMethod === 'OPTIONS') {
        console.log('squareLocations.handler ◀ preflight');
        return attachCORS({ statusCode: 200, body: '' });
    }

    if (event.httpMethod !== 'GET') {
        console.warn('squareLocations.handler ◀ bad method', event.httpMethod);
        return attachCORS({
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        });
    }

    try {
        // 3) Log before calling Square
        console.log('squareLocations.handler ▶ calling client.locations.list()');
        const listResponse = await client.locations.list();

        // 4) Log the raw SDK response
        console.log('squareLocations.handler ▶ Square SDK response:', listResponse);

        const locations = listResponse.locations || [];
        console.log(`squareLocations.handler ◀ returning ${locations.length} locations`);

        return attachCORS({
            statusCode: 200,
            body: JSON.stringify(locations),
        });

    } catch (err) {
        // 5) Detailed error logging
        console.error('squareLocations.handler ✖ ERROR', err.stack || err);
        if (err instanceof SquareError && err.errors) {
          console.error('SquareError details:', err.errors);
        }
        return attachCORS({
            statusCode: 500,
            body: JSON.stringify({ error: err.message || 'Unknown error' }),
        });
    }
};