const getPool = require('../db');
const crypto = require('crypto');

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

exports.handler = async (event) => {
  console.log('TRACE: entering clients.handler with httpMethod:', event.httpMethod, 'proxy:', event.pathParameters?.proxy);
  const pool = getPool();
  const method = event.httpMethod;
  const proxy = event.pathParameters?.proxy;
  let response;

  try {
    // CSV upload endpoint
    if ((method === 'POST' || method === 'PUT') && proxy === 'uploadCsv') {
      let data = JSON.parse(event.body);
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      console.log('CSV upload raw body data:', data);
      const { mode, startingBalance, records } = data;
      if (!Array.isArray(records)) {
        console.error('CSV upload error: records is not an array', records);
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: 'Invalid records payload' }),
        };
      } else {
        console.log('CSV upload payload:', { mode, startingBalance, recordsCount: records.length });
        if (records.some(r => !r.ClientID || !r.PIN)) {
          response = { statusCode: 400, body: JSON.stringify({ message: 'Invalid records' }) };
        } else if (mode === 'replace') {
          console.log('Replacing client list: marking all inactive and resetting balances');
          // Mark all inactive and reset balance
          await pool.query('UPDATE Clients SET Active = 0, Balance = 0');
          console.log('Marked all clients inactive');

          // Bulk upsert: insert new or update existing records with regenerated QR
          if (records.length) {
            console.log('Bulk upsert', records.length, 'clients');
            const values = records.map(r => {
              const qr = crypto.createHash('sha256')
                .update(r.ClientID + r.PIN)
                .digest('hex')
                .substring(0, 32);
              return [r.ClientID, r.PIN, 0, qr, 1];
            });
            await pool.query(
              `INSERT INTO Clients (ClientID, PIN, Balance, QR, Active)
               VALUES ?
               ON DUPLICATE KEY UPDATE
                 PIN = VALUES(PIN),
                 Balance = 0,
                 QR = VALUES(QR),
                 Active = VALUES(Active)`,
              [values]
            );
            console.log('Bulk upsert complete');
          }

          response = {
            statusCode: 200,
            body: JSON.stringify({ message: 'Replaced client list' }),
          };
        } else if (mode === 'merge') {
          console.log('Merging client list: existingCount will be determined');
          // Get existing IDs
          const [existingRows] = await pool.query('SELECT ClientID FROM Clients');
          console.log('Existing client count:', existingRows.length);
          const existingSet = new Set(existingRows.map(r => String(r.ClientID)));
          const newRecs = records.filter(r => !existingSet.has(r.ClientID));
          console.log('New records count:', newRecs.length, 'records:', newRecs);
          if (newRecs.length) {
            // Insert new clients with Active=1
            const values = newRecs.map(r => {
              const qr = crypto.createHash('sha256')
                .update(r.ClientID + r.PIN)
                .digest('hex')
                .substring(0, 32);
              return [r.ClientID, r.PIN, startingBalance || 0, qr, 1];
            });
            await pool.query(
              'INSERT INTO Clients (ClientID, PIN, Balance, QR, Active) VALUES ?',
              [values]
            );
            console.log('Merged new clients:', newRecs);
          }
          response = { statusCode: 200, body: JSON.stringify({ message: 'Merged client list' }) };
        } else {
          response = { statusCode: 400, body: JSON.stringify({ message: 'Invalid mode' }) };
        }
      }
    }
    // Handle preflight
    else if (method === 'OPTIONS') {
      response = { statusCode: 200, body: '' };
    }
    // GET single or list
    else if (method === 'GET') {
      const clientId = event.queryStringParameters?.ClientID || proxy;
      if (clientId) {
        const [rows] = await pool.query(
          'SELECT * FROM Clients WHERE ClientID = ?',
          [clientId]
        );
        response = { statusCode: 200, body: JSON.stringify(rows[0] || {}) };
      } else {
        const [rows] = await pool.query('SELECT * FROM Clients');
        response = { statusCode: 200, body: JSON.stringify(rows) };
      }
    }
    // Create new
    else if (method === 'POST') {
      let data = JSON.parse(event.body);
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      const { ClientID, PIN, Balance } = data;
      const qr = crypto.createHash('sha256')
        .update(ClientID + PIN)
        .digest('hex')
        .substring(0, 32);
      await pool.query(
        'INSERT INTO Clients (ClientID, PIN, Balance, QR, Active) VALUES (?, ?, ?, ?, 1)',
        [ClientID, PIN, Balance, qr]
      );
      response = { statusCode: 201, body: JSON.stringify({ message: 'Created' }) };
    }
    // Batch update all clients' Balance
    else if (method === 'PUT' && proxy === 'loadBalances') {
      // Parse body (handle double-encoding)
      let data = JSON.parse(event.body);
      if (typeof data === 'string') data = JSON.parse(data);
      const { Balance } = data;
      if (Balance == null || isNaN(Number(Balance))) {
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: 'Valid Balance is required for batch update' }),
        };
      } else {
        // Update all clients in one query
        await pool.query(
          'UPDATE Clients SET Balance = ?',
          [Balance]
        );
        response = {
          statusCode: 200,
          body: JSON.stringify({ message: 'All balances updated', Balance }),
        };
      }
    }
    // Increase all clients’ balance by amount (positive or negative)
    else if (method === 'PUT' && proxy === 'increaseBalances') {
      let data = JSON.parse(event.body);
      if (typeof data === 'string') data = JSON.parse(data);
      const amt = Number(data.amount);
      if (isNaN(amt)) {
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: 'Valid amount required' }),
        };
      } else {
        await pool.query('UPDATE Clients SET Balance = Balance + ?', [amt]);
        response = {
          statusCode: 200,
          body: JSON.stringify({ message: 'Balances updated', amount: amt }),
        };
      }
    }
    // Update existing
    else if (method === 'PUT') {
      let data = JSON.parse(event.body);
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      const id = proxy || data.ClientID;
      if (!id) {
        response = {
          statusCode: 400,
          body: JSON.stringify({ message: 'ClientID is required for update' }),
        };
      } else {
        const { Balance, PIN, Active } = data;
        const fields = ['Balance = ?'];
        const values = [Balance];
        if (PIN !== undefined) {
          fields.push('PIN = ?');
          values.push(PIN);
          // regenerate QR when PIN changes
          const qr = crypto.createHash('sha256').update(id + PIN).digest('hex').substring(0, 32);
          fields.push('QR = ?');
          values.push(qr);
        }
        if (Active !== undefined) {
          fields.push('Active = ?');
          values.push(Active);
        }
        values.push(id);
        await pool.query(
          `UPDATE Clients SET ${fields.join(', ')} WHERE ClientID = ?`,
          values
        );
        response = {
          statusCode: 200,
          body: JSON.stringify({ message: 'Updated' }),
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
    console.error('ERROR in clients.handler:', err);
    response = {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }

  return attachCORS(response);
};