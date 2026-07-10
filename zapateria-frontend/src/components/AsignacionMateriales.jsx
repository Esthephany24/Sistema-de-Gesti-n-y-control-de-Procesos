import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './AsignacionMateriales.css';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export default function AsignacionMateriales() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [pedidoFilter, setPedidoFilter] = useState('');
  const [modeloFilter, setModeloFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');

  useEffect(() => {
    async function cargar() {
      try {
        const response = await api.get('/materiales/asignaciones');
        setAsignaciones(response.data || []);
      } catch (error) {
        console.error('Error cargando asignaciones:', error);
      }
    }
    cargar();
  }, []);

  const asignacionesFiltradas = useMemo(() => {
    const pedido = pedidoFilter.trim().toLowerCase();
    const modelo = modeloFilter.trim().toLowerCase();
    const estado = estadoFilter.trim().toLowerCase();

    return asignaciones.filter((item) => {
      const pedidoMatch = pedido === '' || String(item.id_pedido).toLowerCase().includes(pedido);
      const modeloMatch = modelo === '' || String(item.modelo || '').toLowerCase().includes(modelo);
      const estadoMatch = estado === '' || String(item.estado || '').toLowerCase().includes(estado);
      return pedidoMatch && modeloMatch && estadoMatch;
    });
  }, [asignaciones, pedidoFilter, modeloFilter, estadoFilter]);

  const estadoClass = (estado) => {
    const value = String(estado || '').trim().toLowerCase();
    if (value === 'reservado') return 'estado-chip reservado';
    if (value === 'parcial') return 'estado-chip parcial';
    if (value === 'sin stock' || value === 'sin_stock' || value === 'faltante' || value === 'no stock') return 'estado-chip sin-stock';
    return 'estado-chip';
  };

  return (
    <div className="asignacion-materiales-screen">
      <div className="asignacion-header">
        <div>
          <h2>Asignación de Materiales</h2>
          <p>Consulta el estado de la reserva de materiales por pedido.</p>
        </div>
      </div>

      <div className="asignacion-filters">
        <div className="filter-item">
          <label>Pedido</label>
          <input
            type="text"
            value={pedidoFilter}
            onChange={(e) => setPedidoFilter(e.target.value)}
            placeholder="Buscar por pedido"
          />
        </div>
        <div className="filter-item">
          <label>Modelo</label>
          <input
            type="text"
            value={modeloFilter}
            onChange={(e) => setModeloFilter(e.target.value)}
            placeholder="Buscar por modelo"
          />
        </div>
        <div className="filter-item">
          <label>Estado</label>
          <input
            type="text"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            placeholder="Buscar por estado"
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="asignacion-table-react">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Modelo</th>
              <th>Material</th>
              <th>Cantidad necesaria</th>
              <th>Cantidad reservada</th>
              <th>Cantidad faltante</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {asignacionesFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-row">
                  No hay resultados para los filtros seleccionados.
                </td>
              </tr>
            ) : (
              asignacionesFiltradas.map((item) => (
                <tr key={`${item.id_pedido}-${item.material}`}>
                  <td>#{item.id_pedido}</td>
                  <td>{item.modelo || 'N/D'}</td>
                  <td>{item.material}</td>
                  <td>{item.cantidad_necesaria}</td>
                  <td>{item.cantidad_reservada}</td>
                  <td>{item.cantidad_faltante}</td>
                  <td>
                    <span className={estadoClass(item.estado)}>{item.estado}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
