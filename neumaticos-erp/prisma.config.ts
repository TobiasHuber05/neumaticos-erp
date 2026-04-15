import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:5885@localhost:5432/neumatico?schema=public",
  },
});