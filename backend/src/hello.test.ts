import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from './hello';

// Mock console methods to avoid noise in tests
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();

describe('Hello Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should return a successful response with user information', async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      version: '2.0',
      routeKey: 'GET /hello',
      rawPath: '/hello',
      rawQueryString: '',
      headers: {
        'content-type': 'application/json',
        'authorization': 'Bearer mock-token',
      },
      requestContext: {
        accountId: '123456789012',
        apiId: 'test-api-id',
        domainName: 'test-api.execute-api.us-east-1.amazonaws.com',
        http: {
          method: 'GET',
          path: '/hello',
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'test-agent',
        },
        requestId: 'test-request-id',
        routeKey: 'GET /hello',
        stage: 'test',
        time: '01/Jan/2023:00:00:00 +0000',
        timeEpoch: 1672531200000,
        authorizer: {
          jwt: {
            claims: {
              sub: 'test-user-id',
              email: 'test@example.com',
              given_name: 'John',
              family_name: 'Doe',
            },
            scopes: ['openid', 'email', 'profile'],
          },
        },
      },
      isBase64Encoded: false,
    };

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    expect(result.headers).toMatchObject({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    const body = JSON.parse(result.body!);
    expect(body.message).toBe('Hello John Doe from TravelM8 Lambda!');
    expect(body.timestamp).toBeDefined();
    expect(body.user).toEqual({
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'John Doe',
    });
  });

  it('should handle missing user information gracefully', async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      version: '2.0',
      routeKey: 'GET /hello',
      rawPath: '/hello',
      rawQueryString: '',
      headers: {
        'content-type': 'application/json',
      },
      requestContext: {
        accountId: '123456789012',
        apiId: 'test-api-id',
        domainName: 'test-api.execute-api.us-east-1.amazonaws.com',
        http: {
          method: 'GET',
          path: '/hello',
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'test-agent',
        },
        requestId: 'test-request-id',
        routeKey: 'GET /hello',
        stage: 'test',
        time: '01/Jan/2023:00:00:00 +0000',
        timeEpoch: 1672531200000,
      },
      isBase64Encoded: false,
    };

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body!);
    expect(body.message).toBe('Hello anonymous from TravelM8 Lambda!');
    expect(body.user).toBeUndefined();
  });

  it('should handle errors gracefully', async () => {
    // Create an event that will cause an error
    const mockEvent = null as any;

    const result = await handler(mockEvent);

    expect(result.statusCode).toBe(500);
    expect(result.headers).toMatchObject({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    const body = JSON.parse(result.body!);
    expect(body.error).toBe('Internal server error');
    expect(body.message).toBe('An unexpected error occurred');
    expect(body.timestamp).toBeDefined();
  });
});

