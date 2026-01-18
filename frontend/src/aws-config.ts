// AWS Amplify configuration
// This file will be updated with actual values after CDK deployment

export const awsConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.REACT_APP_USER_POOL_ID || 'us-east-1_MayXgQkgj',
      userPoolClientId: process.env.REACT_APP_USER_POOL_CLIENT_ID || '1umtngqhcumicb02sm3jju06lm',
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    }
  },
  API: {
    REST: {
      TravelM8Api: {
        endpoint: 'https://w3l3l6mrml.execute-api.us-east-1.amazonaws.com/prod',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      }
    }
  }
};

// Debug logging - show what configuration is being used
console.log('🔧 AWS Config Debug:', {
  userPoolId: awsConfig.Auth.Cognito.userPoolId,
  userPoolClientId: awsConfig.Auth.Cognito.userPoolClientId,
  region: awsConfig.Auth.Cognito.region,
  apiEndpoint: awsConfig.API.REST.TravelM8Api.endpoint,
  envVars: {
    REACT_APP_USER_POOL_ID: process.env.REACT_APP_USER_POOL_ID || 'NOT SET',
    REACT_APP_USER_POOL_CLIENT_ID: process.env.REACT_APP_USER_POOL_CLIENT_ID || 'NOT SET',
    REACT_APP_API_ENDPOINT: process.env.REACT_APP_API_ENDPOINT || 'NOT SET',
    REACT_APP_AWS_REGION: process.env.REACT_APP_AWS_REGION || 'NOT SET'
  },
  rawEnvEndpoint: process.env.REACT_APP_API_ENDPOINT,
  fallbackEndpoint: 'https://w3l3l6mrml.execute-api.us-east-1.amazonaws.com/prod',
  finalEndpoint: process.env.REACT_APP_API_ENDPOINT || 'https://w3l3l6mrml.execute-api.us-east-1.amazonaws.com/prod'
});

// Environment variables that need to be set:
// REACT_APP_USER_POOL_ID - Cognito User Pool ID
// REACT_APP_USER_POOL_CLIENT_ID - Cognito User Pool Client ID  
// REACT_APP_API_ENDPOINT - API Gateway endpoint URL
// REACT_APP_AWS_REGION - AWS region (e.g., us-east-1)
