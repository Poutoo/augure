import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

// Configuration du client postgres
const client = postgres(connectionString, { 
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false 
});

export const db = drizzle(client, { schema });
