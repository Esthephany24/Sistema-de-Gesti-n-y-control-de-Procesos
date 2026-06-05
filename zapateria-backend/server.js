const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- IMPORTAR RUTAS ---
const routesClientes = require('./routes/clientes');
const routesModelos = require('./routes/modelos');
const routesMateriales = require('./routes/materiales');
const routesSeries = require('./routes/series');
const routesPedidos = require('./routes/pedidos');
const routesProduccion = require('./routes/produccion');
const despachosRoutes = require('./routes/despachos');
const routesCatalogos = require('./routes/catalogos');

// --- REGISTRAR RUTAS ---
app.use('/api/clientes', routesClientes);
app.use('/api/modelos', routesModelos);
app.use('/api/series', routesSeries);
app.use('/api/pedidos', routesPedidos);
console.log('Mounting produccion routes...');
app.use('/api/produccion', routesProduccion);
console.log('Produccion routes mounted');
app.use('/api/despachos', despachosRoutes);
app.use('/api/materiales', routesMateriales);
app.use('/api/catalogos', routesCatalogos);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor de Zapatería corriendo en puerto ${PORT}`));