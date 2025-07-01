// routes/squarecheckouts.js

// Support both CommonJS default and named exports
const { SquareClient, SquareEnvironment, SquareError } = require('square');

// Reuse your global CORS headers
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,POST',
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
    console.info('squareCheckouts.handler ▶ entry', {
        method: event.httpMethod,
        path: event.path,
        tokenLoaded: !!process.env.SQUARE_ACCESS_TOKEN,
    });

    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return attachCORS({ statusCode: 200, body: '' });
    }
    if (event.httpMethod !== 'POST') {
        return attachCORS({
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        });
    }

    // Parse JSON body
    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        console.error('squareCheckouts.handler ✖ bad JSON body', event.body);
        return attachCORS({
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid JSON' }),
        });
    }

    // Determine idempotencyKey (fallback to timestamp)
    const idempotencyKey =
        typeof body.idempotencyKey === 'string'
            ? body.idempotencyKey
            : typeof body.idempotency_key === 'string'
                ? body.idempotency_key
                : String(Date.now());

    // Parse checkout payload (may come in as JSON string or object)
    let checkout;
    if (typeof body.checkout === 'string') {
        try {
            checkout = JSON.parse(body.checkout);
        } catch {
            console.error('squareCheckouts.handler ✖ invalid checkout JSON string', body.checkout);
            checkout = {};
        }
    } else if (typeof body.checkout === 'object' && body.checkout !== null) {
        checkout = body.checkout;
    } else {
        checkout = body;
    }
    // unwrap nested
    if (checkout && typeof checkout.checkout === 'object') checkout = checkout.checkout;
    if (typeof checkout === 'string') {
        try { checkout = JSON.parse(checkout); } catch { checkout = {}; }
    }

    console.info('squareCheckouts.handler ▶ using idempotencyKey and checkout', { idempotencyKey, checkout });

    // --- Terminal cancel support ---
    const isCancelRoute = event.path.toLowerCase().endsWith('/cancel');
    console.info('squareCheckouts.handler ▶ cancel debug', {
      isCancelRoute,
      bodyCancel: body.cancelId,
      bodyCheckoutId: body.checkoutId,
      checkoutIdField: checkout && checkout.id,
      checkoutCancelField: checkout && checkout.cancelId,
    });
    const cancelId =
      (typeof body.cancelId === 'string' && body.cancelId) ||
      (typeof body.checkoutId === 'string' && body.checkoutId) ||
      (checkout && typeof checkout.id === 'string' && checkout.id) ||
      (checkout && typeof checkout.cancelId === 'string' && checkout.cancelId);

    if (isCancelRoute) {
      if (!cancelId) {
        console.error('squareCheckouts.handler ✖ missing checkoutId for cancel', body);
        return attachCORS({
          statusCode: 400,
          body: JSON.stringify({ error: 'Missing checkoutId for cancel' }),
        });
      }
      console.info('squareCheckouts.handler ▶ calling client.terminal.checkouts.cancel()', cancelId);
      try {
        const cancelRes = await client.terminal.checkouts.cancel({ checkoutId: cancelId });
        console.info('squareCheckouts.handler ◀ cancel response', cancelRes);
        return attachCORS({
          statusCode: 200,
          body: JSON.stringify(cancelRes, (_, v) => typeof v === 'bigint' ? v.toString() : v),
        });
      } catch (cancelErr) {
        console.error('squareCheckouts.handler ✖ cancel ERROR', cancelErr);
        return attachCORS({
          statusCode: 500,
          body: JSON.stringify({ error: cancelErr.message || 'Cancel error' }),
        });
      }
    }

    // Validate create payload
    if (
        typeof checkout.amountMoney !== 'object' ||
        typeof checkout.deviceOptions !== 'object' ||
        typeof checkout.deviceOptions.deviceId !== 'string'
    ) {
        return attachCORS({
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid checkout payload: must include amountMoney and deviceOptions.deviceId' }),
        });
    }

    // coerce numeric amount to BigInt as required by Square SDK
    if (typeof checkout.amountMoney.amount === 'number') {
        checkout.amountMoney.amount = BigInt(checkout.amountMoney.amount);
    }

    try {
        console.info('squareCheckouts.handler ▶ calling client.terminal.checkouts.create()');
        const sqRes = await client.terminal.checkouts.create({
            idempotencyKey,
            checkout,
        });
        console.info('squareCheckouts.handler ◀ Square SDK response', sqRes);
        return attachCORS({
            statusCode: 200,
            body: JSON.stringify(sqRes, (_, v) => typeof v === 'bigint' ? v.toString() : v),
        });
    } catch (err) {
        console.error('squareCheckouts.handler ✖ ERROR', err.stack || err);
        if (err instanceof SquareError && err.errors) {
            console.error('SquareError details:', err.errors);
            return attachCORS({ statusCode: 502, body: JSON.stringify({ errors: err.errors }) });
        }
        return attachCORS({ statusCode: 500, body: JSON.stringify({ error: err.message || 'Unknown error' }) });
    }
};