import { prisma } from '../server/lib/prisma.js';

async function main() {
  const cuentas = await prisma.plan_cuentas.findMany({
    select: {
      id_cuenta: true,
      cuenta_contable: true,
      nombre: true,
      asentable: true
    }
  });
  console.log(JSON.stringify(cuentas, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
