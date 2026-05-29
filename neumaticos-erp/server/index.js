import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/auth.routes.js';
import usuariosRoutes from './routes/usuarios.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import productosRoutes from './routes/productos.routes.js';
import comprasRoutes from './routes/pedidos.routes.js';
import cotizacionesRoutes from './routes/cotizaciones.routes.js';
import ordenesCompraRoutes from './routes/ordenesCompra.routes.js';
import conciliacionesRoutes from './routes/conciliaciones.routes.js';
import pagosProveedoresRoutes from './routes/pagosProveedores.routes.js';
import cobranzasRoutes from './routes/cobranzas.routes.js';
import asientosRoutes from './routes/asientos.routes.js';
import tesoreraRoutes from './routes/tesoreria.routes.js';
import movimientosRoutes from './routes/movimientos.routes.js';
import planCuentasRoutes from './routes/planCuentas.routes.js';
import reportesComprasRoutes from './routes/reportesCompras.routes.js';
import asientosContablesRoutes from './routes/asientosContables.routes.js';
import periodosContablesRoutes from './routes/periodosContables.routes.js';
import reportesContablesRoutes from './routes/reportesContables.routes.js';

//Funcionarios y Salarios
import cargosRouter from './routes/cargos.routes.js';
import funcionariosRouter from './routes/funcionarios.routes.js';
import salariosRouter from './routes/salarios.routes.js';

//ventas
import clienteRoutes from './routes/cliente.routes.js';
import presupuestoRoutes from './routes/presupuesto.routes.js';
import facturaRoutes from './routes/facturaventa.routes.js';
import devolucionRoutes from './routes/devolucion.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', usuariosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);
app.use('/api/pagos-proveedores', pagosProveedoresRoutes);
app.use('/api/cobranzas', cobranzasRoutes);
app.use('/api', asientosRoutes);
app.use('/api/tesoreria', tesoreraRoutes);
app.use('/api/movimientos-bancarios', movimientosRoutes);
app.use('/api/conciliaciones', conciliacionesRoutes);
app.use('/api/contabilidad', planCuentasRoutes);
app.use('/api/asientos-contables', asientosContablesRoutes);
app.use('/api/periodos-contables', periodosContablesRoutes);
app.use('/api/reportes-contables', reportesContablesRoutes);
app.use('/api/reportes-compras', reportesComprasRoutes);

// --- MÓDULO DE CONTABILIDAD COMPLETADO ---


//Funcionarios y Salarios
app.use('/api', cargosRouter);
app.use('/api', funcionariosRouter);
app.use('/api', salariosRouter);
//ventas
app.use('/api/clientes', clienteRoutes);
app.use('/api/presupuestos', presupuestoRoutes);
app.use('/api/facturas', facturaRoutes);
app.use('/api/devoluciones', devolucionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});


const PORT = process.env.PORT || 3000;

const initializeAdmin = async () => {
  try {
    const { prisma } = await import('./lib/prisma.js');
    const adminExists = await prisma.usuarios.findFirst({
      where: { rol_empresa: 'admin' }
    });

    if (!adminExists) {
      const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || '123456';
      console.log('No se encontró administrador. Creando usuario admin inicial.');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(defaultPassword, salt);

      await prisma.usuarios.create({
        data: {
          username: 'admin',
          email: 'admin@neumaticos.com',
          passwordd: passwordHash,
          rol_empresa: 'admin'
        }
      });
      console.log('Admin inicial creado. Cambiá la contraseña después del primer ingreso.');
    } else {
      console.log('Administrador ya existe en la base de datos.');
    }
  } catch (error) {
    console.error('Error al inicializar admin:', error);
  }
};

app.listen(PORT, async () => {
  await initializeAdmin();
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
