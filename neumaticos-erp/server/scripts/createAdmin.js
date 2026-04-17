import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('⏳ Iniciando creación de administrador con nueva estructura...');
  try {
    const hashed = await bcrypt.hash('admin123', 10);

    // 1. Crear la Persona (Requerido por funcionarios)
    const persona = await prisma.personas.create({
      data: {
        nombre: 'Admin',
        apellido: 'Principal',
        ruc: '1234567-0',
        ci: '1234567',
        tipo_persona: 'ADMIN',
        estado_civil: 'Soltero',
        sexo: 'Masculino'
      }
    });

    // 2. Crear el Funcionario (Requerido por usuarios)
    // Nota: Como no tenemos cargos creados, se deja en nulo si la DB lo permite, 
    // o podrías tener que crear un cargo primero.
    const funcionario = await prisma.funcionarios.create({
      data: {
        id_persona: persona.id_persona,
        // Si la DB exige cargo, deberías crear uno antes
      }
    });

    // 3. Crear el Usuario (Usando los nombres exactos de tu nuevo SQL)
    const user = await prisma.usuarios.create({
      data: {
        id_funcionario: funcionario.id_funcionario,
        email: 'admin@neumaticos.com',
        passwordd: hashed, // OJO: Tu SQL dice 'passwordd' con doble D
        rol_empresa: 'ADMIN'
      }
    });

    console.log('✅ Admin creado con éxito. ID Usuario:', user.id_usuario);
    console.log('📧 Email:', user.email);

  } catch (e) {
    console.error('❌ Error en la base de datos:', e.message);
    if (e.message.includes('foreign key constraint')) {
        console.error('💡 Tip: Asegúrate de que las tablas cargos u horarios no sean obligatorias.');
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();