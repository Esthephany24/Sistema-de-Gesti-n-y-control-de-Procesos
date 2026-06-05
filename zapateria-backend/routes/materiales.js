const express = require('express');
const router = express.Router();
const pool = require('../models/db');

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
    //console.log("BODY:", req.body);
    //console.log("STOCK_MINIMO:", req.body.stock_minimo);

    const { nombre, unidad_medida, stock_actual, stock_minimo } = req.body;
    const result = await pool.query(
      `INSERT INTO materiales (nombre, unidad_medida, stock_actual, stock_minimo) VALUES ($1, $2, $3, $4) RETURNING *`,
      [nombre, unidad_medida, stock_actual || 0, stock_minimo || 0]
    );
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
