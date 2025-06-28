const getPool = require('../db');

exports.handler = async (event) => {
    const pool = getPool();
    const method = event.httpMethod;
    const proxy = event.pathParameters?.proxy;
    try {
        if (method === 'GET') {
            // GET by CognitoUser (query or path)
            const cognitoUser = event.queryStringParameters?.CognitoUser || proxy;
            if (cognitoUser) {
                const [rows] = await pool.query(
                    'SELECT * FROM Administrators WHERE CognitoUser = ?',
                    [cognitoUser]
                );
                return { statusCode: 200, body: JSON.stringify(rows[0] || {}) };
            } else {
                const [rows] = await pool.query('SELECT * FROM Administrators');
                return { statusCode: 200, body: JSON.stringify(rows) };
            }
        } else if (method === 'POST') {
            const data = JSON.parse(event.body);
            const { CognitoUser, Name } = data;
            await pool.query(
                'INSERT INTO Administrators (CognitoUser, Name) VALUES (?, ?)',
                [CognitoUser, Name]
            );
            return { statusCode: 201, body: JSON.stringify({ message: 'Created' }) };
        } else if (method === 'PUT') {
            const data = JSON.parse(event.body);
            const { CognitoUser, Name } = data;
            await pool.query(
                'UPDATE Administrators SET Name = ? WHERE CognitoUser = ?',
                [Name, CognitoUser]
            );
            return { statusCode: 200, body: JSON.stringify({ message: 'Updated' }) };
        } else {
            return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
        }
    } catch (err) {
        return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
    }
};