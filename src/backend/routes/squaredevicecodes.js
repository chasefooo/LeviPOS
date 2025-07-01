const crypto = require('crypto');
const { SquareClient, SquareEnvironment, SquareError } = require('square');

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

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Production,
});
// Use the Device Codes API group for device-code operations
const deviceCodesApi = client.devices.codes;

exports.handler = async (event) => {
  console.log('squareDeviceCodes.handler ▶ entry', {
    method: event.httpMethod,
    path: event.path,
    proxy: event.pathParameters?.proxy,
  });

  if (event.httpMethod === 'OPTIONS') {
    console.log('squareDeviceCodes.handler ◀ preflight');
    return attachCORS({ statusCode: 200, body: '' });
  }

  // Parse request body, with double-encoding fallback
  let data = JSON.parse(event.body);
  if (typeof data === 'string') data = JSON.parse(data);
  console.log('squareDeviceCodes.handler ▶ raw event.body:', event.body);
  console.log('squareDeviceCodes.handler ▶ parsed body:', data);

  // Support various field names
  const locationId = data.locationId ?? data.location_id ?? data.location;
  const deviceName = data.name ?? data.deviceCodeName ?? data.deviceName;
  console.log('squareDeviceCodes.handler ▶ request body normalized', { locationId, deviceName });

  // verify that the Square location exists and is accessible
  console.log('squareDeviceCodes.handler ▶ verifying location access for', locationId);
  console.log('squareDeviceCodes.handler ▶ calling client.locations.get()', locationId);
  try {
    const retrieveResp = await client.locations.get({ locationId });
    console.log('squareDeviceCodes.handler ▶ retrieve response:', retrieveResp);
  } catch (err) {
    console.warn('squareDeviceCodes.handler ◀ forbidden: cannot access location', err);
    return attachCORS({
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden: cannot access location' }),
    });
  }

  if (!locationId || !deviceName) {
    console.warn('squareDeviceCodes.handler ✖ Missing required fields', { locationId, deviceName });
    return attachCORS({
      statusCode: 400,
      body: JSON.stringify({ error: 'locationId and deviceName are required' }),
    });
  }

  try {
    console.log('squareDeviceCodes.handler ▶ creating device code with payload:', {
      idempotencyKey: crypto.randomUUID(),
      deviceCode: { name: deviceName, locationId, productType: 'TERMINAL_API' }
    });
    console.log('squareDeviceCodes.handler ▶ calling client.devices.codes.create()');
    const resp = await deviceCodesApi.create({
      idempotencyKey: crypto.randomUUID(),
      deviceCode: {
        name: deviceName,
        locationId,
        productType: 'TERMINAL_API',
      },
    });
    console.log('squareDeviceCodes.handler ▶ full resp:', resp);
    const created = resp.result?.deviceCode ?? resp.result?.device_code;
    console.log('squareDeviceCodes.handler ◀ created device code:', created);
    return attachCORS({
      statusCode: 201,
      body: JSON.stringify(created ?? resp),
    });
  } catch (err) {
    console.error('squareDeviceCodes.handler ✖ ERROR', err.stack || err);
    if (err instanceof SquareError && err.errors) {
      console.error('SquareError details:', err.errors);
    }
    return attachCORS({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
  }
};