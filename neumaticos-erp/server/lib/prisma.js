import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,                // máximo 10 conexiones simultáneas
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const adapter = new PrismaPg(pool);
export const prisma = new PrismaClient({ adapter });