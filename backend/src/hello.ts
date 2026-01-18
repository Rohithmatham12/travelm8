// File: backend/src/hello.ts

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// Define a more specific type for the request context with Cognito authorizer
type RequestContextWithAuthorizer = APIGatewayProxyEventV2['requestContext'] & {
  authorizer?: {
    jwt?: {
      claims?: {
        sub?: string; // User ID
        email?: string;
        given_name?: string;
        family_name?: string;
        // Add other claims you might need, e.g., 'cognito:groups'
      };
      scopes?: string[];
    };
    // May include other authorizer properties depending on type/config
  };
};

// Response interface for better type safety
interface HelloResponse {
  message: string;
  timestamp: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * Handler for the /hello endpoint triggered by API Gateway V2 (HTTP API).
 * Assumes Cognito User Pool authorizer is attached.
 */
export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  try {
    console.log('Event Received:', JSON.stringify(event, null, 2));

    // Cast the requestContext to our more specific type (safer than 'any')
    const requestContext = event.requestContext as RequestContextWithAuthorizer | undefined;

    // Access user info safely using optional chaining
    const userId = requestContext?.authorizer?.jwt?.claims?.sub;
    const userEmail = requestContext?.authorizer?.jwt?.claims?.email;
    const givenName = requestContext?.authorizer?.jwt?.claims?.given_name;
    const familyName = requestContext?.authorizer?.jwt?.claims?.family_name;

    // Create user-friendly name
    const userName = givenName && familyName 
      ? `${givenName} ${familyName}` 
      : givenName || userEmail || userId || 'anonymous';

    const message = `Hello ${userName} from TravelM8 Lambda!`;
    console.log(`Responding with message: "${message}"`);

    const response: HelloResponse = {
      message,
      timestamp: new Date().toISOString(),
      ...(userId && userEmail && {
        user: {
          id: userId,
          email: userEmail,
          ...(givenName && familyName && { name: `${givenName} ${familyName}` }),
        },
      }),
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error in hello handler:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};