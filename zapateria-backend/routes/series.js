const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET todas las series
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_serie, descripcion FROM series');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET serie por id
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('SELECT id_serie, descripcion FROM series WHERE id_serie = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Serie no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST crear serie
router.post('/', async (req, res) => {
    const { descripcion } = req.body;
    if (!descripcion || !descripcion.trim()) return res.status(400).json({ error: 'Descripción es obligatoria' });
    try {
        const result = await pool.query('INSERT INTO series (descripcion) VALUES ($1) RETURNING id_serie, descripcion', [descripcion.trim()]);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('ERROR SERIES POST:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT actualizar serie
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { descripcion } = req.body;
    if (!descripcion || !descripcion.trim()) return res.status(400).json({ error: 'Descripción es obligatoria' });
    try {
        const result = await pool.query('UPDATE series SET descripcion = $1 WHERE id_serie = $2 RETURNING id_serie, descripcion', [descripcion.trim(), id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Serie no encontrada' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('ERROR SERIES PUT:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE serie
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM series WHERE id_serie = $1 RETURNING id_serie', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Serie no encontrada' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('ERROR SERIES DELETE:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
