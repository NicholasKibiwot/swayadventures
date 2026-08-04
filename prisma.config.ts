// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // ✅ CORRECT: Pass the NAME of the variable from your .env file
    url: env("DIRECT_URL"), 
    
   
  },
});