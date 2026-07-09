import { useEffect, useState } from 'react';
import axios from 'axios';
import './Notificaciones.css';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
});

const tipoClase = {
  SUCCESS: 'notificacion-success',
  WARNING: 'notificacion-warning',
  ERROR: 'notificacion-error'
};

export default function Notificaciones() {
  const [notificaciones, setNotificaciones] = useState([]);

  const cargarNotificaciones = async () => {
    try {
      const res = await api.get('/notificaciones');
      setNotificaciones(res.data);
    } catch (error) {
      console.error('Error cargando notificaciones', error);
    }
  };

  const marcarComoLeida = async (id) => {
    try {
      await api.put(`/notificaciones/${id}`);
      cargarNotificaciones();
    } catch (error) {
      console.error('Error marcando notificación como leída', error);
    }
  };

  const marcarTodasLeidas = async () => {
    try {
      await api.put('/notificaciones');
      cargarNotificaciones();
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas', error);
    }
  };

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  return (
    <div className="notificaciones-page">
      <div className="notificaciones-header">
        <h2>Notificaciones</h2>
        <button className="btn-marcar-todas" onClick={marcarTodasLeidas}>
          Marcar todas como leídas
        </button>
      </div>

      <div className="notificaciones-list">
        {notificaciones.map((item) => (
          <div key={item.id_notificacion} className={`notificacion-card ${tipoClase[item.tipo] || ''}`}>
            <div className="notificacion-top">
              <div>
                <h3>{item.titulo}</h3>
                <p>{item.mensaje}</p>
              </div>
              <span className="notificacion-fecha">{new Date(item.fecha).toLocaleString()}</span>
            </div>

            <div className="notificacion-meta">
              <span className="notificacion-tipo">{item.tipo}</span>
              <span className={`notificacion-estado ${item.leido ? 'leida' : 'no-leida'}`}>
                {item.leido ? 'Leída' : 'No leída'}
              </span>
            </div>

            {!item.leido && (
              <button className="btn-marcar-leida" onClick={() => marcarComoLeida(item.id_notificacion)}>
                Marcar como leída
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
