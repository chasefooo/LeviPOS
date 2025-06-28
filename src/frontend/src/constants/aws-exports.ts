const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: "us-east-2_UyElUp9SC", // REQUIRED - Amazon Cognito User Pool ID
            userPoolClientId: "gmp3qtmd0fok6h05c9mc3ui0t", // REQUIRED - Amazon Cognito Web Client ID
            identityPoolId: "us-east-2:4b05e80d-3c9a-4135-98fe-dd238476a078", // Your new Identity Pool ID
            allowGuestAccess: false,  // OPTIONAL - Allow unauthenticated guest access if needed
            signUpVerificationMethod: "code", // OPTIONAL - 'code' or 'link'
            authenticationFlowType: "USER_PASSWORD_AUTH",
            loginWith: {
                username: "true",
                email: "true",  // Optional
                phone: "false"  // Optional
                // You can optionally add oauth configuration if using Hosted UI.
            }
        }
    },
    API: {
        REST: {
            // Use a key name for your API. This key must match what you use in your API calls.
            GarrettGrowersAPI: {
                endpoint: "https://maac5wnffe.execute-api.us-east-2.amazonaws.com/prod/backend",
                region: "us-east-2" // Optional, if your API is hosted in a specific region.
            }
        }
    },
};

export default awsConfig;