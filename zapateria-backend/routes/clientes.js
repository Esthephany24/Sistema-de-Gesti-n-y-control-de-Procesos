const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET todos los clientes

router.get('/', async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT id_cliente, nombre, apellido FROM clientes
            ORDER BY nombre ASC
        `);

        res.json(result.rows);

    } catch (err) {

        console.error('ERROR CLIENTES GET:', err);

        res.status(500).json({
            error: err.message
        });

    }

});

// POST registrar nuevo cliente

router.post('/', async (req, res) => {

    const { nombre, apellido } = req.body;

    if (
        !nombre ||
        !nombre.trim() ||
        !apellido ||
        !apellido.trim()
    ) {

        return res.status(400).json({
            error: 'Nombre y apellido son obligatorios.'
        });

    }

    try {

        const result = await pool.query(
            `
            INSERT INTO clientes
            (
                nombre,
                apellido
            )
            VALUES
            (
                $1,
                $2
            )
            RETURNING
                id_cliente,
                nombre,
                apellido
            `,
            [
                nombre.trim(),
                apellido.trim()
            ]
        );

        res.status(201).json(result.rows[0]);

    } catch (err) {

        console.error('ERROR CLIENTES POST:', err);

        res.status(500).json({
            error: err.message
        });

    }

});

module.exports = router;