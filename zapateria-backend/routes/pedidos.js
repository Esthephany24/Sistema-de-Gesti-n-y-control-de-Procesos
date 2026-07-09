const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const notificationService = require('../models/notificationService');
const { liberarReservasPedido } = require('../models/inventario');

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

// GET detalle de un pedido
router.get('/detalle/:id_pedido', async (req, res) => {
    try {
        const idPedido = parseInt(req.params.id_pedido, 10);

        if (Number.isNaN(idPedido)) {
            return res.status(400).json({ error: 'id_pedido debe ser un número válido' });
        }

        const headerQuery = `
            SELECT
                p.id_pedido,
                p.fecha_registro,
                p.estado,
                p.total_doc_pedido,
                CONCAT(c.nombre, ' ', c.apellido) AS cliente
            FROM pedidos p
            LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
            WHERE p.id_pedido = $1
            LIMIT 1
        `;

        const headerResult = await pool.query(headerQuery, [idPedido]);

        const modelSeriesQuery = `
            SELECT
                m.nombre AS modelo,
                s.descripcion AS serie
            FROM detalle_pedido dp
            LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
            LEFT JOIN series s ON dp.id_serie = s.id_serie
            WHERE dp.id_pedido = $1
            LIMIT 1
        `;

        const modelSeriesResult = await pool.query(modelSeriesQuery, [idPedido]);

        if (headerResult.rowCount === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const pedido = {
            id_pedido: headerResult.rows[0].id_pedido,
            cliente: headerResult.rows[0].cliente,
            fecha_registro: headerResult.rows[0].fecha_registro,
            estado: headerResult.rows[0].estado,
            total_doc_pedido: headerResult.rows[0].total_doc_pedido,
            modelo: modelSeriesResult.rows[0]?.modelo || null,
            serie: modelSeriesResult.rows[0]?.serie || null
        };

        const detailsQuery = `
            SELECT
                dp.id_detalle,
                dp.color,
                dp.cantidad_docenas
            FROM detalle_pedido dp
            WHERE dp.id_pedido = $1
            ORDER BY dp.id_detalle
        `;

        const detailsResult = await pool.query(detailsQuery, [idPedido]);

        const detalles = detailsResult.rows.map((row) => ({
            id_detalle: row.id_detalle,
            color: row.color,
            cantidad_docenas: row.cantidad_docenas
        }));

        res.json({ pedido, detalles });
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

        const materialesReservadosMap = new Map();
        const materialesFaltantesMap = new Map();

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

            const recetaRes = await client.query(
                'SELECT id_material, cantidad_por_docena FROM receta_modelo WHERE id_modelo = $1',
                [item.id_modelo]
            );

            for (const receta of recetaRes.rows) {
                const cantidadNecesaria = Number(receta.cantidad_por_docena || 0) * Number(item.cantidad_docenas || 0);
                if (cantidadNecesaria <= 0) continue;

                const materialRes = await client.query(
                    'SELECT nombre, unidad_medida, stock_actual, stock_reservado FROM materiales WHERE id_material = $1 FOR UPDATE',
                    [receta.id_material]
                );

                if (materialRes.rowCount === 0) {
                    throw new Error(`Material ${receta.id_material} no encontrado en la receta del modelo ${item.id_modelo}`);
                }

                const material = materialRes.rows[0];
                const stockActual = Number(material.stock_actual || 0);
                const stockReservado = Number(material.stock_reservado || 0);
                const stockDisponible = Math.max(0, stockActual - stockReservado);
                const cantidadReservada = Math.min(stockDisponible, cantidadNecesaria);
                const cantidadFaltante = Number((cantidadNecesaria - cantidadReservada).toFixed(4));
                const estadoMaterial = cantidadFaltante > 0 ? 'FALTANTE' : 'RESERVADO';

                if (cantidadReservada > 0) {
                    await client.query(
                        'INSERT INTO reserva_materiales (id_pedido, id_material, cantidad_reservada, cantidad_entregada, estado) VALUES ($1, $2, $3, $4, $5)',
                        [idPedido, receta.id_material, cantidadReservada, 0, estadoMaterial]
                    );

                    await client.query(
                        'UPDATE materiales SET stock_reservado = stock_reservado + $1 WHERE id_material = $2',
                        [cantidadReservada, receta.id_material]
                    );

                    const acumulado = materialesReservadosMap.get(receta.id_material) || {
                        material: material.nombre,
                        cantidad: 0,
                        unidad: material.unidad_medida || ''
                    };
                    acumulado.cantidad += cantidadReservada;
                    materialesReservadosMap.set(receta.id_material, acumulado);
                }

                if (cantidadFaltante > 0) {
                    const acumulado = materialesFaltantesMap.get(receta.id_material) || {
                        material: material.nombre,
                        faltante: 0,
                        unidad: material.unidad_medida || ''
                    };
                    acumulado.faltante += cantidadFaltante;
                    materialesFaltantesMap.set(receta.id_material, acumulado);
                }

                await client.query(
                    'INSERT INTO pedido_material (id_pedido, id_material, cantidad_necesaria, cantidad_reservada, cantidad_faltante, estado) VALUES ($1, $2, $3, $4, $5, $6)',
                    [idPedido, receta.id_material, cantidadNecesaria, cantidadReservada, cantidadFaltante, estadoMaterial]
                );
            }
        }

        // Las reservas se consumen cuando la producción inicia en Por cortar.
        await client.query(
            `
            UPDATE pedidos
            SET total_doc_pedido = $1
            WHERE id_pedido = $2
            `,
            [totalDocenas, idPedido]
        );

        const reservados = Array.from(materialesReservadosMap.values());
        const faltantes = Array.from(materialesFaltantesMap.values());
        let titulo;
        let mensaje;
        let tipo;

        if (reservados.length > 0 && faltantes.length === 0) {
            titulo = 'Materiales reservados';
            mensaje = `Se reservaron correctamente los materiales para el pedido #${idPedido}.`;
            tipo = 'SUCCESS';
        } else if (reservados.length > 0 && faltantes.length > 0) {
            titulo = 'Material insuficiente';
            mensaje = `Pedido #${idPedido} tiene materiales pendientes.`;
            tipo = 'WARNING';
        } else {
            titulo = 'Pedido detenido';
            mensaje = `No existe stock para iniciar el pedido #${idPedido}.`;
            tipo = 'ERROR';
        }

        await notificationService.crearNotificacion(titulo, mensaje, tipo);
        await client.query('COMMIT');

        res.status(201).json({
            message: "Pedido registrado exitosamente",
            id_pedido: idPedido,
            materiales_reservados: reservados,
            materiales_faltantes: faltantes
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en transacción:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

router.put('/:id/cancelar', async (req, res) => {
    const idPedido = parseInt(req.params.id, 10);
    if (Number.isNaN(idPedido)) {
        return res.status(400).json({ error: 'id_pedido debe ser un número válido' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const pedidoRes = await client.query(
            'SELECT estado FROM pedidos WHERE id_pedido = $1 FOR UPDATE',
            [idPedido]
        );

        if (pedidoRes.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }

        const estadoActual = pedidoRes.rows[0].estado;
        if (estadoActual === 'CANCELADO') {
            await client.query('ROLLBACK');
            return res.status(200).json({ message: 'Pedido ya estaba cancelado' });
        }

        await client.query(
            'UPDATE pedidos SET estado = $1 WHERE id_pedido = $2',
            ['CANCELADO', idPedido]
        );

        const reservasLiberadas = await liberarReservasPedido(client, idPedido);

        if (reservasLiberadas > 0) {
            await notificationService.crearNotificacion(
                'Reserva liberada',
                `Se liberaron las reservas del pedido #${idPedido}.`,
                'WARNING'
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Pedido cancelado y reservas liberadas', reservas_liberadas: reservasLiberadas });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error cancelando pedido:', error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

module.exports = router;
