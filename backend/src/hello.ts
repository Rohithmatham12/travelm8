// File: backend/src/hello.ts

// Make sure you have run `npm install --save-dev @types/aws-lambda` in the `backend` directory
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

// Define a more specific type for the request context if needed.
// This helps document the expected structure from the Cognito authorizer.
// Check the actual event log in CloudWatch first to confirm the structure.
type RequestContextWithAuthorizer = APIGatewayProxyEventV2["requestContext"] & {
    authorizer?: {
        jwt?: {
            claims?: {
                sub?: string; // User ID
                email?: string;
                // Add other claims you might need, e.g., 'cognito:groups'
            };
            scopes?: string[];
        };
        // May include other authorizer properties depending on type/config
    };
};

/**
 * Handler for the /hello endpoint triggered by API Gateway V2 (HTTP API).
 * Assumes Cognito User Pool authorizer is attached.
 */
export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log('Event Received:', JSON.stringify(event, null, 2));

  // Cast the requestContext to our more specific type (safer than 'any')
  // Note: This still involves a type assertion, use with understanding of the expected data.
  const requestContext = event.requestContext as RequestContextWithAuthorizer | undefined;

  // Access user info safely using optional chaining
  const userId = requestContext?.authorizer?.jwt?.claims?.sub;
  const userEmail = requestContext?.authorizer?.jwt?.claims?.email;

  const message = `Hello ${userEmail || userId || 'anonymous'} from TravelM8 Lambda!`;
  console.log(`Responding with message: "${message}"`);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      // Relying on API Gateway CORS configuration for Access-Control-Allow-Origin etc.
    },
    body: JSON.stringify({
      message: message,
    }),
  };
};