// routes/listcognitouser.js
const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.AWS_REGION || 'us-east-2' });
const cognito = new AWS.CognitoIdentityServiceProvider();

// CORS headers helper
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
    const method = event.httpMethod;
    const proxy = event.pathParameters?.proxy;
    let response;

    try {
        // Preflight support
        if (method === 'OPTIONS') {
            response = { statusCode: 200, body: '' };
        }
        // POST to reset a user’s password
        else if (method === 'POST' && proxy === 'resetpassword') {
            // Parse request body (handle double-encoding)
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            const { Username, Password } = data;
            if (!Username || !Password) {
                response = {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Username and TemporaryPassword are required' }),
                };
            } else {
                await cognito.adminSetUserPassword({
                    UserPoolId: process.env.USER_POOL_ID,
                    Username,
                    Password,
                    Permanent: false,
                }).promise();
                response = {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Password reset successful' }),
                };
            }
        }
        // GET: list users from Cognito User Pool
        else if (method === 'GET') {
            const UserPoolId = process.env.USER_POOL_ID;
            if (!UserPoolId) {
                throw new Error('USER_POOL_ID environment variable not set');
            }

            let rawUsers = [];
            let params = { UserPoolId };
            do {
                const data = await cognito.listUsers(params).promise();
                rawUsers = rawUsers.concat(
                    data.Users.map(u => {
                        // Include the Cognito Username as 'username'
                        const attrs = { username: u.Username };
                        u.Attributes.forEach(attr => {
                            attrs[attr.Name] = attr.Value;
                        });
                        return attrs;
                    })
                );
                params.PaginationToken = data.PaginationToken;
            } while (params.PaginationToken);

            // For each user, fetch their group membership
            const users = await Promise.all(
                rawUsers.map(async user => {
                    const grpData = await cognito.adminListGroupsForUser({
                        UserPoolId,
                        Username: user.username,
                    }).promise();
                    user.groups = grpData.Groups.map(g => g.GroupName);
                    user.FarmID = user['custom:FarmID'];
                    return user;
                })
            );

            response = { statusCode: 200, body: JSON.stringify({ users }) };
        }
        // POST: create a new Cognito user
        else if (method === 'POST' && !proxy) {
            // Parse request body (handle double-encoding)
            let data = JSON.parse(event.body);
            if (typeof data === 'string') data = JSON.parse(data);
            const { Username, TemporaryPassword, given_name, family_name } = data;
            // support custom:location field as well
            const locationVal = data.location ?? data['custom:location'] ?? '';
            if (!Username || !TemporaryPassword) {
                response = {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Username and TemporaryPassword are required' }),
                };
            } else {
                const UserPoolId = process.env.USER_POOL_ID;
                const params = {
                    UserPoolId,
                    Username,
                    TemporaryPassword,
                    UserAttributes: [
                        { Name: 'given_name', Value: given_name || '' },
                        { Name: 'family_name', Value: family_name || '' },
                        { Name: 'custom:location', Value: locationVal },
                    ],
                    MessageAction: 'SUPPRESS', // Do not send welcome email automatically
                };
                const result = await cognito.adminCreateUser(params).promise();
                response = {
                    statusCode: 201,
                    body: JSON.stringify({ user: result.User }),
                };
            }
        }
        // PUT: update user's given_name and family_name
        else if (method === 'PUT') {
            if (!proxy) {
                response = {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Username is required for update' }),
                };
            } else {
                let data = JSON.parse(event.body);
                if (typeof data === 'string') data = JSON.parse(data);
                const attrs = [];
                if (data.given_name != null) attrs.push({ Name: 'given_name', Value: data.given_name });
                if (data.family_name != null) attrs.push({ Name: 'family_name', Value: data.family_name });
                // support updating the custom attribute from either key
                const locationVal = data.location ?? data['custom:location'];
                if (locationVal != null) {
                  attrs.push({ Name: 'custom:location', Value: String(locationVal) });
                }
                if (attrs.length === 0) {
                    response = {
                        statusCode: 400,
                        body: JSON.stringify({ message: 'No attributes to update' }),
                    };
                } else {
                    await cognito.adminUpdateUserAttributes({
                        UserPoolId: process.env.USER_POOL_ID,
                        Username: proxy,
                        UserAttributes: attrs,
                    }).promise();

                    // Handle Farm group membership
                    if (Array.isArray(data.groups)) {
                      const UserPoolId = process.env.USER_POOL_ID;
                      const desired = data.groups.includes('Farm');
                      // Check current groups
                      const current = (await cognito.adminListGroupsForUser({
                        UserPoolId,
                        Username: proxy,
                      }).promise()).Groups.map(g => g.GroupName);
                      const inFarm = current.includes('Farm');
                      if (desired && !inFarm) {
                        await cognito.adminAddUserToGroup({
                          UserPoolId,
                          GroupName: 'Farm',
                          Username: proxy,
                        }).promise();
                      } else if (!desired && inFarm) {
                        await cognito.adminRemoveUserFromGroup({
                          UserPoolId,
                          GroupName: 'Farm',
                          Username: proxy,
                        }).promise();
                      }
                    }

                    response = {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'User attributes updated' }),
                    };
                }
            }
        }
        // DELETE: remove a Cognito user
        else if (method === 'DELETE') {
            if (!proxy) {
                response = {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Username is required for deletion' }),
                };
            } else {
                await cognito.adminDeleteUser({
                    UserPoolId: process.env.USER_POOL_ID,
                    Username: proxy,
                }).promise();
                response = {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'User deleted' }),
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
        console.error('ERROR in listcognitouser.handler:', err);
        response = {
            statusCode: 500,
            body: JSON.stringify({ error: err.message }),
        };
    }

    return attachCORS(response);
};