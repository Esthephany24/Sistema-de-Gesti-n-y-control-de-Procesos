import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export async function listarMateriales() {
  const res = await api.get('/materiales');
  return res.data;
}

export async function obtenerMaterial(id) {
  const res = await api.get(`/materiales/${id}`);
  return res.data;
}

export async function crearMaterial(payload) {
  const res = await api.post('/materiales', payload);
  return res.data;
}

export async function actualizarMaterial(id, payload) {
  const res = await api.put(`/materiales/${id}`, payload);
  return res.data;
}

export async function obtenerResumenDashboard() {
  const res = await api.get('/materiales/dashboard/summary');
  return res.data;
}

export async function obtenerStockCritico() {
  const res = await api.get('/materiales/dashboard/stock-critico');
  return res.data;
}

export async function obtenerMasUsado() {
  const res = await api.get('/materiales/dashboard/mas-usado');
  return res.data;
}

export async function obtenerConsumoMensual() {
  const res = await api.get('/materiales/dashboard/consumo-mensual');
  return res.data;
}

export async function obtenerKardex(idMaterial) {
  const res = await api.get(`/materiales/kardex/${idMaterial}`);
  return res.data;
}

export async function eliminarMaterial(id) {
  const res = await api.delete(`/materiales/${id}`);
  return res.data;
}

export async function listarAsignaciones() {
  const res = await api.get('/materiales/asignaciones');
  return res.data;
}

export default {
  listarMateriales,
  obtenerMaterial,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial,
  listarAsignaciones,
  obtenerResumenDashboard,
  obtenerStockCritico,
  obtenerMasUsado,
  obtenerConsumoMensual,
  obtenerKardex
};
