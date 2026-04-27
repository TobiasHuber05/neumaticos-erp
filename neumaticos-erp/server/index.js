import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import proveedoresRoutes from './routes/proveedores.routes.js';
import productosRoutes from './routes/productos.routes.js';
import comprasRoutes from './routes/pedidos.routes.js';
import cotizacionesRoutes from './routes/cotizaciones.routes.js';
import ordenesCompraRoutes from './routes/ordenesCompra.routes.js';
import conciliacionesRoutes from './routes/conciliaciones.routes.js';
import pagosProveedoresRoutes from './routes/pagosProveedores.routes.js';
import asientosRoutes from './routes/asientos.routes.js';
import contabilidadRoutes from './routes/contabilidad.routes.js';
import tesoreraRoutes from './routes/tesoreria.routes.js';
import movimientosRoutes from './routes/movimientos.routes.js';

//Funcionarios y Salarios
import cargosRouter from './routes/cargos.routes.js';
import funcionariosRouter from './routes/funcionarios.routes.js';
import salariosRouter from './routes/salarios.routes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/compras', comprasRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/ordenes-compra', ordenesCompraRoutes);
app.use('/api/pagos-proveedores', pagosProveedoresRoutes);
app.use('/api/contabilidad', contabilidadRoutes);
app.use('/api', asientosRoutes);
app.use('/api/tesoreria', tesoreraRoutes);
app.use('/api/movimientos-bancarios', movimientosRoutes);
app.use('/api/conciliaciones', conciliacionesRoutes);

//Funcionarios y Salarios
app.use('/api', cargosRouter);
app.use('/api', funcionariosRouter);
app.use('/api', salariosRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});