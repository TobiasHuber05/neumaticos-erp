import { defineConfig } from '@prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://postgres:158064350@localhost:5432/neumatico?schema=public",
  },
});