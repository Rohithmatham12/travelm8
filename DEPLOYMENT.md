# TravelM8 Deployment Guide

This guide provides step-by-step instructions for deploying TravelM8 to AWS.

## 📋 Prerequisites

### Required Tools
- **Node.js 20+**: [Download](https://nodejs.org/)
- **AWS CLI**: [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS CDK**: `npm install -g aws-cdk`
- **Git**: [Download](https://git-scm.com/)

### AWS Account Setup
1. **Create AWS Account**: [Sign up](https://aws.amazon.com/)
2. **Configure AWS CLI**:
   ```bash
   aws configure
   ```
   Enter your:
   - AWS Access Key ID
   - AWS Secret Access Key
   - Default region (e.g., `us-east-1`)
   - Default output format (`json`)

3. **Create IAM User** (Recommended):
   - Create a user with programmatic access
   - Attach policies: `AdministratorAccess` (for development)
   - Use these credentials for AWS CLI

## 🚀 Quick Deployment

### 1. Clone Repository
```bash
git clone <repository-url>
cd travelm8
```

### 2. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install
cd ..

# Frontend dependencies
cd frontend
npm install
cd ..

# Infrastructure dependencies
cd infrastructure
npm install
cd ..
```

### 3. Bootstrap CDK (First Time Only)
```bash
cd infrastructure
cdk bootstrap
```

### 4. Deploy Infrastructure
```bash
cdk deploy
```

### 5. Configure Frontend
After deployment, note the CDK outputs and update frontend configuration:

```bash
cd frontend
cp env.example .env.local
```

Edit `.env.local` with the values from CDK outputs:
```env
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_API_ENDPOINT=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
REACT_APP_AWS_REGION=us-east-1
```

### 6. Start Development
```bash
npm start
```

## 🔧 Detailed Deployment Steps

### Step 1: Environment Setup

#### Verify Prerequisites
```bash
# Check Node.js version
node --version  # Should be 20+

# Check AWS CLI
aws --version

# Check CDK
cdk --version

# Check AWS credentials
aws sts get-caller-identity
```

#### Configure AWS Region
```bash
# Set default region
export AWS_DEFAULT_REGION=us-east-1

# Or update AWS CLI config
aws configure set region us-east-1
```

### Step 2: Infrastructure Deployment

#### Bootstrap CDK
```bash
cd infrastructure
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

#### Deploy Stack
```bash
# Deploy with approval
cdk deploy

# Deploy without approval (for CI/CD)
cdk deploy --require-approval never

# Deploy specific stack
cdk deploy TravelM8Stack
```

#### Verify Deployment
```bash
# List deployed stacks
cdk list

# Check stack status
aws cloudformation describe-stacks --stack-name TravelM8Stack
```

### Step 3: Backend Configuration

#### Environment Variables
The Lambda functions are automatically configured with:
- `REGION`: AWS region
- `LOG_LEVEL`: Logging level
- `TRIPS_TABLE_NAME`: DynamoDB table name

#### Test Backend
```bash
# Test health endpoint
curl https://YOUR_API_ENDPOINT/health

# Expected response:
# {"message": "TravelM8 API is healthy", "timestamp": "2024-01-01T00:00:00.000Z"}
```

### Step 4: Frontend Configuration

#### Environment Setup
```bash
cd frontend

# Copy environment template
cp env.example .env.local

# Edit with actual values
nano .env.local
```

#### Required Environment Variables
```env
REACT_APP_USER_POOL_ID=us-east-1_XXXXXXXXX
REACT_APP_USER_POOL_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXXXXX
REACT_APP_API_ENDPOINT=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
REACT_APP_AWS_REGION=us-east-1
```

#### Build and Test
```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build
```

### Step 5: Production Deployment

#### Update CORS Configuration
Edit `infrastructure/lib/infrastructure-stack.ts`:
```typescript
allowOrigins: [
  'https://your-production-domain.com',
  // Remove localhost for production
],
```

#### Deploy to Production
```bash
cd infrastructure
cdk deploy --context environment=production
```

#### Deploy Frontend to S3
```bash
cd frontend
npm run build

# Upload to S3
aws s3 sync build/ s3://YOUR_BUCKET_NAME --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

## 🔍 Verification

### 1. Health Check
```bash
curl https://YOUR_API_ENDPOINT/health
```

### 2. User Registration
1. Open the frontend application
2. Click "Sign Up"
3. Create a new account
4. Verify email (check console for verification code)

### 3. API Testing
```bash
# Get authentication token (after login)
# Use browser dev tools to copy JWT token

# Test trip creation
curl -X POST https://YOUR_API_ENDPOINT/trips \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Trip",
    "destination": "Paris, France",
    "startDate": "2024-07-01",
    "endDate": "2024-07-07",
    "travelers": 2,
    "preferences": {
      "accommodationType": "hotel",
      "budgetLevel": "mid-range"
    }
  }'
```

### 4. Frontend Testing
1. Navigate to the application
2. Sign up for a new account
3. Create a test trip
4. Verify trip appears in the list
5. Test trip details view

## 🚨 Troubleshooting

### Common Issues

#### 1. CDK Bootstrap Issues
```bash
# Error: CDK not bootstrapped
# Solution: Run bootstrap command
cdk bootstrap

# Error: Wrong account/region
# Solution: Check AWS credentials
aws sts get-caller-identity
```

#### 2. Deployment Failures
```bash
# Check CloudFormation events
aws cloudformation describe-stack-events --stack-name TravelM8Stack

# Check specific resource
aws cloudformation describe-stack-resource --stack-name TravelM8Stack --logical-resource-id TravelM8UserPool
```

#### 3. Frontend Configuration Issues
```bash
# Error: Invalid configuration
# Solution: Check environment variables
cat frontend/.env.local

# Error: CORS issues
# Solution: Update CORS configuration in infrastructure
```

#### 4. Authentication Issues
```bash
# Error: User pool not found
# Solution: Check User Pool ID in environment variables

# Error: Invalid token
# Solution: Check token format and expiration
```

### Debug Commands

#### Check Stack Status
```bash
aws cloudformation describe-stacks --stack-name TravelM8Stack --query 'Stacks[0].StackStatus'
```

#### View Lambda Logs
```bash
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/TravelM8

# View specific log group
aws logs tail /aws/lambda/TravelM8Stack-CreateTripLambda --follow
```

#### Check DynamoDB Table
```bash
aws dynamodb describe-table --table-name travelm8-trips
```

#### Test API Gateway
```bash
# List API Gateway APIs
aws apigatewayv2 get-apis

# Test specific endpoint
curl -v https://YOUR_API_ENDPOINT/health
```

## 🔒 Security Considerations

### 1. IAM Permissions
- Use least privilege principle
- Create specific IAM roles for production
- Rotate access keys regularly

### 2. Environment Variables
- Never commit `.env.local` to version control
- Use AWS Secrets Manager for sensitive data
- Rotate secrets regularly

### 3. CORS Configuration
- Restrict origins to known domains
- Remove localhost for production
- Use HTTPS only

### 4. API Security
- Enable API Gateway logging
- Monitor for unusual activity
- Set up CloudWatch alarms

## 💰 Cost Management

### 1. Monitor Costs
```bash
# Check current month costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost
```

### 2. Set Up Billing Alerts
```bash
# Create billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "TravelM8-Cost-Alert" \
  --alarm-description "Alert when costs exceed $5" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold
```

### 3. Clean Up Resources
```bash
# Destroy stack when not needed
cdk destroy

# Verify all resources are deleted
aws cloudformation describe-stacks --stack-name TravelM8Stack
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy TravelM8
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd infrastructure && npm install
          
      - name: Deploy CDK
        run: |
          cd infrastructure && cdk deploy --require-approval never
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          
      - name: Build frontend
        run: |
          cd frontend && npm install && npm run build
          
      - name: Deploy frontend
        run: |
          aws s3 sync frontend/build/ s3://${{ secrets.S3_BUCKET }} --delete
          aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

## 📞 Support

### Getting Help
1. Check the troubleshooting section above
2. Review AWS CloudFormation console for errors
3. Check CloudWatch logs for detailed error messages
4. Create an issue in the GitHub repository

### Useful Resources
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [React Documentation](https://reactjs.org/docs/)

---

**Happy Deploying! 🚀**





