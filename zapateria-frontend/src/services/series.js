import axios from 'axios';

const BASE =  `${import.meta.env.VITE_API_URL}/series`;

export const listSeries = () => axios.get(BASE).then(r => r.data);
export const getSerie = (id) => axios.get(`${BASE}/${id}`).then(r => r.data);
export const createSerie = (payload) => axios.post(BASE, payload).then(r => r.data);
export const updateSerie = (id, payload) => axios.put(`${BASE}/${id}`, payload).then(r => r.data);
export const deleteSerie = (id) => axios.delete(`${BASE}/${id}`).then(r => r.data);

export default { listSeries, getSerie, createSerie, updateSerie, deleteSerie };
