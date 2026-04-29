const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// --- RUTAS DE DATOS MAESTROS ---
app.get('/api/clientes', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_cliente, nombre FROM clientes ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/modelos', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_modelo, nombre FROM modelos ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/series', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_serie, descripcion FROM series');
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/pedidos/lista', async (req, res) => {
    try {
        const query = `
            SELECT p.id_pedido, c.nombre as cliente, p.fecha_registro,
            SUM(dp.cantidad_docenas) as total_docenas
            FROM pedidos p
            JOIN clientes c ON p.id_cliente = c.id_cliente
            LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
            GROUP BY p.id_pedido, c.nombre
            ORDER BY p.fecha_registro DESC`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- REGISTRO DE PEDIDO CON PREVENCIÓN DE DUPLICADOS ---
app.post('/api/pedidos', async (req, res) => {
  const { id_cliente, id_modelo, id_serie, detalles } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN'); // Transacción profesional para asegurar integridad 

    const pedidoRes = await client.query(
      'INSERT INTO pedidos (id_cliente) VALUES ($1) RETURNING id_pedido',
      [id_cliente]
    );
    const idPedido = pedidoRes.rows[0].id_pedido;

    for (const item of detalles) {
      const detalleRes = await client.query(
        'INSERT INTO detalle_pedido (id_pedido, id_modelo, id_serie, color, cantidad_docenas) VALUES ($1, $2, $3, $4, $5) RETURNING id_detalle',
        [idPedido, id_modelo, id_serie, item.color, item.cantidad_docenas]
      );
      const idDetalle = detalleRes.rows[0].id_detalle;

      // Generación de Docenas con sufijo único para evitar errores de llave duplicada 
      for (let i = 1; i <= item.cantidad_docenas; i++) {
        const uniqueSuffix = Math.floor(Math.random() * 10000); 
        const codigoQR = `QR-${idPedido}-${item.color.substring(0,3).toUpperCase()}-${i}-${uniqueSuffix}`;
        
        await client.query(
          'INSERT INTO control_docena (id_detalle, numero_docena, codigo_qr, estado_actual) VALUES ($1, $2, $3, $4)',
          [idDetalle, i, codigoQR, 'CORTE']
        );
      }
    }

    await client.query('COMMIT'); 
    res.status(201).json({ message: "Pedido registrado exitosamente", id_pedido: idPedido });
  } catch (error) {
    await client.query('ROLLBACK'); // Evita datos incompletos en caso de error 
    console.error("Error en transacción:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Servidor de Zapatería corriendo en puerto ${PORT}`));