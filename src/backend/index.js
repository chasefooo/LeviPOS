// index.js

const locationHandler         = require('./routes/locations');
const customerHandler         = require('./routes/customers');
const itemHandler             = require('./routes/items');
const inventoryHandler        = require('./routes/inventorylevels');
const transactionHandler      = require('./routes/transactions');
const txItemsHandler          = require('./routes/transactionitems');
const paymentHandler          = require('./routes/payments');
const discountHandler         = require('./routes/discounts');
const discountItemsHandler    = require('./routes/discountitems');
const categoryHandler         = require('./routes/categories');
const categoryItemsHandler    = require('./routes/categoryitems');
const discountCategoriesHandler = require('./routes/discountcategories');
const discountDaysHandler     = require('./routes/discountdays');
const listCognitoUsers        = require('./routes/listcognitouser');
const squareLocationsHandler   = require('./routes/squarelocations');
const squareDevicesHandler     = require('./routes/squaredevices');
const squareDeviceCodesHandler = require('./routes/squaredevicecodes');
const squareCheckoutsHandler   = require('./routes/squarecheckouts');

const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
};

exports.handler = async (event, context) => {
    console.log('Original event.path:', event.path);
    const segments = event.path.split('/').filter(p => p !== '');
    let route, proxy;
    if (segments[1]?.toLowerCase() === 'backend') {
        route = (segments[2] || '').toLowerCase();
        proxy = segments[3] || '';
    } else {
        route = (segments[1] || '').toLowerCase();
        proxy = segments[2] || '';
    }
    console.log('Determined route:', route);
    console.log('Determined proxy:', proxy);
    event.pathParameters = { proxy };

    try {
        let response;
        switch (route) {
            case 'locations':
                response = await locationHandler.handler(event);
                break;
            case 'customers':
                response = await customerHandler.handler(event);
                break;
            case 'items':
                response = await itemHandler.handler(event);
                break;
            case 'inventorylevels':
                response = await inventoryHandler.handler(event);
                break;
            case 'transactions':
                response = await transactionHandler.handler(event);
                break;
            case 'transactionitems':
                response = await txItemsHandler.handler(event);
                break;
            case 'payments':
                response = await paymentHandler.handler(event);
                break;
            case 'discounts':
                response = await discountHandler.handler(event);
                break;
            case 'discountitems':
                response = await discountItemsHandler.handler(event);
                break;
            case 'categories':
                response = await categoryHandler.handler(event);
                break;
            case 'categoryitems':
                response = await categoryItemsHandler.handler(event);
                break;
            case 'discountcategories':
                response = await discountCategoriesHandler.handler(event);
                break;
            case 'discountdays':
                response = await discountDaysHandler.handler(event);
                break;
            case 'listcognitouser':
                response = await listCognitoUsers.handler(event);
                break;
            case 'square':
                switch (proxy) {
                    case 'locations':
                        response = await squareLocationsHandler.handler(event);
                        break;
                    case 'devices':
                        response = await squareDevicesHandler.handler(event);
                        break;
                    case 'devicecodes':
                        response = await squareDeviceCodesHandler.handler(event);
                        break;
                    case 'checkouts':
                        response = await squareCheckoutsHandler.handler(event);
                        break;
                    default:
                        response = {
                            statusCode: 404,
                            body: JSON.stringify({ message: 'Square route not found' }),
                        };
                }
                break;
            default:
                response = {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Route not found' }),
                };
        }
        // Attach CORS headers to whatever the handler returned
        response.headers = { ...corsHeaders, ...(response.headers || {}) };
        return response;
    } catch (err) {
        // Log full error for debugging
        console.error('index.handler ERROR:', err.stack || err);
        // On error, return 500 with CORS
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
            headers: corsHeaders,
        };
    }
};
