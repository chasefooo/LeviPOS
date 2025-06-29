// routes/discountitems.js

const getPool = require('../db');
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,DELETE'
};

exports.handler = async (event) => {
    const pool = getPool();
    const method = event.httpMethod;
    const proxy = event.pathParameters.proxy; // expected format "DiscountID,ItemID"

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders };
    }

    try {
        if (method === 'GET') {
            if (proxy) {
                const [discountId, itemId] = proxy.split(',');
                const [rows] = await pool.query(
                    'SELECT * FROM DiscountItems WHERE DiscountID = ? AND ItemID = ?',
                    [discountId, itemId]
                );
                return {
                    statusCode: 200,
                    body: JSON.stringify(rows[0] || {}),
                    headers: corsHeaders
                };
            } else {
                const [rows] = await pool.query('SELECT * FROM DiscountItems');
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
                'INSERT INTO DiscountItems (DiscountID, ItemID) VALUES (?, ?)',
                [data.DiscountID, data.ItemID]
            );
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Created' }),
                headers: corsHeaders
            };
        } else if (method === 'DELETE') {
            const [discountId, itemId] = proxy.split(',');
            await pool.query(
                'DELETE FROM DiscountItems WHERE DiscountID = ? AND ItemID = ?',
                [discountId, itemId]
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