// index.js

const locationHandler = require('./routes/locations');
const customerHandler = require('./routes/customers');
const itemHandler = require('./routes/items');
const inventoryHandler = require('./routes/inventorylevels');
const transactionHandler = require('./routes/transactions');
const txItemsHandler = require('./routes/transactionitems');
const paymentHandler = require('./routes/payments');
const discountHandler = require('./routes/discounts');
const discountItemsHandler = require('./routes/discountitems');
const categoryHandler = require('./routes/categories');
const categoryItemsHandler = require('./routes/categoryitems');
const discountCategoriesHandler = require('./routes/discountcategories');
const discountDaysHandler = require('./routes/discountdays');
const listCognitoUsers = require('./routes/listcognitouser');

exports.handler = async (event) => {
    // Split path into segments and extract route + proxy
    const segments = event.path.split('/').filter(Boolean);
    const route = segments[1]?.toLowerCase() || '';
    const proxy = segments.slice(2).join('/');
    event.pathParameters = { proxy };

    try {
        switch (route) {
            case 'locations':
                return await locationHandler.handler(event);
            case 'customers':
                return await customerHandler.handler(event);
            case 'items':
                return await itemHandler.handler(event);
            case 'inventorylevels':
                return await inventoryHandler.handler(event);
            case 'transactions':
                return await transactionHandler.handler(event);
            case 'transactionitems':
                return await txItemsHandler.handler(event);
            case 'payments':
                return await paymentHandler.handler(event);
            case 'discounts':
                return await discountHandler.handler(event);
            case 'discountitems':
                return await discountItemsHandler.handler(event);
            case 'categories':
                return await categoryHandler.handler(event);
            case 'categoryitems':
                return await categoryItemsHandler.handler(event);
            case 'discountcategories':
                return await discountCategoriesHandler.handler(event);
            case 'discountdays':
                return await discountDaysHandler.handler(event);
            case 'listcognitouser':
                return await listCognitoUsers.handler(event);
            default:
                return {
                    statusCode: 404,
                    body: JSON.stringify({ message: 'Route not found' }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    }
                };
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        };
    }
};