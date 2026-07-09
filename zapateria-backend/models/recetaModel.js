const pool = require('./db');

/**
 * Obtiene la receta del modelo y calcula la cantidad necesaria por material.
 *
 * @param {number} id_modelo
 * @param {number} cantidad_docenas
 * @returns {Promise<Array<{id_material:number,cantidad_por_docena:number,cantidad_necesaria:number}>>}
 */
async function obtenerNecesidadesPorReceta(id_modelo, cantidad_docenas) {
  if (!id_modelo || Number.isNaN(Number(id_modelo))) {
    throw new Error('id_modelo debe ser un número válido');
  }

  const cantidadDocenas = Number(cantidad_docenas || 0);
  if (Number.isNaN(cantidadDocenas) || cantidadDocenas < 0) {
    throw new Error('cantidad_docenas debe ser un número válido mayor o igual a 0');
  }

  const query = `
    SELECT id_material, cantidad_por_docena
    FROM receta_modelo
    WHERE id_modelo = $1
  `;

  const result = await pool.query(query, [id_modelo]);

  return result.rows.map((row) => {
    const cantidadPorDocena = Number(row.cantidad_por_docena || 0);
    return {
      id_material: row.id_material,
      cantidad_por_docena: cantidadPorDocena,
      cantidad_necesaria: Number((cantidadPorDocena * cantidadDocenas).toFixed(4))
    };
  });
}

module.exports = {
  obtenerNecesidadesPorReceta,
};
