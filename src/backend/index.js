const administrators = require('./routes/administrators');
const clients = require('./routes/clients');
const farms = require('./routes/farms');
const transactions = require('./routes/transactions');
const listCognitoUsers = require('./routes/listcognitouser');

exports.handler = async (event, context) => {
    console.log('Original event.path:', event.path);
    const segments = event.path.split('/').filter(p => p !== '');
    console.log('Path segments:', segments);

    let route, proxy;
    // If the second segment is "backend", skip it
    if (segments[1]?.toLowerCase() === 'backend') {
        route = (segments[2] || '').toLowerCase();
        proxy = segments[3] || '';
    } else {
        // Otherwise, treat the second segment as the route
        route = (segments[1] || '').toLowerCase();
        proxy = segments[2] || '';
    }
    console.log('Determined route:', route);
    console.log('Determined proxy:', proxy);

    // Ensure pathParameters.proxy is set for downstream handlers
    event.pathParameters = { proxy };

    // Route to the appropriate handler
    if (route === 'administrators') {
        return await administrators.handler(event);
    } else if (route === 'clients') {
        return await clients.handler(event);
    } else if (route === 'farmprofiles') {
        // Alias farmprofiles to the farms handler
        return await farms.handler(event);
    } else if (route === 'farms') {
        return await farms.handler(event);
    } else if (route === 'transactions') {
        return await transactions.handler(event);
    } else if (route === 'listcognitouser') {
        return await listCognitoUsers.handler(event);
    } else {
        return {
            statusCode: 404,
            body: JSON.stringify({ message: 'Route not found' }),
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
            },
        };
    }
};
