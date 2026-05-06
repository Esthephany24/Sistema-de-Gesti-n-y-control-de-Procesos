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

module.exports = router;
