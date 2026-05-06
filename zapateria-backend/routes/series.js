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

module.exports = router;
