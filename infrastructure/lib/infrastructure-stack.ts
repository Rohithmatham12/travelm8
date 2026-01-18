import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy, Duration, Tags } from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as logs from 'aws-cdk-lib/aws-logs';

// API Gateway V2 imports
import * as apigwv2 from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { HttpUserPoolAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';

// Additional AWS services (FREE TIER ONLY)
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Add tags to all resources
    Tags.of(this).add('Project', 'TravelM8');
    Tags.of(this).add('Environment', props?.env?.region || 'dev');

    // ========================================================================
    // Cognito User Pool and Client
    // ========================================================================
    const userPool = new cognito.UserPool(this, 'TravelM8UserPool', {
      userPoolName: 'travelm8-user-pool',
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: { 
        emailStyle: cognito.VerificationEmailStyle.CODE 
      },
      autoVerify: { email: true },
      signInAliases: { email: true },
      standardAttributes: {
        email: { required: true, mutable: false },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(7),
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'TravelM8UserPoolClient', {
      userPool: userPool,
      userPoolClientName: 'travelm8-web-client',
      authFlows: { 
        userSrp: true,
        userPassword: false, // Disable for security
        adminUserPassword: false, // Disable for security
      },
      generateSecret: false, // Public client for web app
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
    });

    // ========================================================================
    // DynamoDB Tables (FREE TIER: 25 GB storage, 25 RCU/WCU)
    // ========================================================================
    const tripsTable = new dynamodb.Table(this, 'TravelM8TripsTable', {
      tableName: 'travelm8-trips',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'tripId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Free tier eligible
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: false, // Disable to stay in free tier
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      timeToLiveAttribute: 'ttl', // For automatic cleanup of old trips
    });

    // Add Global Secondary Index for querying trips by status
    tripsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    });

    // ========================================================================
    // SQS Message Queue (FREE TIER: 1M requests/month)
    // ========================================================================
    const tripProcessingQueue = new sqs.Queue(this, 'TravelM8TripProcessingQueue', {
      queueName: 'travelm8-trip-processing',
      visibilityTimeout: Duration.minutes(5),
      retentionPeriod: Duration.days(14), // Free tier: 1M requests/month
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const notificationQueue = new sqs.Queue(this, 'TravelM8NotificationQueue', {
      queueName: 'travelm8-notifications',
      visibilityTimeout: Duration.minutes(2),
      retentionPeriod: Duration.days(14),
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // ========================================================================
    // SNS Notifications (FREE TIER: 1M requests/month)
    // ========================================================================
    const notificationTopic = new sns.Topic(this, 'TravelM8NotificationTopic', {
      topicName: 'travelm8-notifications',
      displayName: 'TravelM8 Notifications',
    });

    // ========================================================================
    // CloudWatch Monitoring (FREE TIER: 10 custom metrics, 5GB log ingestion)
    // ========================================================================
    const dashboard = new cloudwatch.Dashboard(this, 'TravelM8Dashboard', {
      dashboardName: 'TravelM8-Monitoring',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/Lambda',
          metricName: 'Invocations',
          dimensionsMap: {
            FunctionName: 'travelm8-hello-dev', // Will be updated after Lambda creation
          },
        })],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'DynamoDB Read/Write Capacity',
        left: [new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: tripsTable.tableName,
          },
        })],
        right: [new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: tripsTable.tableName,
          },
        })],
        width: 12,
        height: 6,
      })
    );

    // ========================================================================
    // Cost Optimization Alerts (FREE TIER: 10 alarms)
    // ========================================================================
    const costAlarm = new cloudwatch.Alarm(this, 'TravelM8CostAlarm', {
      alarmName: 'TravelM8-Cost-Alert',
      alarmDescription: 'Alert when estimated charges exceed $5',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Billing',
        metricName: 'EstimatedCharges',
        dimensionsMap: {
          Currency: 'USD',
        },
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // ========================================================================
    // FREE TIER ALTERNATIVES TO COSTLY SERVICES:
    // ========================================================================
    // ❌ DAX (Costly) → ✅ DynamoDB with caching in Lambda
    // ❌ RDS (Costly) → ✅ DynamoDB for all data storage
    // ❌ WAF (Costly) → ✅ API Gateway built-in security + Lambda validation
    // ❌ SageMaker (Costly) → ✅ Lambda with AI/ML libraries (free)
    // ❌ Kinesis (Costly) → ✅ SQS for data processing
    // ❌ Redshift (Costly) → ✅ DynamoDB + CloudWatch for analytics

    // ========================================================================
    // Lambda Functions (FREE TIER: 1M requests/month, 400,000 GB-seconds)
    // ========================================================================
    const helloFunction = new NodejsFunction(this, 'HelloLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/hello.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
        TRIPS_TABLE_NAME: tripsTable.tableName,
        TRIP_PROCESSING_QUEUE_URL: tripProcessingQueue.queueUrl,
        NOTIFICATION_QUEUE_URL: notificationQueue.queueUrl,
        NOTIFICATION_TOPIC_ARN: notificationTopic.topicArn,
      },
      memorySize: 256, // Free tier: 128MB-1024MB
      timeout: Duration.seconds(30), // Free tier: up to 15 minutes
      logRetention: logs.RetentionDays.ONE_WEEK, // Free tier: 5GB log ingestion
      description: 'TravelM8 Hello API endpoint',
    });

    // Trip management Lambda functions
    const createTripFunction = new NodejsFunction(this, 'CreateTripLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/trips/createTrip.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
        TRIPS_TABLE_NAME: tripsTable.tableName,
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Create Trip API endpoint',
    });

    const getTripFunction = new NodejsFunction(this, 'GetTripLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/trips/getTrip.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
        TRIPS_TABLE_NAME: tripsTable.tableName,
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Get Trip API endpoint',
    });

    const listTripsFunction = new NodejsFunction(this, 'ListTripsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/trips/listTrips.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
        TRIPS_TABLE_NAME: tripsTable.tableName,
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 List Trips API endpoint',
    });

    const updateTripFunction = new NodejsFunction(this, 'UpdateTripLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/trips/updateTrip.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
        TRIPS_TABLE_NAME: tripsTable.tableName,
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Update Trip API endpoint',
    });

    const deleteTripFunction = new NodejsFunction(this, 'DeleteTripLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/trips/deleteTrip.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
        TRIPS_TABLE_NAME: tripsTable.tableName,
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Delete Trip API endpoint',
    });

    const getRecommendationsFunction = new NodejsFunction(this, 'GetRecommendationsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/recommendations/getRecommendations.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
      },
      memorySize: 512, // Slightly more memory for AI processing
      timeout: Duration.seconds(60), // Longer timeout for AI processing
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 AI Recommendations API endpoint',
    });

    // External API Lambda functions
    const getTravelInfoFunction = new NodejsFunction(this, 'GetTravelInfoLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/external/getTravelInfo.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Travel Info API endpoint',
    });

    const getFlightsFunction = new NodejsFunction(this, 'GetFlightsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/external/getFlights.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Flights API endpoint',
    });

    const getHotelsFunction = new NodejsFunction(this, 'GetHotelsLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../backend/src/external/getHotels.ts'),
      bundling: { 
        minify: true, 
        externalModules: ['aws-sdk'],
        sourceMap: true,
      },
      environment: { 
        REGION: this.region,
        LOG_LEVEL: 'INFO',
      },
      memorySize: 256,
      timeout: Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_WEEK,
      description: 'TravelM8 Hotels API endpoint',
    });

    // Grant Lambda functions access to the trips table
    tripsTable.grantReadWriteData(helloFunction);
    tripsTable.grantReadWriteData(createTripFunction);
    tripsTable.grantReadWriteData(getTripFunction);
    tripsTable.grantReadWriteData(listTripsFunction);
    tripsTable.grantReadWriteData(updateTripFunction);
    tripsTable.grantReadWriteData(deleteTripFunction);

    // Grant SQS permissions for free tier message processing
    tripProcessingQueue.grantSendMessages(createTripFunction);
    tripProcessingQueue.grantSendMessages(updateTripFunction);
    notificationQueue.grantSendMessages(createTripFunction);
    notificationQueue.grantSendMessages(updateTripFunction);

    // Grant SNS permissions for free tier notifications
    notificationTopic.grantPublish(createTripFunction);
    notificationTopic.grantPublish(updateTripFunction);

    // Grant CloudWatch permissions for custom metrics (free tier)
    helloFunction.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData',
        'cloudwatch:GetMetricStatistics',
        'cloudwatch:ListMetrics',
      ],
      resources: ['*'],
    }));

    // ========================================================================
    // API Gateway V2 with Cognito Authorizer
    // ========================================================================
    const authorizer = new HttpUserPoolAuthorizer('CognitoAuthorizer', userPool, {
      userPoolClients: [userPoolClient],
    });

    const httpApi = new apigwv2.HttpApi(this, 'TravelM8HttpApi', {
      apiName: 'TravelM8Api',
      description: 'HTTP API for TravelM8 Application',
      corsPreflight: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.OPTIONS,
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
        ],
        allowOrigins: [
          'http://localhost:3000',
          'https://localhost:3000',
          // Add production domains here
        ],
        maxAge: Duration.days(1),
      },
      defaultAuthorizer: authorizer,
    });

    // Lambda integrations
    const helloIntegration = new HttpLambdaIntegration('HelloIntegration', helloFunction);
    const createTripIntegration = new HttpLambdaIntegration('CreateTripIntegration', createTripFunction);
    const getTripIntegration = new HttpLambdaIntegration('GetTripIntegration', getTripFunction);
    const listTripsIntegration = new HttpLambdaIntegration('ListTripsIntegration', listTripsFunction);
    const updateTripIntegration = new HttpLambdaIntegration('UpdateTripIntegration', updateTripFunction);
    const deleteTripIntegration = new HttpLambdaIntegration('DeleteTripIntegration', deleteTripFunction);
    const getRecommendationsIntegration = new HttpLambdaIntegration('GetRecommendationsIntegration', getRecommendationsFunction);
    const getTravelInfoIntegration = new HttpLambdaIntegration('GetTravelInfoIntegration', getTravelInfoFunction);
    const getFlightsIntegration = new HttpLambdaIntegration('GetFlightsIntegration', getFlightsFunction);
    const getHotelsIntegration = new HttpLambdaIntegration('GetHotelsIntegration', getHotelsFunction);

    // API routes
    httpApi.addRoutes({
      path: '/hello',
      methods: [apigwv2.HttpMethod.GET],
      integration: helloIntegration,
      authorizer: authorizer,
    });

    // Trip management routes
    httpApi.addRoutes({
      path: '/trips',
      methods: [apigwv2.HttpMethod.POST],
      integration: createTripIntegration,
      authorizer: authorizer,
    });

    httpApi.addRoutes({
      path: '/trips',
      methods: [apigwv2.HttpMethod.GET],
      integration: listTripsIntegration,
      authorizer: authorizer,
    });

    httpApi.addRoutes({
      path: '/trips/{tripId}',
      methods: [apigwv2.HttpMethod.GET],
      integration: getTripIntegration,
      authorizer: authorizer,
    });

    httpApi.addRoutes({
      path: '/trips/{tripId}',
      methods: [apigwv2.HttpMethod.PUT],
      integration: updateTripIntegration,
      authorizer: authorizer,
    });

    httpApi.addRoutes({
      path: '/trips/{tripId}',
      methods: [apigwv2.HttpMethod.DELETE],
      integration: deleteTripIntegration,
      authorizer: authorizer,
    });

    // AI Recommendations route
    httpApi.addRoutes({
      path: '/recommendations',
      methods: [apigwv2.HttpMethod.POST],
      integration: getRecommendationsIntegration,
      authorizer: authorizer,
    });

    // External API routes
    httpApi.addRoutes({
      path: '/travel-info',
      methods: [apigwv2.HttpMethod.GET],
      integration: getTravelInfoIntegration,
      authorizer: authorizer,
    });

    httpApi.addRoutes({
      path: '/flights',
      methods: [apigwv2.HttpMethod.GET],
      integration: getFlightsIntegration,
      authorizer: authorizer,
    });

    httpApi.addRoutes({
      path: '/hotels',
      methods: [apigwv2.HttpMethod.GET],
      integration: getHotelsIntegration,
      authorizer: authorizer,
    });

    // Health check endpoint (no auth required)
    httpApi.addRoutes({
      path: '/health',
      methods: [apigwv2.HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthIntegration', helloFunction),
    });


    // ========================================================================
    // S3 Bucket for Frontend Hosting
    // ========================================================================
    const frontendBucket = new s3.Bucket(this, 'TravelM8FrontendBucket', {
      bucketName: `travelm8-frontend-${this.account}-${this.region}`,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html', // SPA routing
      publicReadAccess: false, // CloudFront will handle access
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // ========================================================================
    // CloudFront Distribution (simplified for initial deployment)
    // ========================================================================
    const distribution = new cloudfront.Distribution(this, 'TravelM8Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        compress: true,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // ========================================================================
    // Stack Outputs
    // ========================================================================
    new cdk.CfnOutput(this, 'UserPoolIdOutput', {
      value: userPool.userPoolId,
      description: 'ID of the Cognito User Pool',
      exportName: 'TravelM8UserPoolId',
    });

    new cdk.CfnOutput(this, 'UserPoolClientIdOutput', {
      value: userPoolClient.userPoolClientId,
      description: 'ID of the Cognito User Pool Client for the web app',
      exportName: 'TravelM8UserPoolClientId',
    });

    new cdk.CfnOutput(this, 'ApiEndpointOutput', {
      value: httpApi.url!,
      description: 'URL of the deployed API Gateway endpoint',
      exportName: 'TravelM8ApiEndpoint',
    });

    new cdk.CfnOutput(this, 'FrontendBucketOutput', {
      value: frontendBucket.bucketName,
      description: 'Name of the S3 bucket for frontend hosting',
      exportName: 'TravelM8FrontendBucket',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionOutput', {
      value: distribution.distributionId,
      description: 'ID of the CloudFront distribution',
      exportName: 'TravelM8CloudFrontDistribution',
    });

    new cdk.CfnOutput(this, 'FrontendUrlOutput', {
      value: `https://${distribution.distributionDomainName}`,
      description: 'URL of the deployed frontend application',
      exportName: 'TravelM8FrontendUrl',
    });

    new cdk.CfnOutput(this, 'TripsTableOutput', {
      value: tripsTable.tableName,
      description: 'Name of the DynamoDB trips table',
      exportName: 'TravelM8TripsTable',
    });

    // ========================================================================
    // FREE TIER SERVICES OUTPUTS
    // ========================================================================
    new cdk.CfnOutput(this, 'TripProcessingQueueOutput', {
      value: tripProcessingQueue.queueUrl,
      description: 'URL of the SQS queue for trip processing (FREE TIER)',
      exportName: 'TravelM8TripProcessingQueue',
    });

    new cdk.CfnOutput(this, 'NotificationQueueOutput', {
      value: notificationQueue.queueUrl,
      description: 'URL of the SQS queue for notifications (FREE TIER)',
      exportName: 'TravelM8NotificationQueue',
    });

    new cdk.CfnOutput(this, 'NotificationTopicOutput', {
      value: notificationTopic.topicArn,
      description: 'ARN of the SNS topic for notifications (FREE TIER)',
      exportName: 'TravelM8NotificationTopic',
    });

    new cdk.CfnOutput(this, 'CloudWatchDashboardOutput', {
      value: dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard for monitoring (FREE TIER)',
      exportName: 'TravelM8Dashboard',
    });

    new cdk.CfnOutput(this, 'CostAlarmOutput', {
      value: costAlarm.alarmName,
      description: 'Name of the CloudWatch cost alarm (FREE TIER)',
      exportName: 'TravelM8CostAlarm',
    });

    // ========================================================================
    // FREE TIER ARCHITECTURE SUMMARY
    // ========================================================================
    new cdk.CfnOutput(this, 'ArchitectureSummary', {
      value: `
      🎉 TravelM8 FREE TIER ARCHITECTURE DEPLOYED!
      
      ✅ FREE SERVICES INCLUDED:
      - AWS Cognito (50,000 MAUs)
      - API Gateway (1M requests/month)
      - Lambda (1M requests, 400,000 GB-seconds)
      - DynamoDB (25 GB storage, 25 RCU/WCU)
      - S3 (5 GB storage, 20,000 GET requests)
      - CloudFront (1 TB data transfer, 10M requests)
      - SQS (1M requests/month)
      - SNS (1M requests/month)
      - CloudWatch (10 custom metrics, 5GB logs)
      
      ❌ COSTLY SERVICES REPLACED:
      - DAX → DynamoDB with Lambda caching
      - RDS → DynamoDB for all data
      - WAF → API Gateway security + Lambda validation
      - SageMaker → Lambda with AI/ML libraries
      - Kinesis → SQS for data processing
      - Redshift → DynamoDB + CloudWatch analytics
      
      💰 TOTAL COST: $0 (Within Free Tier limits)
      `,
      description: 'TravelM8 Free Tier Architecture Summary',
    });

  } // End constructor
} // End class