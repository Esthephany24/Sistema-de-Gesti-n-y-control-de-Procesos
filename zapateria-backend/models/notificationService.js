const pool = require('./db');

async function crearNotificacion(titulo, mensaje, tipo) {
  try {
    const result = await pool.query(
      `INSERT INTO notificaciones (titulo, mensaje, tipo, leido, fecha)
       VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
       RETURNING *`,
      [titulo, mensaje, tipo]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creando notificación:', error);
    throw error;
  }
}

async function crearNotificacionSiNoExiste(titulo, mensaje, tipo, client = pool) {
  try {
    const existing = await client.query(
      `SELECT 1 FROM notificaciones WHERE titulo = $1 AND mensaje = $2 AND tipo = $3 LIMIT 1`,
      [titulo, mensaje, tipo]
    );
    if (existing.rowCount > 0) {
      return null;
    }

    const result = await client.query(
      `INSERT INTO notificaciones (titulo, mensaje, tipo, leido, fecha)
       VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)
       RETURNING *`,
      [titulo, mensaje, tipo]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creando notificación única:', error);
    throw error;
  }
}

async function obtenerNotificaciones() {
  try {
    const result = await pool.query(
      `SELECT id_notificacion, titulo, mensaje, tipo, leido, fecha
       FROM notificaciones
       ORDER BY fecha DESC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    throw error;
  }
}

async function marcarComoLeida(id) {
  try {
    const result = await pool.query(
      `UPDATE notificaciones
       SET leido = true
       WHERE id_notificacion = $1
       RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error marcando notificación ${id} como leída:`, error);
    throw error;
  }
}

async function marcarTodasLeidas() {
  try {
    const result = await pool.query(
      `UPDATE notificaciones
       SET leido = true
       WHERE leido = false
       RETURNING *`
    );
    return result.rows;
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    throw error;
  }
}

module.exports = {
  crearNotificacion,
  crearNotificacionSiNoExiste,
  obtenerNotificaciones,
  marcarComoLeida,
  marcarTodasLeidas,
};
