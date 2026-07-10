import axios from 'axios';

const BASE = `${import.meta.env.VITE_API_URL}/clientes`;

export const listClientes = () => axios.get(BASE).then(r => r.data);
export const getCliente = (id) => axios.get(`${BASE}/${id}`).then(r => r.data);
export const createCliente = (payload) => axios.post(BASE, payload).then(r => r.data);
export const updateCliente = (id, payload) => axios.put(`${BASE}/${id}`, payload).then(r => r.data);
export const deleteCliente = (id) => axios.delete(`${BASE}/${id}`).then(r => r.data);

export default { listClientes, getCliente, createCliente, updateCliente, deleteCliente };
