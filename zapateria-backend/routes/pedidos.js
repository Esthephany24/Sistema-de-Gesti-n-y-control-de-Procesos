const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET lista de pedidos
router.get('/lista', async (req, res) => {
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
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST crear nuevo pedido
router.post('/', async (req, res) => {
    const { id_cliente, id_modelo, id_serie, detalles } = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

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
                const codigoQR = `QR-${idPedido}-${item.color.substring(0, 3).toUpperCase()}-${i}-${uniqueSuffix}`;

                await client.query(
                    'INSERT INTO control_docena (id_detalle, numero_docena, codigo_qr, estado_actual) VALUES ($1, $2, $3, $4)',
                    [idDetalle, i, codigoQR, 'CORTE']
                );
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Pedido registrado exitosamente", id_pedido: idPedido });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en transacción:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
