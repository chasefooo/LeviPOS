// routes/squareDevices.js
const { SquareClient, SquareEnvironment, SquareError } = require('square');
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
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});

exports.handler = async (event) => {
  console.info('squareDevices.handler ▶ entry', {
    httpMethod: event.httpMethod,
    fullPath: event.path,
    proxy: event.pathParameters?.proxy,
    tokenLoaded: !!process.env.SQUARE_ACCESS_TOKEN,
  });

  if (event.httpMethod === 'OPTIONS') {
    return attachCORS({ statusCode: 200, body: '' });
  }

  if (event.httpMethod !== 'GET') {
    console.warn('squareDevices.handler ◀ bad method', event.httpMethod);
    return attachCORS({
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    });
  }

  try {
    console.info('squareDevices.handler ▶ calling client.devices.list()');
    const listResponse = await client.devices.list();
    console.info('squareDevices.handler ▶ Square SDK raw response:', listResponse);
    // Square SDK returns a Pageable object; devices may be under response.devices or data array
    const devices =
      (Array.isArray(listResponse.response?.devices) && listResponse.response.devices) ||
      (Array.isArray(listResponse.data) && listResponse.data) ||
      [];
    console.info(`squareDevices.handler ◀ returning ${devices.length} devices`);
    return attachCORS({
      statusCode: 200,
      body: JSON.stringify(devices),
    });
  } catch (err) {
    console.error('squareDevices.handler ✖ ERROR', err.stack || err);
    if (err instanceof SquareError && err.errors) {
      console.error('SquareError details:', err.errors);
      return attachCORS({
        statusCode: 502,
        body: JSON.stringify({ errors: err.errors }),
      });
    }
    return attachCORS({
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Unknown error' }),
    });
  }
};