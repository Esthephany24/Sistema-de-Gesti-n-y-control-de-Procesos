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

// POST registrar nuevo cliente
router.post('/', async (req, res) => {
    const { nombre } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del cliente es obligatorio.' });
    }

    try {
        const result = await pool.query(
            'INSERT INTO clientes (nombre) VALUES ($1) RETURNING id_cliente, nombre',
            [nombre.trim()]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
