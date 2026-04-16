import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// Crear instancia de Pool de PostgreSQL
const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Crear adaptador PrismaPg
const adapter = new PrismaPg(pool);

// Crear instancia de PrismaClient
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('⏳ Intentando crear administrador...');
  try {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash('admin123', salt);

    // Usamos el modelo 'usuarios' y el campo 'id_usuario' de tu schema
    const user = await prisma.usuarios.upsert({
      where: { email: 'admin@neumaticos.com' },
      update: { 
        password: hashed
      },
      create: {
        username: 'admin',
        email: 'admin@neumaticos.com',
        password: hashed,
        rol: 'admin',
        activo: true
      }
    });

    console.log('✅ Admin gestionado con éxito. ID:', user.id_usuario);
  } catch (e) {
    console.error('❌ Error en la base de datos:', e.message);
    console.error(e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();