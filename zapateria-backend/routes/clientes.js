const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET todos los clientes
router.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT id_cliente, nombre FROM clientes ORDER BY nombre ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
