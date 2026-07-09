/**
 * Construye un objeto JSON con mensajes de notificación de inventario.
 *
 * @param {Array<{material:string,cantidad:number,unidad:string}>} reservados
 * @param {Array<{material:string,necesario:number,disponible:number,faltante:number,unidad:string}>} faltantes
 * @returns {{ mensaje:string, reservados:Array<{texto:string}>, faltantes:Array<{material:string, necesario:string, disponible:string, faltante:string}> }}
 */
function generarNotificacionInventario(reservados = [], faltantes = []) {
  const reservadosText = reservados.map((item) => {
    const unidad = item.unidad ? ` ${item.unidad}` : '';
    return `${item.cantidad} ${unidad} ${item.material}`.trim();
  });

  const faltantesText = faltantes.map((item) => ({
    material: item.material,
    necesario: `${item.necesario} ${item.unidad || ''}`.trim(),
    disponible: `${item.disponible} ${item.unidad || ''}`.trim(),
    faltante: `${item.faltante} ${item.unidad || ''}`.trim()
  }));

  return {
    mensaje: '✔ Se reservaron correctamente:',
    reservados: reservadosText,
    materiales_faltantes: faltantesText
  };
}

module.exports = {
  generarNotificacionInventario,
};
