const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET todos los modelos
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_modelo, nombre FROM modelos ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET modelo por id
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('SELECT id_modelo, nombre FROM modelos WHERE id_modelo = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Modelo no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST crear modelo
router.post('/', async (req, res) => {
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre es obligatorio' });
    try {
        const result = await pool.query('INSERT INTO modelos (nombre) VALUES ($1) RETURNING id_modelo, nombre', [nombre.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('ERROR MODELOS POST:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT actualizar modelo
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre } = req.body;
    if (!nombre || !nombre.trim()) return res.status(400).json({ error: 'Nombre es obligatorio' });
    try {
        const result = await pool.query('UPDATE modelos SET nombre = $1 WHERE id_modelo = $2 RETURNING id_modelo, nombre', [nombre.trim(), id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Modelo no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('ERROR MODELOS PUT:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE modelo
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM modelos WHERE id_modelo = $1 RETURNING id_modelo', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Modelo no encontrado' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('ERROR MODELOS DELETE:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
