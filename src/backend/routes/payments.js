// routes/payments.js

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
    const id = event.pathParameters.proxy;

    if (method === 'OPTIONS') {
        return { statusCode: 200, headers: corsHeaders };
    }

    try {
        if (method === 'GET') {
            if (id) {
                const [rows] = await pool.query(
                    'SELECT * FROM Payments WHERE PaymentID = ?',
                    [id]
                );
                return { statusCode: 200, body: JSON.stringify(rows[0] || {}), headers: corsHeaders };
            } else {
                const [rows] = await pool.query('SELECT * FROM Payments');
                return { statusCode: 200, body: JSON.stringify(rows), headers: corsHeaders };
            }
        } else if (method === 'POST') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(',');
            const values = columns.map(col => data[col]);
            await pool.query(
                `INSERT INTO Payments (${columns.join(',')}) VALUES (${placeholders})`,
                values
            );
            return { statusCode: 201, body: JSON.stringify({ message: 'Created' }), headers: corsHeaders };
        } else if (method === 'PUT') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            const idToUpdate = data.PaymentID || id;
            const columns = Object.keys(data).filter(col => col !== 'PaymentID');
            const assignments = columns.map(col => `${col} = ?`).join(',');
            const values = columns.map(col => data[col]);
            values.push(idToUpdate);
            await pool.query(
                `UPDATE Payments SET ${assignments} WHERE PaymentID = ?`,
                values
            );
            return { statusCode: 200, body: JSON.stringify({ message: 'Updated' }), headers: corsHeaders };
        } else if (method === 'DELETE') {
            await pool.query(
                'DELETE FROM Payments WHERE PaymentID = ?',
                [id]
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