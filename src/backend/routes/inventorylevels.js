// routes/inventorylevels.js

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
    const proxy = event.pathParameters.proxy; // expected format "LocationID,ItemID"

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders };
    }

    try {
        if (method === 'GET') {
            if (proxy) {
                const [loc, itm] = proxy.split(',');
                const [rows] = await pool.query(
                    'SELECT * FROM InventoryLevels WHERE LocationID = ? AND ItemID = ?',
                    [loc, itm]
                );
                return { statusCode: 200, body: JSON.stringify(rows[0] || {}), headers: corsHeaders };
            } else {
                const [rows] = await pool.query('SELECT * FROM InventoryLevels');
                return { statusCode: 200, body: JSON.stringify(rows), headers: corsHeaders };
            }
        } else if (method === 'POST') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            await pool.query(
                'INSERT INTO InventoryLevels (LocationID, ItemID, Quantity) VALUES (?, ?, ?)',
                [data.LocationID, data.ItemID, data.Quantity]
            );
            return { statusCode: 201, body: JSON.stringify({ message: 'Created' }), headers: corsHeaders };
        } else if (method === 'PUT') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            await pool.query(
                'UPDATE InventoryLevels SET Quantity = ? WHERE LocationID = ? AND ItemID = ?',
                [data.Quantity, data.LocationID, data.ItemID]
            );
            return { statusCode: 200, body: JSON.stringify({ message: 'Updated' }), headers: corsHeaders };
        } else if (method === 'DELETE') {
            const [loc, itm] = proxy.split(',');
            await pool.query(
                'DELETE FROM InventoryLevels WHERE LocationID = ? AND ItemID = ?',
                [loc, itm]
            );
            return { statusCode: 200, body: JSON.stringify({ message: 'Deleted' }), headers: corsHeaders };
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