// routes/locations.js

const getPool = require('../db');
const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE'
};
function attachCORS(response) {
  response.headers = { ...corsHeaders, ...(response.headers || {}) };
  return response;
}

exports.handler = async (event) => {
    const pool = getPool();
    const method = event.httpMethod;
    const id = event.pathParameters.proxy;
    let response;

    try {
        if (method === 'OPTIONS') {
          response = { statusCode: 200, body: '' };
        } else if (method === 'GET') {
            if (id) {
                const [rows] = await pool.query(
                    'SELECT * FROM Locations WHERE LocationID = ?',
                    [id]
                );
                response = { statusCode: 200, body: JSON.stringify(rows[0] || {}) };
            } else {
                const [rows] = await pool.query('SELECT * FROM Locations');
                response = { statusCode: 200, body: JSON.stringify(rows) };
            }
        } else if (method === 'POST') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            const columns = Object.keys(data);
            const placeholders = columns.map(() => '?').join(',');
            const values = columns.map(col => data[col]);
            await pool.query(
                `INSERT INTO Locations (${columns.join(',')}) VALUES (${placeholders})`,
                values
            );
            response = { statusCode: 201, body: JSON.stringify({ message: 'Created' }) };
        } else if (method === 'PUT') {
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            const idToUpdate = data.LocationID || id;
            const columns = Object.keys(data).filter(col => col !== 'LocationID');
            const assignments = columns.map(col => `${col} = ?`).join(',');
            const values = columns.map(col => data[col]);
            values.push(idToUpdate);
            await pool.query(
                `UPDATE Locations SET ${assignments} WHERE LocationID = ?`,
                values
            );
            response = { statusCode: 200, body: JSON.stringify({ message: 'Updated' }) };
        } else if (method === 'DELETE') {
            await pool.query('DELETE FROM Locations WHERE LocationID = ?', [id]);
            response = { statusCode: 200, body: JSON.stringify({ message: 'Deleted' }) };
        } else {
            response = {
                statusCode: 405,
                body: JSON.stringify({ message: 'Method Not Allowed' })
            };
        }
    } catch (err) {
      response = {
        statusCode: 500,
        body: JSON.stringify({ error: err.message }),
      };
    }
    return attachCORS(response);
};