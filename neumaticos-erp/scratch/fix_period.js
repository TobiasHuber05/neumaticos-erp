import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Limpiando periodos...');
  await prisma.proceso_contable.deleteMany({});
  
  console.log('Creando periodo 2026...');
  const p = await prisma.proceso_contable.create({
    data: {
      periodo_anho: '2026',
      descripcion: 'Ejercicio Contable 2026',
      estado: 'Abierto',
      moneda: 'Gs',
      fecha_inicio: new Date('2026-01-01'),
      fecha_fin: new Date('2026-12-31')
    }
  });
  
  console.log('✅ Periodo Creado:', p);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
