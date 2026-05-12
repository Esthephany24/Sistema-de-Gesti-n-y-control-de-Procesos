const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- IMPORTAR RUTAS ---
const routesClientes = require('./routes/clientes');
const routesModelos = require('./routes/modelos');
const routesSeries = require('./routes/series');
const routesPedidos = require('./routes/pedidos');
const routesProduccion = require('./routes/produccion');

// --- REGISTRAR RUTAS ---
app.use('/api/clientes', routesClientes);
app.use('/api/modelos', routesModelos);
app.use('/api/series', routesSeries);
app.use('/api/pedidos', routesPedidos);
app.use('/api/produccion', routesProduccion);

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor de Zapatería corriendo en puerto ${PORT}`));