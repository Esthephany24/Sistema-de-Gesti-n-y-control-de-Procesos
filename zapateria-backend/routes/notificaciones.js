const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET todas las notificaciones ordenadas por fecha DESC
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id_notificacion, titulo, mensaje, tipo, leido, fecha
       FROM notificaciones
       ORDER BY fecha DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error obteniendo notificaciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT marcar una notificación como leída
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `UPDATE notificaciones
       SET leido = true
       WHERE id_notificacion = $1
       RETURNING id_notificacion, titulo, mensaje, tipo, leido, fecha`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(`Error marcando notificación ${req.params.id} como leída:`, err);
    res.status(500).json({ error: err.message });
  }
});

// PUT marcar todas las notificaciones como leídas
router.put('/', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notificaciones
       SET leido = true
       WHERE leido = false
       RETURNING id_notificacion, titulo, mensaje, tipo, leido, fecha`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error marcando todas las notificaciones como leídas:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
