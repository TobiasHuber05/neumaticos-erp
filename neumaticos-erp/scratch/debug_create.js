import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Intentando crear cuenta UENO...');
    const n = await prisma.plan_cuentas.create({
      data: {
        id_proc_contable: 2,
        cuenta_contable: '1',
        nombre: 'UENO',
        asentable: true,
        nivel: 1
      }
    });
    console.log('✅ Éxito:', n);
  } catch (e) {
    console.log('❌ ERROR DETECTADO:');
    console.log(JSON.stringify(e, null, 2));
    console.log(e.message);
  }
  process.exit(0);
}

main();
