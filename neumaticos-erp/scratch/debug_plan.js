import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  console.log('--- Diagnóstico de Plan de Cuentas ---');
  
  try {
    // 1. Ver periodos
    const periodos = await prisma.proceso_contable.findMany();
    console.log('Periodos encontrados:', periodos.length);
    if (periodos.length > 0) {
      console.log('Periodos:', periodos.map(p => `ID: ${p.id_proc_contable}, Año: ${p.periodo_anho}, Estado: ${p.estado}`));
    } else {
      console.log('⚠️ ADVERTENCIA: No hay periodos contables.');
    }

    // 2. Ver si hay cuentas
    const cuentas = await prisma.plan_cuentas.findMany({ take: 5 });
    console.log('Cuentas encontradas:', cuentas.length);

    // 3. Intentar una creación de prueba
    console.log('Intentando crear cuenta de prueba...');
    const result = await prisma.plan_cuentas.create({
      data: {
        nombre: 'CUENTA PRUEBA',
        cuenta_contable: '9.9.99',
        asentable: true,
        nivel: 1,
        id_proc_contable: periodos.length > 0 ? periodos[0].id_proc_contable : null
      }
    });
    console.log('✅ Éxito al crear cuenta:', result.id_cuenta);
    // Limpiar
    await prisma.plan_cuentas.delete({ where: { id_cuenta: result.id_cuenta } });
  } catch (err) {
    console.error('❌ ERROR DETECTADO:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
