const express = require('express');
const router = express.Router();
const pool = require('../models/db');

// GET todos los clientes

router.get('/', async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT id_cliente, nombre, apellido FROM clientes
            ORDER BY nombre ASC`
        );

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

// GET cliente por id
router.get('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('SELECT id_cliente, nombre, apellido FROM clientes WHERE id_cliente = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('ERROR CLIENTES GET BY ID:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT actualizar cliente
router.put('/:id', async (req, res) => {
    const id = req.params.id;
    const { nombre, apellido } = req.body;

    if (!nombre || !nombre.trim() || !apellido || !apellido.trim()) {
        return res.status(400).json({ error: 'Nombre y apellido son obligatorios.' });
    }

    try {
        const result = await pool.query(
            `UPDATE clientes SET nombre = $1, apellido = $2 WHERE id_cliente = $3 RETURNING id_cliente, nombre, apellido`,
            [nombre.trim(), apellido.trim(), id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('ERROR CLIENTES PUT:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE cliente
router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const result = await pool.query('DELETE FROM clientes WHERE id_cliente = $1 RETURNING id_cliente', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ deleted: true });
    } catch (err) {
        console.error('ERROR CLIENTES DELETE:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;