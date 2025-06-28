const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
};

function attachCORS(response) {
  response.headers = { ...corsHeaders, ...(response.headers || {}) };
  return response;
}

const getPool = require('../db');

exports.handler = async (event) => {
  console.log('TRACE: entering farms.handler with httpMethod:', event.httpMethod, 'proxy:', event.pathParameters?.proxy);
  const pool = getPool();
  const method = event.httpMethod;
  const proxy = event.pathParameters?.proxy;
  let response;

  try {
    // Handle preflight
    if (method === 'OPTIONS') {
      response = { statusCode: 200, body: '' };
    }
    // GET single, filtered list, or full list
    else if (method === 'GET') {
      const cognitoUser = event.queryStringParameters?.cognitoUser;
      if (cognitoUser) {
        // Fetch farms matching the given CognitoUser
        const [rows] = await pool.query(
          'SELECT * FROM Farms WHERE CognitoUser = ?',
          [cognitoUser]
        );
        // Return under "farmProfiles" key for consistency
        response = {
          statusCode: 200,
          body: JSON.stringify({ farmProfiles: rows }),
        };
      } else if (proxy) {
        const [rows] = await pool.query(
          'SELECT * FROM Farms WHERE FarmID = ?',
          [proxy]
        );
        response = { statusCode: 200, body: JSON.stringify(rows[0] || {}) };
      } else {
        const [rows] = await pool.query('SELECT * FROM Farms');
        response = { statusCode: 200, body: JSON.stringify(rows) };
      }
    }
    // Create new
    else if (method === 'POST') {
      let data = JSON.parse(event.body);
      if (typeof data === 'string') data = JSON.parse(data);
      const { FarmName, CognitoUser } = data;
      const [result] = await pool.query(
        'INSERT INTO Farms (FarmName, CognitoUser) VALUES (?, ?)',
        [FarmName, CognitoUser || null]
      );
      response = { statusCode: 201, body: JSON.stringify({ FarmID: result.insertId }) };
    }
    // Update existing
    else if (method === 'PUT') {
      let data = JSON.parse(event.body);
      if (typeof data === 'string') data = JSON.parse(data);
      const id = proxy || data.FarmID;
      if (!id) {
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: 'FarmID is required for update' }),
        };
      } else {
        const { FarmName, CognitoUser } = data;
        await pool.query(
          'UPDATE Farms SET FarmName = ?, CognitoUser = ? WHERE FarmID = ?',
          [FarmName, CognitoUser || null, id]
        );
        response = { statusCode: 200, body: JSON.stringify({ message: 'Updated' }) };
      }
    }
    // DELETE existing farm
    else if (method === 'DELETE') {
      const id = proxy;
      if (!id) {
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: 'FarmID is required for deletion' }),
        };
      } else {
        const [result] = await pool.query(
          'DELETE FROM Farms WHERE FarmID = ?',
          [id]
        );
        response = {
          statusCode: 200,
          body: JSON.stringify({ message: 'Deleted', id }),
        };
      }
    }
    // Method not allowed
    else {
      response = {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }
  } catch (err) {
    console.error('ERROR in farms.handler:', err);
    response = { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  return attachCORS(response);
};