const pool = require('./db');
const notificationService = require('./notificationService');

/**
 * Valida el inventario para un conjunto de materiales.
 *
 * @param {Array<{id_material:number,cantidad_necesaria:number,cantidad_reservada?:number}>} materiales
 * @returns {Promise<Array<{
 *   id_material:number,
 *   nombre:string,
 *   cantidad_necesaria:number,
 *   stock_actual:number,
 *   stock_reservado:number,
 *   stock_disponible:number,
 *   cantidad_reservada:number,
 *   cantidad_faltante:number,
 *   estado:string
 * }>>}
 */
async function validarInventario(materiales, client = pool) {
  if (!Array.isArray(materiales)) {
    throw new Error('El parámetro materiales debe ser un arreglo');
  }

  const materialesValidos = materiales.map((item) => ({
    id_material: Number(item.id_material),
    cantidad_necesaria: Number(item.cantidad_necesaria || 0),
    cantidad_reservada: Number(item.cantidad_reservada || 0)
  }));

  const resultados = [];

  for (const item of materialesValidos) {
    if (Number.isNaN(item.id_material) || item.id_material <= 0) {
      throw new Error('id_material debe ser un número válido en cada material');
    }

    if (Number.isNaN(item.cantidad_necesaria) || item.cantidad_necesaria < 0) {
      throw new Error('cantidad_necesaria debe ser un número válido mayor o igual a 0 en cada material');
    }

    const query = `
      SELECT id_material, nombre, unidad_medida, stock_actual, stock_reservado
      FROM materiales
      WHERE id_material = $1
    `;
    const result = await client.query(query, [item.id_material]);

    if (result.rowCount === 0) {
      throw new Error(`Material con id_material ${item.id_material} no encontrado`);
    }

    const material = result.rows[0];
    const stockActual = Number(material.stock_actual || 0);
    const stockReservado = Number(material.stock_reservado || 0);
    const stockDisponible = Math.max(0, stockActual - stockReservado);
    const cantidadReservada = Math.min(stockDisponible, item.cantidad_necesaria);
    const cantidadFaltante = Math.max(0, item.cantidad_necesaria - cantidadReservada);

    let estado = 'FALTANTE';
    if (cantidadReservada >= item.cantidad_necesaria) {
      estado = 'COMPLETO';
    } else if (cantidadReservada > 0) {
      estado = 'PARCIAL';
    }

    resultados.push({
      id_material: material.id_material,
      nombre: material.nombre,
      unidad: material.unidad_medida || '',
      cantidad_necesaria: item.cantidad_necesaria,
      stock_actual: stockActual,
      stock_reservado: stockReservado,
      stock_disponible: stockDisponible,
      cantidad_reservada: cantidadReservada,
      cantidad_faltante: cantidadFaltante,
      estado
    });
  }

  return resultados;
}

/**
 * Consume las reservas de un pedido cuando la producción inicia en Por cortar.
 *
 * @param {import('pg').PoolClient} client
 * @param {number} id_pedido
 * @returns {Promise<void>}
 */
async function consumirReservasPedido(client, id_pedido) {
  if (!client || typeof client.query !== 'function') {
    throw new Error('Se requiere un client válido de PostgreSQL');
  }

  if (!Number.isInteger(id_pedido) || id_pedido <= 0) {
    throw new Error('id_pedido debe ser un número entero válido');
  }

  const reservasRes = await client.query(
    `SELECT id_reserva, id_material, cantidad_reservada
     FROM reserva_materiales
     WHERE id_pedido = $1
       AND estado <> 'ENTREGADO'`,
    [id_pedido]
  );

  let consumedCount = 0;
  for (const reserva of reservasRes.rows) {
    const cantidadReservada = Number(reserva.cantidad_reservada || 0);
    if (cantidadReservada <= 0) continue;

    const materialRes = await client.query(
      'SELECT stock_actual, stock_reservado FROM materiales WHERE id_material = $1 FOR UPDATE',
      [reserva.id_material]
    );
    if (materialRes.rowCount === 0) {
      throw new Error(`Material ${reserva.id_material} no encontrado al consumir reserva`);
    }

    const stockActual = Number(materialRes.rows[0].stock_actual || 0);
    const stockReservado = Number(materialRes.rows[0].stock_reservado || 0);
    const nuevoStockActual = stockActual - cantidadReservada;
    const nuevoStockReservado = stockReservado - cantidadReservada;

    await client.query(
      'UPDATE materiales SET stock_actual = $1, stock_reservado = $2 WHERE id_material = $3',
      [nuevoStockActual, nuevoStockReservado, reserva.id_material]
    );

    await verificarStockCritico(client, reserva.id_material);

    await client.query(
      'UPDATE reserva_materiales SET estado = $1, cantidad_entregada = $2 WHERE id_reserva = $3',
      ['ENTREGADO', cantidadReservada, reserva.id_reserva]
    );

    await client.query(
      'INSERT INTO movimiento_almacen (id_material, tipo_movimiento, cantidad, referencia) VALUES ($1, $2, $3, $4)',
      [reserva.id_material, 'SALIDA', cantidadReservada, `Pedido ${id_pedido} - Por cortar`]
    );

    await client.query(
      'INSERT INTO consumo_materiales (id_reserva, cantidad) VALUES ($1, $2)',
      [reserva.id_reserva, cantidadReservada]
    );

    consumedCount += 1;
  }

  return consumedCount;
}

async function liberarReservasPedido(client, id_pedido) {
  if (!client || typeof client.query !== 'function') {
    throw new Error('Se requiere un client válido de PostgreSQL');
  }

  if (!Number.isInteger(id_pedido) || id_pedido <= 0) {
    throw new Error('id_pedido debe ser un número entero válido');
  }

  const reservasRes = await client.query(
    `SELECT id_reserva, id_material, cantidad_reservada
     FROM reserva_materiales
     WHERE id_pedido = $1
       AND estado NOT IN ('ENTREGADO', 'LIBERADA')`,
    [id_pedido]
  );

  let liberadasCount = 0;
  for (const reserva of reservasRes.rows) {
    const cantidadReservada = Number(reserva.cantidad_reservada || 0);
    if (cantidadReservada > 0) {
      const materialRes = await client.query(
        'SELECT stock_reservado FROM materiales WHERE id_material = $1 FOR UPDATE',
        [reserva.id_material]
      );
      if (materialRes.rowCount === 0) {
        throw new Error(`Material ${reserva.id_material} no encontrado al liberar reserva`);
      }

      const stockReservado = Number(materialRes.rows[0].stock_reservado || 0);
      const nuevoStockReservado = Math.max(0, stockReservado - cantidadReservada);

      await client.query(
        'UPDATE materiales SET stock_reservado = $1 WHERE id_material = $2',
        [nuevoStockReservado, reserva.id_material]
      );
    }

    await client.query(
      'UPDATE reserva_materiales SET estado = $1 WHERE id_reserva = $2',
      ['LIBERADA', reserva.id_reserva]
    );

    liberadasCount += 1;
  }

  await client.query(
    `UPDATE pedido_material
     SET cantidad_reservada = 0,
         cantidad_faltante = cantidad_necesaria,
         estado = $1
     WHERE id_pedido = $2`,
    ['LIBERADA', id_pedido]
  );

  return liberadasCount;
}

async function verificarStockCritico(client, id_material) {
  if (!client || typeof client.query !== 'function') {
    throw new Error('Se requiere un client válido de PostgreSQL');
  }

  if (!Number.isInteger(id_material) || id_material <= 0) {
    throw new Error('id_material debe ser un número entero válido');
  }

  const materialRes = await client.query(
    'SELECT nombre, stock_actual, stock_minimo FROM materiales WHERE id_material = $1',
    [id_material]
  );
  if (materialRes.rowCount === 0) {
    throw new Error(`Material ${id_material} no encontrado al verificar stock crítico`);
  }

  const material = materialRes.rows[0];
  const stockActual = Number(material.stock_actual || 0);
  const stockMinimo = Number(material.stock_minimo || 0);

  if (stockActual <= stockMinimo) {
    const titulo = `Stock crítico: ${material.nombre}`;
    const mensaje = `El material "${material.nombre}" está por debajo o igual al stock mínimo (${stockActual} <= ${stockMinimo}).`;
    await notificationService.crearNotificacionSiNoExiste(titulo, mensaje, 'WARNING', client);
    return true;
  }

  return false;
}

async function notificarStockCriticoAutomatica(client = pool) {
  if (!client || typeof client.query !== 'function') {
    throw new Error('Se requiere un client válido de PostgreSQL');
  }

  const materialesRes = await client.query(
    `SELECT id_material, nombre, stock_actual, stock_minimo
     FROM materiales
     WHERE stock_actual <= stock_minimo`
  );

  const creadas = [];
  for (const material of materialesRes.rows) {
    const titulo = `Stock crítico: ${material.nombre}`;
    const mensaje = `El material "${material.nombre}" está por debajo o igual al stock mínimo (${material.stock_actual} <= ${material.stock_minimo}).`;
    const notificacion = await notificationService.crearNotificacionSiNoExiste(
      titulo,
      mensaje,
      'WARNING',
      client
    );
    if (notificacion) {
      creadas.push(notificacion);
    }
  }

  return creadas;
}

/**
 * Inserta reservas y registros de pedido_material usando el mismo cliente.
 *
 * @param {import('pg').PoolClient} client
 * @param {number} id_pedido
 * @param {Array<{
 *   id_material:number,
 *   nombre:string,
 *   unidad:string,
 *   cantidad_necesaria:number,
 *   stock_actual:number,
 *   stock_reservado:number,
 *   stock_disponible:number,
 *   cantidad_reservada:number,
 *   cantidad_faltante:number,
 *   estado:string
 * }>} materialesValidados
 * @returns {Promise<void>}
 */
async function reservarMateriales(client, id_pedido, materialesValidados) {
  if (!client || typeof client.query !== 'function') {
    throw new Error('Se requiere un client válido de PostgreSQL');
  }

  if (!Number.isInteger(id_pedido) || id_pedido <= 0) {
    throw new Error('id_pedido debe ser un número entero válido');
  }

  if (!Array.isArray(materialesValidados)) {
    throw new Error('materialesValidados debe ser un arreglo');
  }

  for (const material of materialesValidados) {
    if (!Number.isInteger(material.id_material) || material.id_material <= 0) {
      throw new Error('id_material debe ser un número entero válido');
    }

    const cantidadNecesaria = Number(material.cantidad_necesaria || 0);
    const cantidadReservada = Number(material.cantidad_reservada || 0);
    const cantidadFaltante = Number(material.cantidad_faltante || 0);
    const estado = material.estado || 'FALTANTE';

    await client.query(
      'INSERT INTO reserva_materiales (id_pedido, id_material, cantidad_reservada, cantidad_entregada, estado) VALUES ($1, $2, $3, $4, $5)',
      [id_pedido, material.id_material, cantidadReservada, 0, estado]
    );

    if (cantidadReservada > 0) {
      await client.query(
        'UPDATE materiales SET stock_reservado = stock_reservado + $1 WHERE id_material = $2',
        [cantidadReservada, material.id_material]
      );
    }

    await client.query(
      'INSERT INTO pedido_material (id_pedido, id_material, cantidad_necesaria, cantidad_reservada, cantidad_faltante, estado) VALUES ($1, $2, $3, $4, $5, $6)',
      [id_pedido, material.id_material, cantidadNecesaria, cantidadReservada, cantidadFaltante, estado]
    );
  }
}

module.exports = {
  validarInventario,
  reservarMateriales,
  consumirReservasPedido,
  liberarReservasPedido,
  verificarStockCritico,
  notificarStockCriticoAutomatica
};