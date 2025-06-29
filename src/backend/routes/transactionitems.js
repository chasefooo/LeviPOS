// routes/transactionitems.js

const getPool = require('../db');
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
};

exports.handler = async (event) => {
    const pool = getPool();
    const method = event.httpMethod;
    const proxy = event.pathParameters.proxy; // expected format "TransactionID,ItemID"

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders };
    }

    try {
        if (method === 'GET') {
            if (proxy) {
                const [txnId, itemId] = proxy.split(',');
                const [rows] = await pool.query(
                    'SELECT * FROM TransactionItems WHERE TransactionID = ? AND ItemID = ?',
                    [txnId, itemId]
                );
                return {
                    statusCode: 200,
                    body: JSON.stringify(rows[0] || {}),
                    headers: corsHeaders
                };
            } else {
                const [rows] = await pool.query('SELECT * FROM TransactionItems');
                return {
                    statusCode: 200,
                    body: JSON.stringify(rows),
                    headers: corsHeaders
                };
            }
        } else if (method === 'POST') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            await pool.query(
                'INSERT INTO TransactionItems (TransactionID, ItemID, Quantity, UnitPrice) VALUES (?, ?, ?, ?)',
                [data.TransactionID, data.ItemID, data.Quantity, data.UnitPrice]
            );
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Created' }),
                headers: corsHeaders
            };
        } else if (method === 'PUT') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            await pool.query(
                'UPDATE TransactionItems SET Quantity = ?, UnitPrice = ? WHERE TransactionID = ? AND ItemID = ?',
                [data.Quantity, data.UnitPrice, data.TransactionID, data.ItemID]
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Updated' }),
                headers: corsHeaders
            };
        } else if (method === 'DELETE') {
            const [txnId, itemId] = proxy.split(',');
            await pool.query(
                'DELETE FROM TransactionItems WHERE TransactionID = ? AND ItemID = ?',
                [txnId, itemId]
            );
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Deleted' }),
                headers: corsHeaders
            };
        } else {
            return {
                statusCode: 405,
                body: JSON.stringify({ message: 'Method Not Allowed' }),
                headers: corsHeaders
            };
        }
    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
            headers: corsHeaders
        };
    }
};