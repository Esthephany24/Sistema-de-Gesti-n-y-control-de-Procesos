const express = require('express');
const router = express.Router();
const pool = require('../models/db');

console.log('Loading produccion routes...');

const STATE_ALIASES = {
  POR_CORTAR: 'Por cortar',
  CORTADO: 'Cortado',
  CORTE: 'Cortado',
  ALISTADO: 'Alistado',
  APARADO: 'Aparado',
  EMPASTADO: 'Empastado',
  ARMADO: 'Armado',
  PEGADO: 'Pegado',
  REMATADO: 'Rematado',
  DOC_ACABADO: 'Doc. Acabadas',
  TERMINADO: 'Doc. Acabadas'
};

const translateStage = (estado) => {
  if (!estado) return null;
  return STATE_ALIASES[estado.toUpperCase()] || null;
};

const mapStageName = (estado) => {
  const normalized = translateStage(estado);
  if (!normalized) return null;
  return normalized === 'TERMINADO' && estado.toUpperCase() === 'DOC_ACABADO' ? 'DOC_ACABADO' : normalized;
};

const STAGE_KEYS = [
  'POR_CORTAR',
  'CORTADO',
  'ALISTADO',
  'APARADO',
  'EMPASTADO',
  'ARMADO',
  'PEGADO',
  'REMATADO',
  'DOC_ACABADO'
];

const stageToDbState = (stageKey) => {
  if (!stageKey) return null;
  
  const normalizado = stageKey.toLowerCase().trim();
  
  // Mapeo directo de estados como vienen del frontend o DB
  const stateMap = {
    'por cortar': 'Por cortar',
    'cortado': 'Cortado',
    'alistado': 'Alistado',
    'aparado': 'Aparado',
    'empastado': 'Empastado',
    'armado': 'Armado',
    'pegado': 'Pegado',
    'rematado': 'Rematado',
    'doc. acabadas': 'Doc. Acabadas',
    'terminado': 'Doc. Acabadas'
  };
  
  return stateMap[normalizado] || null;
};

const stageProgressFlow = {
  'Por cortar': 'Cortado',
  'Cortado': 'Alistado',
  'Alistado': 'Aparado',
  'Aparado': 'Empastado',
  'Empastado': 'Armado',
  'Armado': 'Pegado',
  'Pegado': 'Rematado',
  'Rematado': 'Doc. Acabadas',
  'Doc. Acabadas': 'Doc. Acabadas'
};

const stageRoleMap = {
  'Por cortar': 'Cortado',
  'Cortado': 'Alistado',
  'Alistado': 'Aparado',
  'Aparado': 'Empastado',
  'Empastado': 'Armado',
  'Armado': 'Pegado',
  'Pegado': 'Rematado',
  'Rematado': 'Rematado'
};

const operarioRolMap = {
  'Por cortar': 'CORTADO',
  'Cortado': 'ALISTADO',
  'Alistado': 'APARADO',
  'Aparado': 'EMPASTADO',
  'Empastado': 'ARMADO',
  'Armado': 'PEGADO',
  'Pegado': 'REMATADO',
  'Rematado': 'REMATADO'
};

router.get('/trazabilidad', async (req, res) => {
  try {
    const query = `
      SELECT
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        p.id_pedido,
        COALESCE(c.id_cliente, 0) AS id_cliente,
        COALESCE(m.nombre, 'N/D') AS modelo,
        COALESCE(dp.color, '') AS color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        COALESCE(dp.cantidad_docenas, 0) AS total_docenas_pedido,
        CASE WHEN EXISTS (
          SELECT 1 FROM trazabilidad_produccion tp WHERE tp.id_docena = cd.id_docena
        ) THEN true ELSE false END AS asignado,
        COALESCE(o.id_operario, NULL) AS id_operario_asignado,
        CONCAT(COALESCE(o.nombre, ''), ' ', COALESCE(o.apellido, '')) AS operario_asignado,
        tp.fecha_inicio,
        tp.fecha_fin
      FROM control_docena cd
      LEFT JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
      LEFT JOIN pedidos p ON dp.id_pedido = p.id_pedido
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
      LEFT JOIN series s ON dp.id_serie = s.id_serie
      LEFT JOIN trazabilidad_produccion tp ON tp.id_docena = cd.id_docena AND tp.fecha_fin IS NULL
      LEFT JOIN operarios o ON tp.id_operario = o.id_operario
      ORDER BY p.id_pedido, cd.numero_docena;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get trazabilidad:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/secciones', async (req, res) => {
  try {
    const query = `
      SELECT 'POR_CORTAR' AS stage, COUNT(*) FROM obtener_docenas_por_estado('Por cortar')
      UNION ALL
      SELECT 'CORTADO', COUNT(*) FROM obtener_docenas_por_estado('Cortado')
      UNION ALL
      SELECT 'ALISTADO', COUNT(*) FROM obtener_docenas_por_estado('Alistado')
      UNION ALL
      SELECT 'APARADO', COUNT(*) FROM obtener_docenas_por_estado('Aparado')
      UNION ALL
      SELECT 'EMPASTADO', COUNT(*) FROM obtener_docenas_por_estado('Empastado')
      UNION ALL
      SELECT 'ARMADO', COUNT(*) FROM obtener_docenas_por_estado('Armado')
      UNION ALL
      SELECT 'PEGADO', COUNT(*) FROM obtener_docenas_por_estado('Pegado')
      UNION ALL
      SELECT 'REMATADO', COUNT(*) FROM obtener_docenas_por_estado('Rematado')
      UNION ALL
      SELECT 'DOC_ACABADO', COUNT(*) FROM obtener_docenas_por_estado('Doc. Acabadas');
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get secciones:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/trazabilidad/estado/:estado', async (req, res) => {
  const estado = (req.params.estado || '').trim();
  const dbState = stageToDbState(estado);

  if (!dbState) {
    return res.status(400).json({ error: 'Estado inválido: ' + estado });
  }

  try {
    const query = `
      SELECT *
      FROM obtener_docenas_por_estado($1)
      ORDER BY id_pedido, numero_docena;
    `;
    const params = [dbState];
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get trazabilidad por estado:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/trazabilidad/buscar', async (req, res) => {
  try {
    const { id_docena, codigo_qr, estado } = req.query;
    const trimmedId = id_docena ? String(id_docena).trim() : '';
    const trimmedQr = codigo_qr ? String(codigo_qr).trim() : '';
    const trimmedEstado = estado ? String(estado).trim() : '';

    if (!trimmedId && !trimmedQr) {
      return res.status(400).json({ error: 'Debes enviar id_docena o codigo_qr' });
    }

    const params = [];
    let query = `
      SELECT
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        p.id_pedido,
        COALESCE(m.nombre, 'N/D') AS modelo,
        COALESCE(dp.color, '') AS color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        CASE WHEN EXISTS (
          SELECT 1 FROM trazabilidad_produccion tp WHERE tp.id_docena = cd.id_docena AND tp.fecha_fin IS NULL
        ) THEN true ELSE false END AS asignado,
        COALESCE(o.id_operario, NULL) AS id_operario_asignado,
        CONCAT(COALESCE(o.nombre, ''), ' ', COALESCE(o.apellido, '')) AS operario_asignado
      FROM control_docena cd
      LEFT JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
      LEFT JOIN pedidos p ON dp.id_pedido = p.id_pedido
      LEFT JOIN modelos m ON dp.id_modelo = m.id_modelo
      LEFT JOIN series s ON dp.id_serie = s.id_serie
      LEFT JOIN trazabilidad_produccion tp ON tp.id_docena = cd.id_docena AND tp.fecha_fin IS NULL
      LEFT JOIN operarios o ON tp.id_operario = o.id_operario
      WHERE 1=1
    `;

    if (trimmedId) {
      params.push(parseInt(trimmedId, 10));
      query += ` AND cd.id_docena = $${params.length}`;
    }

    if (trimmedQr) {
      params.push(trimmedQr);
      query += ` AND cd.codigo_qr = $${params.length}`;
    }

    if (trimmedEstado) {
      const dbState = stageToDbState(trimmedEstado) || trimmedEstado;
      params.push(dbState);
      query += ` AND cd.estado_actual = $${params.length}`;
    }

    query += ` ORDER BY p.id_pedido, cd.numero_docena;`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error buscar docena:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/trazabilidad/operarios/:estado', async (req, res) => {

  const estado = (req.params.estado || '').trim();
  const dbState = stageToDbState(estado);

  if (!dbState) {
    return res.status(400).json({
      error: 'Estado inválido: ' + estado
    });
  }

  try {

    const query = `
      SELECT
        d.*,

        CASE
          WHEN tp.id_operario IS NOT NULL THEN true
          ELSE false
        END AS asignado,

        COALESCE(o.id_operario, 0)
          AS id_operario_asignado,

        COALESCE(
          CONCAT(o.nombre, ' ', o.apellido),
          ''
        ) AS operario_asignado

      FROM obtener_docenas_por_estado($1) d

      LEFT JOIN trazabilidad_produccion tp
        ON tp.id_docena = d.id_docena
        AND tp.fecha_fin IS NULL

      LEFT JOIN operarios o
        ON o.id_operario = tp.id_operario

      ORDER BY d.id_pedido, d.numero_docena;
    `;

    const result = await pool.query(query, [dbState]);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

router.get('/operarios', async (req, res) => {
  try {
    const { rol } = req.query;
    
    if (rol) {

      const result = await pool.query(
        `
        SELECT
          id_operario,
          nombre,
          apellido,
          rol
        FROM operarios
        WHERE UPPER(rol) = UPPER($1)
        ORDER BY nombre
        `,
        [rol]
      );

      return res.json(result.rows);
    }
  } catch (err) {
    console.error('Error get operarios:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/asignar', async (req, res) => {
  const { id_docena, id_operario, observacion } = req.body;
  if (!id_docena || !id_operario) {
    return res.status(400).json({ error: 'id_docena y id_operario son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const selectRes = await client.query(
      'SELECT estado_actual FROM control_docena WHERE id_docena = $1 FOR UPDATE',
      [id_docena]
    );

    if (selectRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Docena no encontrada' });
    }

    const estadoActual = selectRes.rows[0].estado_actual;
    const etapaAsignada = estadoActual;
    const obs = observacion || `Asignado para ${etapaAsignada}`;

    await client.query(
      `INSERT INTO trazabilidad_produccion (id_docena, id_operario, etapa, fecha_inicio, observacion)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)`,
      [id_docena, id_operario, etapaAsignada, obs]
    );

    await client.query('COMMIT');
    res.json({ message: 'Operario asignado correctamente', id_docena, id_operario, etapa: estadoActual });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error asignar operario:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.put('/avanzar', async (req, res) => {
  const { id_docena, id_pedido, estado_actual, id_operario, observacion } = req.body;
  if (!id_operario || (!id_docena && !id_pedido)) {
    return res.status(400).json({ error: 'id_operario y id_docena o id_pedido son obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (id_docena) {
      const selectRes = await client.query(
        'SELECT estado_actual FROM control_docena WHERE id_docena = $1 FOR UPDATE',
        [id_docena]
      );

      if (selectRes.rowCount === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Docena no encontrada' });
      }

      const estadoActual = selectRes.rows[0].estado_actual;
      const siguienteEstado = stageProgressFlow[estadoActual] || 'Doc. Acabadas';
      const obs = observacion || `Finalizado ${estadoActual}`;

      await client.query(
        'UPDATE control_docena SET estado_actual = $1 WHERE id_docena = $2',
        [siguienteEstado, id_docena]
      );

      // Verificar si todo el pedido ya terminó

    const pedidoResult = await client.query(
      `
      SELECT dp.id_pedido
      FROM detalle_pedido dp
      INNER JOIN control_docena cd
        ON dp.id_detalle = cd.id_detalle
      WHERE cd.id_docena = $1
      LIMIT 1
      `,
      [id_docena]
    );

    const idPedido = pedidoResult.rows[0].id_pedido;

    // Validar si todas las docenas están acabadas

    const validarFinalizado = await client.query(
      `
      SELECT COUNT(*) AS pendientes
      FROM control_docena cd
      INNER JOIN detalle_pedido dp
        ON cd.id_detalle = dp.id_detalle
      WHERE dp.id_pedido = $1
      AND cd.estado_actual <> 'Doc. Acabadas'
      `,
      [idPedido]
    );

    if (parseInt(validarFinalizado.rows[0].pendientes) === 0) {

      // Pedido COMPLETADO

      await client.query(
        `
        UPDATE pedidos
        SET estado = 'COMPLETADO'
        WHERE id_pedido = $1
        `,
        [idPedido]
      );

      // Crear registro inicial de despacho

      await client.query(
        `
        INSERT INTO despachos (id_pedido)
        VALUES ($1)
        `,
        [idPedido]
      );
    }

      // FINALIZAR asignacion activa actual

      await client.query(
        `
        UPDATE trazabilidad_produccion
        SET fecha_fin = CURRENT_TIMESTAMP
        WHERE id_docena = $1
        AND etapa = $2
        AND fecha_fin IS NULL
        `,
        [id_docena, estadoActual]
      );

      // Registrar historial del avance

      await client.query(
        `
        INSERT INTO trazabilidad_produccion
        (
          id_docena,
          id_operario,
          etapa,
          fecha_inicio,
          fecha_fin,
          observacion
        )
        VALUES
        (
          $1,
          $2,
          $3,
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP,
          $4
        )
        `,
        [
          id_docena,
          id_operario,
          estadoActual,
          obs
        ]
      );

      await client.query('COMMIT');
      return res.json({ message: 'Docena actualizada', id_docena, estado_actual: siguienteEstado });
    }

    const dbState = stageToDbState(estado_actual);
    if (!dbState) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Estado_actual inválido: ' + estado_actual });
    }

    const selectRes = await client.query(
      `SELECT cd.id_docena FROM control_docena cd
       INNER JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
       WHERE dp.id_pedido = $1 AND cd.estado_actual = $2
       FOR UPDATE`,
      [id_pedido, dbState]
    );

    if (selectRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No se encontraron docenas activas para este pedido y estado' });
    }

    const ids = selectRes.rows.map((row) => row.id_docena);
    const siguienteEstado = stageProgressFlow[dbState] || 'Doc. Acabadas';
    const obs = observacion || `Finalizado ${dbState}`;

    await client.query(
      'UPDATE control_docena SET estado_actual = $1 WHERE id_docena = ANY($2::int[])',
      [siguienteEstado, ids]
    );

    const insertText = `
      INSERT INTO trazabilidad_produccion (id_docena, id_operario, etapa, fecha_inicio, fecha_fin, observacion)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $4)
    `;

    for (const id of ids) {
      await client.query(insertText, [id, id_operario, dbState, obs]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Pedido actualizado', id_pedido, estado_actual: siguienteEstado, cantidad_actualizada: ids.length });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error avanzar lote o docena:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.get('/trazabilidad/completadas', async (req, res) => {
  try {
    const query = `
      SELECT
        p.id_pedido,
        CONCAT(c.nombre, ' ', c.apellido) AS cliente,
        SUM(dp.cantidad_docenas) AS total_docenas,
        COUNT(cd.id_docena) AS docenas_acabadas,
        ROUND(
          COALESCE(COUNT(cd.id_docena)::numeric / NULLIF(SUM(dp.cantidad_docenas), 0) * 100, 0),
          2
        ) AS porcentaje_avance
      FROM control_docena cd
      INNER JOIN detalle_pedido dp ON cd.id_detalle = dp.id_detalle
      INNER JOIN pedidos p ON dp.id_pedido = p.id_pedido
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      WHERE cd.estado_actual = 'TERMINADO'
      GROUP BY p.id_pedido, c.nombre, c.apellido
      ORDER BY p.id_pedido;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get docenas completadas:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/trazabilidad/doc-acabado', async (req, res) => {
  try {

    const query = `
      SELECT
        p.id_pedido,
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        m.nombre AS modelo,
        dp.color,
        s.descripcion AS serie,

        p.total_doc_pedido,

        COUNT(cd2.id_docena) FILTER (
          WHERE cd2.estado_actual = 'Doc. Acabadas'
        ) AS docenas_terminadas,

        ROUND(
          (
            COUNT(cd2.id_docena) FILTER (
              WHERE cd2.estado_actual = 'Doc. Acabadas'
            )::numeric
            / NULLIF(p.total_doc_pedido, 0)
          ) * 100,
          2
        ) AS porcentaje_avance

      FROM control_docena cd

      INNER JOIN detalle_pedido dp
        ON cd.id_detalle = dp.id_detalle

      INNER JOIN pedidos p
        ON dp.id_pedido = p.id_pedido

      LEFT JOIN modelos m
        ON dp.id_modelo = m.id_modelo

      LEFT JOIN series s
        ON dp.id_serie = s.id_serie

      LEFT JOIN detalle_pedido dp2
        ON p.id_pedido = dp2.id_pedido

      LEFT JOIN control_docena cd2
        ON dp2.id_detalle = cd2.id_detalle

      WHERE cd.estado_actual = 'Doc. Acabadas'

      GROUP BY
        p.id_pedido,
        cd.id_docena,
        cd.numero_docena,
        cd.codigo_qr,
        cd.estado_actual,
        m.nombre,
        dp.color,
        s.descripcion,
        p.total_doc_pedido

      ORDER BY p.id_pedido, cd.numero_docena;
    `;

    const result = await pool.query(query);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.message
    });
  }
});

router.get('/trazabilidad/doc-acabado-resumen', async (req, res) => {
  try {

    const query = `
      SELECT
        p.id_pedido,

        MAX(m.nombre) AS modelo,
        MAX(s.descripcion) AS serie,

        p.total_doc_pedido,

        COUNT(cd.id_docena) AS docenas_terminadas,

        ROUND(
          (
            COUNT(cd.id_docena)::numeric
            / NULLIF(p.total_doc_pedido, 0)
          ) * 100,
          2
        ) AS porcentaje_avance

      FROM control_docena cd

      INNER JOIN detalle_pedido dp
        ON cd.id_detalle = dp.id_detalle

      INNER JOIN pedidos p
        ON dp.id_pedido = p.id_pedido

      LEFT JOIN modelos m
        ON dp.id_modelo = m.id_modelo

      LEFT JOIN series s
        ON dp.id_serie = s.id_serie

      WHERE cd.estado_actual = 'Doc. Acabadas'

      GROUP BY
        p.id_pedido,
        p.total_doc_pedido

      ORDER BY p.id_pedido;
    `;

    const result = await pool.query(query);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
});

router.get('/trazabilidad/doc-acabado-detalle/:id_pedido', async (req, res) => {

  try {

    const { id_pedido } = req.params;

    const query = `
      SELECT
        p.id_pedido,
        m.nombre AS modelo,
        s.descripcion AS serie,
        cd.numero_docena,
        dp.color

      FROM control_docena cd

      INNER JOIN detalle_pedido dp
        ON cd.id_detalle = dp.id_detalle

      INNER JOIN pedidos p
        ON dp.id_pedido = p.id_pedido

      LEFT JOIN modelos m
        ON dp.id_modelo = m.id_modelo

      LEFT JOIN series s
        ON dp.id_serie = s.id_serie

      WHERE
        p.id_pedido = $1
        AND cd.estado_actual = 'Doc. Acabadas'

      ORDER BY
        cd.numero_docena;
    `;

    const result = await pool.query(query, [id_pedido]);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

router.get('/dashboard/detalle/:estado', async (req, res) => {

  try {

    const estado = (req.params.estado || '').trim();

    const dbState = stageToDbState(estado);

    if (!dbState) {
      return res.status(400).json({
        error: 'Estado inválido'
      });
    }

    const query = `
      SELECT
        p.id_pedido,

        cd.id_docena,

        CONCAT(
          'P-',
          LPAD(p.id_pedido::text, 3, '0')
        ) AS lote,

        dp.color,

        s.descripcion AS serie,

        1 AS docenas,

        CONCAT(
          COALESCE(o.nombre, ''),
          ' ',
          COALESCE(o.apellido, '')
        ) AS operario,

        tp.fecha_inicio

      FROM control_docena cd

      INNER JOIN detalle_pedido dp
        ON cd.id_detalle = dp.id_detalle

      INNER JOIN pedidos p
        ON dp.id_pedido = p.id_pedido

      LEFT JOIN series s
        ON dp.id_serie = s.id_serie

      LEFT JOIN trazabilidad_produccion tp
        ON tp.id_docena = cd.id_docena
        AND tp.fecha_fin IS NULL

      LEFT JOIN operarios o
        ON o.id_operario = tp.id_operario

      WHERE cd.estado_actual = $1

      ORDER BY
        tp.fecha_inicio ASC NULLS LAST;
    `;

    const result = await pool.query(query, [dbState]);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

router.get('/dashboard/summary', async (req, res) => {
  try {
    const query = `
      SELECT
        COALESCE(
          (
            SELECT COUNT(DISTINCT tp.id_docena)
            FROM trazabilidad_produccion tp
            INNER JOIN control_docena cd ON cd.id_docena = tp.id_docena
            WHERE cd.estado_actual = 'Doc. Acabadas'
              AND tp.etapa = 'Rematado'
              AND tp.observacion = 'Finalizado Rematado'
              AND tp.fecha_fin::date = CURRENT_DATE
          ), 0
        ) AS terminados_hoy,
        COALESCE(
          (
            SELECT COUNT(DISTINCT tp.id_docena)
            FROM trazabilidad_produccion tp
            INNER JOIN control_docena cd ON cd.id_docena = tp.id_docena
            WHERE cd.estado_actual = 'Doc. Acabadas'
              AND tp.etapa = 'Rematado'
              AND tp.observacion = 'Finalizado Rematado'
              AND tp.fecha_fin::date BETWEEN date_trunc('week', CURRENT_DATE)::date
                AND (date_trunc('week', CURRENT_DATE)::date + INTERVAL '5 days')
          ), 0
        ) AS terminados_semana,
        COALESCE(
          (
            SELECT COUNT(DISTINCT tp.id_docena)
            FROM trazabilidad_produccion tp
            INNER JOIN control_docena cd ON cd.id_docena = tp.id_docena
            WHERE cd.estado_actual = 'Doc. Acabadas'
              AND tp.etapa = 'Rematado'
              AND tp.observacion = 'Finalizado Rematado'
          ), 0
        ) AS terminados_total
    `;

    const result = await pool.query(query);
    res.json(result.rows[0] || {
      terminados_hoy: 0,
      terminados_semana: 0,
      terminados_total: 0
    });
  } catch (err) {
    console.error('Error get dashboard summary:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/completados', async (req, res) => {
  try {
    const { period = 'total' } = req.query;
    let dateClause = '';

    if (period === 'today') {
      dateClause = `AND tp.fecha_fin::date = CURRENT_DATE`;
    } else if (period === 'week') {
      dateClause = `AND tp.fecha_fin::date BETWEEN date_trunc('week', CURRENT_DATE)::date AND (date_trunc('week', CURRENT_DATE)::date + INTERVAL '5 days')`;
    }

    const query = `
      SELECT DISTINCT ON (tp.id_docena)
        tp.id_docena,
        p.id_pedido,
        CONCAT('P-', LPAD(p.id_pedido::text, 3, '0')) AS lote,
        dp.color,
        COALESCE(s.descripcion, 'N/D') AS serie,
        COALESCE(o.nombre, '') || ' ' || COALESCE(o.apellido, '') AS operario,
        tp.fecha_fin
      FROM trazabilidad_produccion tp
      INNER JOIN control_docena cd ON cd.id_docena = tp.id_docena
      INNER JOIN detalle_pedido dp ON dp.id_detalle = cd.id_detalle
      INNER JOIN pedidos p ON p.id_pedido = dp.id_pedido
      LEFT JOIN series s ON s.id_serie = dp.id_serie
      LEFT JOIN operarios o ON o.id_operario = tp.id_operario
      WHERE cd.estado_actual = 'Doc. Acabadas'
        AND tp.etapa = 'Rematado'
        AND tp.observacion = 'Finalizado Rematado'
        ${dateClause}
      ORDER BY tp.id_docena, tp.fecha_fin DESC;
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error get dashboard completados:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
