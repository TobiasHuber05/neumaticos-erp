import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

const users = [
  { realName: 'Admin', username: 'admin', rol: 'ADMIN', email: 'admin@erp.com' },
  { realName: 'Tobias Huber', username: 'tobias.huber', rol: 'COMPRAS', email: 'tobias@erp.com' },
  { realName: 'Alex Gonzalez', username: 'alex.gonzalez', rol: 'VENTAS', email: 'alex@erp.com' },
  { realName: 'Shu Takahashi', username: 'shu.takahashi', rol: 'PERSONAL', email: 'shu@erp.com' },
  { realName: 'Sebastian Setrini', username: 'sebastian.setrini', rol: 'CONTABILIDAD', email: 'sebastian@erp.com' },
  { realName: 'Gabriel Bolla', username: 'gabriel.bolla', rol: 'SERVICIOS', email: 'gabriel@erp.com' },
];

async function seed() {
  console.log("🚀 Iniciando creación de usuarios...");
  const passwordHash = await bcrypt.hash('123456', 10);

  for (const u of users) {
    try {
      const existe = await prisma.usuarios.findFirst({
        where: {
          OR: [
            { username: u.username },
            { email: u.email }
          ]
        }
      });

      if (existe) {
        await prisma.usuarios.update({
          where: { id_usuario: existe.id_usuario },
          data: {
            username: u.username,
            rol_empresa: u.rol,
            passwordd: passwordHash,
            email: u.email
          }
        });
        console.log(`✅ Actualizado: ${u.realName} [${u.username}] - Rol: ${u.rol}`);
      } else {
        await prisma.usuarios.create({
          data: {
            username: u.username,
            email: u.email,
            passwordd: passwordHash,
            rol_empresa: u.rol
          }
        });
        console.log(`✨ Creado: ${u.realName} [${u.username}] - Rol: ${u.rol}`);
      }
    } catch (error) {
      console.error(`❌ Error con ${u.username}:`, error.message);
    }
  }

  console.log("\n🎉 Proceso completado.");
  console.log("🔑 Contraseña para todos: 123456");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
