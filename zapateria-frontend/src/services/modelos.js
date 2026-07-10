import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL}/modelos`;

export const listModelos = () => axios.get(BASE).then(r => r.data);
export const getModelo = (id) => axios.get(`${BASE}/${id}`).then(r => r.data);
export const createModelo = (payload) => axios.post(BASE, payload).then(r => r.data);
export const updateModelo = (id, payload) => axios.put(`${BASE}/${id}`, payload).then(r => r.data);
export const deleteModelo = (id) => axios.delete(`${BASE}/${id}`).then(r => r.data);

export default { listModelos, getModelo, createModelo, updateModelo, deleteModelo };
