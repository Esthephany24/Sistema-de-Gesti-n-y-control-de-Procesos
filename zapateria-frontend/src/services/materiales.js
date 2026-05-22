import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
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

export async function eliminarMaterial(id) {
  const res = await api.delete(`/materiales/${id}`);
  return res.data;
}

export default {
  listarMateriales,
  obtenerMaterial,
  crearMaterial,
  actualizarMaterial,
  eliminarMaterial
};
