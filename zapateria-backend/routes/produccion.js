const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET listado completo de docenas activas con relaciones
router.get('/trazabilidad', async (req, res) => {
  try {
    const query = `
      SELECT
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        p.id_pedido,
        c.id_cliente,
        COALESCE(m.nombre, 'N/D') AS modelo,
        COALESCE(dp.color, '') AS color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        COALESCE(o.id_operario, NULL) AS id_operario_asignado,
        COALESCE(o.nombre, '') AS operario_asignado,
        CASE WHEN o.id_operario IS NULL THEN false ELSE true END AS asignado
      FROM control_docena cd
      LEFT JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
      LEFT JOIN pedidos p ON dp.id_pedido = p.id_pedido
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
      LEFT JOIN series s ON dp.id_serie = s.id_serie
      LEFT JOIN LATERAL (
        SELECT tp.id_operario
        FROM trazabilidad_produccion tp
        WHERE tp.id_docena = cd.id_docena
          AND tp.etapa = cd.estado_actual
        ORDER BY tp.fecha_inicio DESC
        LIMIT 1
      ) tp ON true
      LEFT JOIN operarios o ON tp.id_operario = o.id_operario
      ORDER BY cd.estado_actual, cd.numero_docena;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get trazabilidad:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/trazabilidad/estado/:estado', async (req, res) => {
  const estado = (req.params.estado || '').toUpperCase();
  const etapasValidas = ['CORTE', 'APARADO', 'ARMADO', 'ACABADO'];

  if (!etapasValidas.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  try {
    const query = `
      SELECT
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        p.id_pedido,
        c.id_cliente,
        COALESCE(m.nombre, 'N/D') AS modelo,
        COALESCE(dp.color, '') AS color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        COALESCE(o.id_operario, NULL) AS id_operario_asignado,
        COALESCE(o.nombre, '') AS operario_asignado,
        COALESCE(dp.cantidad_docenas, 0) AS total_docenas_pedido,
        CASE WHEN o.id_operario IS NULL THEN false ELSE true END AS asignado
      FROM control_docena cd
      INNER JOIN trazabilidad_produccion tp ON cd.id_docena = tp.id_docena
        AND tp.etapa = $1
      LEFT JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
      LEFT JOIN pedidos p ON dp.id_pedido = p.id_pedido
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
      LEFT JOIN series s ON dp.id_serie = s.id_serie
      LEFT JOIN operarios o ON tp.id_operario = o.id_operario
      WHERE cd.estado_actual = $1
      ORDER BY p.id_pedido, cd.numero_docena;
    `;

    const result = await pool.query(query, [estado]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get trazabilidad por estado:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/operarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT id_operario, nombre, rol FROM operarios ORDER BY nombre');
    res.json(result.rows);
  } catch (err) {
    console.error('Error get operarios:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/asignar', async (req, res) => {
  const { id_docena, id_operario } = req.body;
  if (!id_docena || !id_operario) {
    return res.status(400).json({ error: 'id_docena y id_operario son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const selectRes = await client.query(
      'SELECT estado_actual FROM control_docena WHERE id_docena = $1 FOR UPDATE',
      [id_docena]
    );

    if (selectRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Docena no encontrada' });
    }

    const estadoActual = selectRes.rows[0].estado_actual;
    const etapaAsignada = estadoActual;

    await client.query(
      `INSERT INTO trazabilidad_produccion (id_docena, id_operario, etapa, fecha_inicio, observacion)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)`,
      [id_docena, id_operario, etapaAsignada, `Asignado para ${etapaAsignada}`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Operario asignado correctamente', id_docena, id_operario, etapa: estadoActual });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error asignar operario:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// PUT avance de docena: actualiza estado_actual e inserta traza
router.put('/avanzar', async (req, res) => {
  const { id_docena, id_operario } = req.body;
  if (!id_docena || !id_operario) {
    return res.status(400).json({ error: 'id_docena y id_operario son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const selectRes = await client.query(
      'SELECT estado_actual FROM control_docena WHERE id_docena = $1 FOR UPDATE',
      [id_docena]
    );

    if (selectRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Docena no encontrada' });
    }

    const estadoActual = selectRes.rows[0].estado_actual;
    const flujo = {
      CORTE: 'APARADO',
      APARADO: 'ARMADO',
      ARMADO: 'ACABADO',
      ACABADO: 'TERMINADO'
    };
    const siguienteEstado = flujo[estadoActual] || 'TERMINADO';

    // Actualizar el estado de la docena
    await client.query(
      'UPDATE control_docena SET estado_actual = $1 WHERE id_docena = $2',
      [siguienteEstado, id_docena]
    );

    // Solo registrar la FINALIZACIÓN de la etapa actual, no la asignación de la siguiente
    await client.query(
      `INSERT INTO trazabilidad_produccion (id_docena, id_operario, etapa, fecha_inicio, fecha_fin, observacion)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4)`,
      [id_docena, id_operario, estadoActual, `Finalizado ${estadoActual}`]
    );

    await client.query('COMMIT');
    res.json({ message: 'Docena actualizada', id_docena, estado_actual: siguienteEstado });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error avanzar docena:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
