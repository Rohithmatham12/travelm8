import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito'; // Corrected import for Cognito
import { RemovalPolicy, Duration } from 'aws-cdk-lib'; // Ensure Duration is also imported if not already
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
// ========================================================================
// Cognito User Pool for Authentication
// ========================================================================
const userPool = new cognito.UserPool(this, 'TravelM8UserPool', {
  userPoolName: 'travelm8-user-pool', // Name for the User Pool in AWS Console
  selfSignUpEnabled: true, // Allow users to sign themselves up
  accountRecovery: cognito.AccountRecovery.EMAIL_ONLY, // Allow recovery via email
  userVerification: {
    emailStyle: cognito.VerificationEmailStyle.CODE, // Send a verification code via email
  },
  autoVerify: { email: true }, // Automatically verify email addresses
  signInAliases: { email: true }, // Allow users to sign in using their email address
  standardAttributes: { // Define standard attributes required during sign-up
    email: {
      required: true,
      mutable: false, // Email cannot be changed after sign-up (can be adjusted)
    },
    givenName: { // First name
      required: true,
      mutable: true,
    },
    familyName: { // Last name
      required: true,
      mutable: true,
    },
  },
  passwordPolicy: { // Define password requirements
    minLength: 8,
    requireLowercase: true,
    requireUppercase: true,
    requireDigits: true,
    requireSymbols: false, // Set to true for higher security if desired
    tempPasswordValidity: cdk.Duration.days(7),
  },
  // IMPORTANT FOR FREE TIER & DESTRUCTION:
  // RemovalPolicy.DESTROY will delete the user pool when the CDK stack is destroyed.
  // RemovalPolicy.RETAIN (default) keeps it, which might incur costs if not cleaned up manually.
  // Use DESTROY for development/testing, RETAIN for production carefully.
  removalPolicy: RemovalPolicy.DESTROY,
});

// ========================================================================
// Cognito User Pool Client for Frontend App
// ========================================================================
const userPoolClient = new cognito.UserPoolClient(this, 'TravelM8UserPoolClient', {
  userPool: userPool, // Reference the User Pool created above
  userPoolClientName: 'travelm8-web-client', // Name for the client
  authFlows: { // Specify allowed authentication flows
    userSrp: true, // Secure Remote Password protocol (recommended for web/mobile)
    adminUserPassword: false, // Disable admin flow from client-side (good practice)
  },
  // Optional: Configure OAuth flows if needed later for social logins etc.
  // generateSecret: false, // Client secret not needed for web/SPA apps using SRP
});

 // ========================================================================
 // Stack Outputs
 // ========================================================================
 new cdk.CfnOutput(this, 'UserPoolIdOutput', {
  value: userPool.userPoolId,
  description: 'ID of the Cognito User Pool',
  exportName: 'TravelM8UserPoolId', // Optional: Export for cross-stack references
});

new cdk.CfnOutput(this, 'UserPoolClientIdOutput', {
  value: userPoolClient.userPoolClientId,
  description: 'ID of the Cognito User Pool Client for the web app',
  exportName: 'TravelM8UserPoolClientId', // Optional: Export
});


    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
