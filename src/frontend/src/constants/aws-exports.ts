const awsConfig = {
    Auth: {
        Cognito: {
            userPoolId: "us-east-2_r6F7UtiKm", // REQUIRED - Amazon Cognito User Pool ID
            userPoolClientId: "6s20f4jrmqdq91uguq6o6h7rbv", // REQUIRED - Amazon Cognito Web Client ID
            identityPoolId: "us-east-2:080114a4-6a74-4341-adac-17884bdc8f43", // Your new Identity Pool ID
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
            POSAPI: {
                endpoint: "https://svfbmnfofk.execute-api.us-east-2.amazonaws.com/prod/backend",
                region: "us-east-2" // Optional, if your API is hosted in a specific region.
            }
        }
    },
};

export default awsConfig;