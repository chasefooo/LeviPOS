const getPool = require('../db');

// Helper to attach CORS headers
const attachCORS = (resp) => {
  resp.headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS,GET,POST,PUT,DELETE',
  };
  return resp;
};

exports.handler = async (event) => {
    const pool = getPool();
    const method = event.httpMethod;
    const proxy = event.pathParameters?.proxy;
    const qs = event.queryStringParameters || {};
    // Normalize event.body in case of double-encoded JSON
    let data;
    try {
      data = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
    } catch {
      data = {};
    }
    try {
        if (method === 'OPTIONS') {
          return attachCORS({ statusCode: 200, body: '' });
        }
        if (method === 'GET') {
            if (qs.TransactionID || proxy) {
                const id = qs.TransactionID || proxy;
                const [rows] = await pool.query(
                    'SELECT * FROM Transactions WHERE TransactionID = ?',
                    [id]
                );
                return attachCORS({ statusCode: 200, body: JSON.stringify(rows[0] || {}) });
            } else if (qs.TransactionDate && qs.FarmID) {
                const [rows] = await pool.query(
                    'SELECT * FROM Transactions WHERE TransactionDate = ? AND FarmID = ?',
                    [qs.TransactionDate, qs.FarmID]
                );
                return attachCORS({ statusCode: 200, body: JSON.stringify(rows) });
            } else {
                const [rows] = await pool.query('SELECT * FROM Transactions');
                return attachCORS({ statusCode: 200, body: JSON.stringify(rows) });
            }
        } else if (method === 'POST') {
            const { Total, TransactionDate, FarmID, ClientID } = data;
            const [result] = await pool.query(
                'INSERT INTO Transactions (Total, TransactionDate, FarmID, ClientID) VALUES (?, ?, ?, ?)',
                [Total, TransactionDate, FarmID, ClientID]
            );
            return attachCORS({ statusCode: 201, body: JSON.stringify({ TransactionID: result.insertId }) });
        } else if (method === 'PUT') {
            const { TransactionID, Total, TransactionDate, FarmID, ClientID } = data;
            await pool.query(
                'UPDATE Transactions SET Total = ?, TransactionDate = ?, FarmID = ?, ClientID = ? WHERE TransactionID = ?',
                [Total, TransactionDate, FarmID, ClientID, TransactionID]
            );
            return attachCORS({ statusCode: 200, body: JSON.stringify({ message: 'Updated' }) });
        } else if (method === 'DELETE') {
            if (!proxy) {
              return attachCORS({ statusCode: 400, body: JSON.stringify({ message: 'TransactionID required' }) });
            }
            await pool.query('DELETE FROM Transactions WHERE TransactionID = ?', [proxy]);
            return attachCORS({ statusCode: 200, body: JSON.stringify({ message: 'Deleted', TransactionID: proxy }) });
        } else {
            return attachCORS({ statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) });
        }
    } catch (err) {
        return attachCORS({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    }
};