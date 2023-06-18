import { Client } from 'pg';
import { getEnvVariableValueOrExit } from './helpers'
import { SecretsManager } from 'aws-sdk';

// Initialize Secrets Manager client
const secretsManager = new SecretsManager();

export async function getConnectedClient() {
  const { username, password, host, port } = await getPostgresCredentials();
  const connectionString = {
    user: username,
    password: password,
    host: host,
    port: port,
    database: username,
    ssl: { rejectUnauthorized: false }, // Adjust SSL options as needed
  };
  
  const client = new Client(connectionString);
  await client.connect();
  
  return client;
}

async function getPostgresCredentials(): Promise<{ username: string; password: string; host: string; port: number; dbInstanceIdentifier: string }> {
    const secretArn = getEnvVariableValueOrExit('POSTGRES_SECRET_ARN');
    const secret = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
  
    if (!secret.SecretString) {
      throw new Error('Failed to retrieve PostgreSQL secret.');
    }
    const { username, password, host, port, dbInstanceIdentifier } = JSON.parse(secret.SecretString);
    if (!username || !password || !host || !dbInstanceIdentifier || port === undefined) {
      throw new Error('Failed to retrieve necessary Postgres credentials, some variables are not set in the secret');
    }  
    
    return { username, password, host, port, dbInstanceIdentifier };
  }