import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';

// --- Use Stable API Gateway V2 Imports ---
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2'; // Core V2 constructs
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations'; // Stable integrations
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers'; // Stable authorizers
// --- End Stable Imports ---

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // --- Cognito User Pool and Client remain the same ---
    const userPool = new cognito.UserPool(this, 'TravelM8UserPool', { /* ... same config ... */
      userPoolName: 'travelm8-user-pool',
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: { emailStyle: cognito.VerificationEmailStyle.CODE },
      autoVerify: { email: true },
      signInAliases: { email: true },
      standardAttributes: {
          email: { required: true, mutable: false },
          givenName: { required: true, mutable: true },
          familyName: { required: true, mutable: true },
      },
      passwordPolicy: { /* ... same config ... */
          minLength: 8, requireLowercase: true, requireUppercase: true, requireDigits: true, tempPasswordValidity: Duration.days(7),
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'TravelM8UserPoolClient', { /* ... same config ... */
      userPool: userPool,
      userPoolClientName: 'travelm8-web-client',
      authFlows: { userSrp: true, },
      // Important: Add OAuth settings if you plan social logins or specific flows later
      // For standard SRP, generateSecret should be false (default for public clients)
    });
    // --- End Cognito ---

    // --- Lambda Function remains the same ---
    const helloFunction = new NodejsFunction(this, 'HelloLambda', { /* ... same config ... */
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/hello.ts'),
      bundling: { minify: false, externalModules: ['aws-sdk'] },
      environment: { REGION: this.region, },
      memorySize: 128,
      timeout: Duration.seconds(10),
    });
    // --- End Lambda ---

    // ========================================================================
    // Cognito Authorizer using STABLE Construct
    // ========================================================================
    // Note: The stable construct requires issuer URL and audience explicitly
    const issuerUrl = `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`;
    const authorizer = new HttpUserPoolAuthorizer( 'CognitoAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
      // identitySource is now configured directly on the route
      // jwtAudience: [userPoolClient.userPoolClientId], // Often needed, inferred if single client
      // jwtIssuer: issuerUrl // Often needed, inferred from userPool
    });


    // ========================================================================
    // HTTP API Gateway using STABLE Construct
    // ========================================================================
    const httpApi = new apigwv2.HttpApi(this, 'TravelM8HttpApi', {
      apiName: 'TravelM8Api',
      description: 'HTTP API for TravelM8 Application',
      corsPreflight: { // CORS configuration directly in props
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        // Use HttpMethod enum from stable 'aws-cdk-lib/aws-apigatewayv2'
        allowMethods: [
          apigwv2.CorsHttpMethod.OPTIONS,
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['http://localhost:3000'], // Add deployed URL later
        maxAge: Duration.days(1),
      },
      // Default Authorizer can be set here, or per-route
      // defaultAuthorizer: authorizer, // Optionally set default for all routes
    });

    // Create the Lambda integration using STABLE construct
    // (Usage is often identical to alpha)
    const helloIntegration = new HttpLambdaIntegration('HelloIntegration', helloFunction);

    // Add the route to the API Gateway using STABLE construct
    httpApi.addRoutes({
      path: '/hello',
      methods: [apigwv2.HttpMethod.GET], // Use HttpMethod enum from stable pkg
      integration: helloIntegration,
      authorizer: authorizer, // Apply authorizer to this specific route
    });


    // ========================================================================
    // Stack Outputs (Remain the same)
    // ========================================================================
    new cdk.CfnOutput(this, 'UserPoolIdOutput', {
        value: userPool.userPoolId, description: 'ID of the Cognito User Pool', exportName: 'TravelM8UserPoolId',
    });
    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', {
        value: userPoolClient.userPoolClientId, description: 'ID of the Cognito User Pool Client for the web app', exportName: 'TravelM8UserPoolClientId',
    });
    new cdk.CfnOutput(this, 'ApiEndpointOutput', {
        value: httpApi.url!, description: 'URL of the deployed API Gateway endpoint', exportName: 'TravelM8ApiEndpoint',
    });

  } // End constructor
} // End class