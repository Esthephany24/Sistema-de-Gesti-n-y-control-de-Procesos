const express = require('express');
const router = express.Router();
const pool = require('../models/db');
const { notificarStockCriticoAutomatica } = require('../models/inventario');

// Listar todos los materiales
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM materiales
      ORDER BY id_material DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET asignaciones de materiales por pedido
router.get('/asignaciones', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pm.id_pedido AS id_pedido,
        COALESCE(mo.nombre, '') AS modelo,
        mat.nombre AS material,
        pm.cantidad_necesaria,
        pm.cantidad_reservada,
        pm.cantidad_faltante,
        pm.estado
      FROM pedido_material pm
      JOIN pedidos p ON pm.id_pedido = p.id_pedido
      JOIN materiales mat ON pm.id_material = mat.id_material
      LEFT JOIN detalle_pedido dp ON dp.id_pedido = pm.id_pedido
      LEFT JOIN modelos mo ON dp.id_modelo = mo.id_modelo
      ORDER BY pm.id_pedido DESC, pm.id_material ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/summary', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total_materiales,
        COALESCE(SUM(stock_actual), 0) AS total_stock_actual,
        COALESCE(SUM(stock_reservado), 0) AS total_stock_reservado,
        COUNT(*) FILTER (WHERE stock_actual <= stock_minimo) AS materiales_bajo_stock
      FROM materiales
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/stock-critico', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id_material,
        nombre,
        unidad_medida,
        stock_actual,
        stock_minimo,
        stock_reservado,
        GREATEST(stock_minimo - stock_actual, 0) AS faltante
      FROM materiales
      WHERE stock_actual <= stock_minimo
      ORDER BY stock_actual ASC, id_material ASC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/mas-usado', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id_material,
        m.nombre,
        COALESCE(SUM(ma.cantidad), 0) AS total_consumido
      FROM movimiento_almacen ma
      JOIN materiales m ON ma.id_material = m.id_material
      WHERE ma.tipo_movimiento = 'SALIDA'
      GROUP BY m.id_material, m.nombre
      ORDER BY total_consumido DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/consumo-mensual', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        m.id_material,
        m.nombre,
        COALESCE(SUM(ma.cantidad), 0) AS cantidad_consumida
      FROM movimiento_almacen ma
      JOIN materiales m ON ma.id_material = m.id_material
      WHERE ma.tipo_movimiento = 'SALIDA'
        AND ma.fecha >= date_trunc('month', CURRENT_DATE)
      GROUP BY m.id_material, m.nombre
      ORDER BY cantidad_consumida DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/check-stock-critico', async (req, res) => {
  try {
    const created = await notificarStockCriticoAutomatica();
    res.json({ creadas: created.length, materiales: created });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/kardex/:idMaterial', async (req, res) => {
  try {
    const idMaterial = parseInt(req.params.idMaterial, 10);
    if (Number.isNaN(idMaterial)) {
      return res.status(400).json({ error: 'idMaterial debe ser un número válido' });
    }

    const materialRes = await pool.query(
      `SELECT id_material, nombre, unidad_medida, stock_actual, stock_reservado, stock_minimo
       FROM materiales
       WHERE id_material = $1`,
      [idMaterial]
    );

    if (materialRes.rowCount === 0) {
      return res.status(404).json({ error: 'Material no encontrado' });
    }

    const movimientosRes = await pool.query(
      `SELECT id_movimiento, tipo_movimiento, cantidad, fecha, referencia
       FROM movimiento_almacen
       WHERE id_material = $1
       ORDER BY fecha DESC, id_movimiento DESC`,
      [idMaterial]
    );

    res.json({
      material: materialRes.rows[0],
      movimientos: movimientosRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET resumen de materiales por pedido
router.get('/resumen/:idPedido', async (req, res) => {
  try {
    const idPedido = parseInt(req.params.idPedido, 10);
    if (Number.isNaN(idPedido)) {
      return res.status(400).json({ error: 'idPedido debe ser un número válido' });
    }

    const result = await pool.query(`
      SELECT
        COUNT(*) AS cantidad_total_materiales,
        COUNT(*) FILTER (WHERE UPPER(estado) = 'RESERVADO') AS cantidad_reservada,
        COUNT(*) FILTER (WHERE UPPER(estado) = 'PARCIAL') AS cantidad_parcial,
        COUNT(*) FILTER (WHERE UPPER(estado) IN ('FALTANTE', 'SIN STOCK', 'SIN_STOCK')) AS cantidad_sin_stock,
        COALESCE(
          ROUND(
            CASE WHEN COUNT(*) = 0 THEN 0
            ELSE (COUNT(*) FILTER (WHERE cantidad_faltante = 0) * 100.0 / COUNT(*))
            END,
            2
          ),
          0
        ) AS porcentaje_completos
      FROM pedido_material
      WHERE id_pedido = $1
    `, [idPedido]);

    res.json(result.rows[0] || {
      cantidad_total_materiales: 0,
      cantidad_reservada: 0,
      cantidad_parcial: 0,
      cantidad_sin_stock: 0,
      porcentaje_completos: 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Obtener material por id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM materiales WHERE id_material = $1`, [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Material no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Crear nuevo material
router.post('/', async (req, res) => {
  try {
    const { nombre, unidad_medida, stock_actual, stock_minimo } = req.body;
    const result = await pool.query(
      `INSERT INTO materiales (nombre, unidad_medida, stock_actual, stock_minimo) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, unidad_medida, stock_actual || 0, stock_minimo || 0]
    );

    if ((stock_actual || 0) <= (stock_minimo || 0)) {
      await notificarStockCriticoAutomatica();
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Actualizar material
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, unidad_medida, stock_actual, stock_minimo } = req.body;
    await pool.query(
      `UPDATE materiales SET nombre = $1, unidad_medida = $2, stock_actual = $3, stock_minimo = $4 WHERE id_material = $5`,
      [nombre, unidad_medida, stock_actual, stock_minimo || 0, id]
    );

    if ((stock_actual || 0) <= (stock_minimo || 0)) {
      await notificarStockCriticoAutomatica();
    }

    res.json({ message: 'Material actualizado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Eliminar material
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM materiales WHERE id_material = $1`, [id]);
    res.json({ message: 'Material eliminado' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
