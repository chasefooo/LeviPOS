// routes/discountdays.js

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
    const proxy = event.pathParameters.proxy; // expected format "DiscountID,DayOfWeek"

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders };
    }

    try {
        if (method === 'GET') {
            if (proxy) {
                const [discountId, day] = proxy.split(',');
                const [rows] = await pool.query(
                    'SELECT * FROM DiscountDays WHERE DiscountID = ? AND DayOfWeek = ?',
                    [discountId, day]
                );
                return {
                    statusCode: 200,
                    body: JSON.stringify(rows[0] || {}),
                    headers: corsHeaders
                };
            } else {
                const [rows] = await pool.query('SELECT * FROM DiscountDays');
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
                'INSERT INTO DiscountDays (DiscountID, DayOfWeek) VALUES (?, ?)',
                [data.DiscountID, data.DayOfWeek]
            );
            return {
                statusCode: 201,
                body: JSON.stringify({ message: 'Created' }),
                headers: corsHeaders
            };
        } else if (method === 'DELETE') {
            const [discountId, day] = proxy.split(',');
            await pool.query(
                'DELETE FROM DiscountDays WHERE DiscountID = ? AND DayOfWeek = ?',
                [discountId, day]
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