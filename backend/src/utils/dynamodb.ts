import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

// Create DynamoDB client
const client = new DynamoDBClient({ region: process.env.REGION || 'us-east-1' });
export const docClient = DynamoDBDocumentClient.from(client);

export interface DynamoDBItem {
  [key: string]: any;
}

export interface QueryOptions {
  limit?: number;
  nextToken?: string;
  scanIndexForward?: boolean;
}

export interface ScanOptions {
  limit?: number;
  nextToken?: string;
}

/**
 * Put an item into DynamoDB
 */
export async function putItem(tableName: string, item: DynamoDBItem): Promise<void> {
  const command = new PutCommand({
    TableName: tableName,
    Item: item,
  });
  
  await docClient.send(command);
}

/**
 * Get an item from DynamoDB
 */
export async function getItem(tableName: string, key: DynamoDBItem): Promise<DynamoDBItem | null> {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  });
  
  const result = await docClient.send(command);
  return result.Item || null;
}

/**
 * Update an item in DynamoDB
 */
export async function updateItem(
  tableName: string, 
  key: DynamoDBItem, 
  updates: DynamoDBItem,
  conditionExpression?: string
): Promise<DynamoDBItem | null> {
  const updateExpression: string[] = [];
  const expressionAttributeNames: { [key: string]: string } = {};
  const expressionAttributeValues: { [key: string]: any } = {};

  // Build update expression
  Object.keys(updates).forEach((key, index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    
    updateExpression.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = updates[key];
  });

  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: `SET ${updateExpression.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: conditionExpression,
    ReturnValues: 'ALL_NEW',
  });
  
  const result = await docClient.send(command);
  return result.Attributes || null;
}

/**
 * Delete an item from DynamoDB
 */
export async function deleteItem(tableName: string, key: DynamoDBItem): Promise<void> {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  });
  
  await docClient.send(command);
}

/**
 * Query items from DynamoDB
 */
export async function queryItems(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeNames: { [key: string]: string },
  expressionAttributeValues: { [key: string]: any },
  options: QueryOptions = {}
): Promise<{ items: DynamoDBItem[]; nextToken?: string }> {
  const command = new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    Limit: options.limit,
    ExclusiveStartKey: options.nextToken ? JSON.parse(Buffer.from(options.nextToken, 'base64').toString()) : undefined,
    ScanIndexForward: options.scanIndexForward,
  });
  
  const result = await docClient.send(command);
  
  return {
    items: result.Items || [],
    nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
  };
}

/**
 * Scan items from DynamoDB
 */
export async function scanItems(
  tableName: string,
  options: ScanOptions = {}
): Promise<{ items: DynamoDBItem[]; nextToken?: string }> {
  const command = new ScanCommand({
    TableName: tableName,
    Limit: options.limit,
    ExclusiveStartKey: options.nextToken ? JSON.parse(Buffer.from(options.nextToken, 'base64').toString()) : undefined,
  });
  
  const result = await docClient.send(command);
  
  return {
    items: result.Items || [],
    nextToken: result.LastEvaluatedKey ? Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : undefined,
  };
}





