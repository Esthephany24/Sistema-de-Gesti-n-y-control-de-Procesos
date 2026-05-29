const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET lista de pedidos
router.get('/lista', async (req, res) => {
    try {
        const rawIdPedido = req.query.id_pedido;
        const idPedido = rawIdPedido ? parseInt(rawIdPedido, 10) : null;

        if (rawIdPedido && Number.isNaN(idPedido)) {
            return res.status(400).json({ error: 'id_pedido debe ser un número válido' });
        }

        let query = `
            SELECT p.id_pedido,CONCAT(c.nombre, ' ', c.apellido) AS cliente,
            p.fecha_registro,
            p.estado,
            P.total_doc_pedido
            FROM pedidos p
            JOIN clientes c ON p.id_cliente = c.id_cliente`;

        const params = [];
        if (idPedido) {
            query += `
            WHERE p.id_pedido = $1`;
            params.push(idPedido);
        }

        query += `
            GROUP BY p.id_pedido, c.nombre, c.apellido,P.fecha_registro, p.estado, P.total_doc_pedido
            ORDER BY p.fecha_registro DESC`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST crear nuevo pedido
router.post('/', async (req, res) => {
    const { id_cliente, id_modelo, id_serie, detalles } = req.body;
    const client = await pool.connect();
    if (!id_cliente || !id_modelo || !id_serie) {
        throw new Error('Faltan datos obligatorios');
    }
    try {
        await client.query('BEGIN');

        const pedidoRes = await client.query(
            'INSERT INTO pedidos (id_cliente, estado, total_doc_pedido) VALUES ($1,$2,$3) RETURNING id_pedido',
            [id_cliente, 'PENDIENTE', 0]
        );
        const idPedido = pedidoRes.rows[0].id_pedido;
        let totalDocenas = 0;

        for (const item of detalles) {
            totalDocenas += item.cantidad_docenas;
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
                    [idDetalle, i, codigoQR, 'Por cortar']
                );
            }
        }
        await client.query(
            `
            UPDATE pedidos
            SET total_doc_pedido = $1
            WHERE id_pedido = $2
            `,
            [totalDocenas, idPedido]
        );
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
