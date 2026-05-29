const express = require('express');
const router = express.Router();
const pool = require('../models/db');

router.get('/', async (req, res) => {
  try {
    const { q, numero_guia, id_pedido } = req.query;
    const conditions = [];
    const params = [];

    if (q) {
      const queryText = q.toString().trim();
      const orConditions = [];
      const pedidoMatch = queryText.match(/^\s*(?:P[-_\s]*)?(\d+)\s*$/i);
      if (pedidoMatch) {
        const idPedido = parseInt(pedidoMatch[1], 10);
        if (!Number.isNaN(idPedido)) {
          orConditions.push(`p.id_pedido = $${params.length + 1}`);
          params.push(idPedido);
        }
      }
      orConditions.push(`d.numero_guia ILIKE $${params.length + 1}`);
      params.push(`%${queryText}%`);
      conditions.push(`(${orConditions.join(' OR ')})`);
    }

    if (numero_guia) {
      conditions.push(`d.numero_guia ILIKE $${params.length + 1}`);
      params.push(`%${numero_guia.toString().trim()}%`);
    }

    if (id_pedido) {
      const pedidoId = parseInt(id_pedido.toString().trim(), 10);
      if (!Number.isNaN(pedidoId)) {
        conditions.push(`p.id_pedido = $${params.length + 1}`);
        params.push(pedidoId);
      }
    }

    let sql = `
      SELECT
        d.*,
        CONCAT(c.nombre, ' ', c.apellido) AS cliente
      FROM despachos d
      INNER JOIN pedidos p
        ON d.id_pedido = p.id_pedido
      LEFT JOIN clientes c
        ON p.id_cliente = c.id_cliente`;

    if (conditions.length) {
      sql += `\n      WHERE ${conditions.join(' OR ')}`;
    }

    sql += `\n      ORDER BY d.id_despacho DESC`;

    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

router.put('/:id/guia', async (req, res) => {

  try {

    const { id } = req.params;

    const {
      numero_guia,
      empresa_transporte
    } = req.body;

    await pool.query(
      `
      UPDATE despachos
      SET
        numero_guia = $1,
        empresa_transporte = $2,
        estado_envio = 'GUIA_GENERADA'
      WHERE id_despacho = $3
      `,
      [
        numero_guia,
        empresa_transporte,
        id
      ]
    );

    res.json({
      message:'Guía registrada'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

router.put('/:id/enviar', async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE despachos
      SET
        estado_envio = 'ENVIADO',
        fecha_envio = CURRENT_TIMESTAMP
      WHERE id_despacho = $1
      `,
      [id]
    );

    res.json({
      message:'Pedido enviado'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

router.put('/:id/entregar', async (req, res) => {

  const client = await pool.connect();

  try {

    await client.query('BEGIN');

    const { id } = req.params;

    const despacho = await client.query(
      `
      SELECT id_pedido
      FROM despachos
      WHERE id_despacho = $1
      `,
      [id]
    );

    const id_pedido = despacho.rows[0].id_pedido;

    await client.query(
      `
      UPDATE despachos
      SET
        estado_envio = 'ENTREGADO',
        fecha_entrega = CURRENT_TIMESTAMP
      WHERE id_despacho = $1
      `,
      [id]
    );

    await client.query(
      `
      UPDATE pedidos
      SET estado = 'ENTREGADO'
      WHERE id_pedido = $1
      `,
      [id_pedido]
    );

    await client.query('COMMIT');

    res.json({
      message:'Pedido entregado'
    });

  } catch (err) {

    await client.query('ROLLBACK');

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  } finally {

    client.release();

  }

});

module.exports = router;