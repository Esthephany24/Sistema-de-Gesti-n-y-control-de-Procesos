<template>
  <div class="kardex-page">
    <header class="kardex-header">
      
      <div class="search-row">
        <input v-model="idMaterial" type="number" min="1" placeholder="ID material" />
        <button class="btn btn-primary" @click="buscarKardex">Buscar</button>
      </div>
    </header>

    <section class="kardex-summary" v-if="material">
      <div class="summary-card">
        <h4>{{ material.nombre }}</h4>
        <p>Unidad: {{ material.unidad_medida || 'N/D' }}</p>
      </div>
      <div class="summary-card">
        <h4>Stock actual</h4>
        <p>{{ material.stock_actual }}</p>
      </div>
      <div class="summary-card">
        <h4>Stock reservado</h4>
        <p>{{ material.stock_reservado }}</p>
      </div>
      <div class="summary-card">
        <h4>Stock mínimo</h4>
        <p>{{ material.stock_minimo }}</p>
      </div>
    </section>

    <section class="kardex-table" v-if="movimientos.length > 0">
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Cantidad</th>
            <th>Referencia</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in movimientos" :key="item.id_movimiento">
            <td>{{ formatearFecha(item.fecha) }}</td>
            <td>{{ item.tipo_movimiento }}</td>
            <td>{{ item.cantidad }}</td>
            <td>{{ item.referencia }}</td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="!material && !error" class="empty-state">Ingrese un ID de material y haga clic en Buscar.</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import '../styles/AlmacenView.css';
import * as materialesAPI from '../services/materiales';

const idMaterial = ref('');
const material = ref(null);
const movimientos = ref([]);
const error = ref(null);

const buscarKardex = async () => {
  error.value = null;
  material.value = null;
  movimientos.value = [];

  if (!idMaterial.value) {
    error.value = 'Ingrese un ID de material válido.';
    return;
  }

  try {
    const data = await materialesAPI.obtenerKardex(Number(idMaterial.value));
    material.value = data.material;
    movimientos.value = data.movimientos || [];
  } catch (err) {
    console.error('Error cargando kardex', err);
    error.value = err.response?.data?.error || err.message || 'No se pudo cargar el kardex';
  }
};

const formatearFecha = (value) => value ? new Date(value).toLocaleString('es-ES') : '';
</script>

<style scoped>
.kardex-page {
  padding: 20px;
}
.kardex-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.search-row {
  display: grid;
  grid-template-columns: 160px auto;
  gap: 12px;
}
.search-row input {
  padding: 10px 12px;
  border: 1px solid #d1dbd5;
  border-radius: 8px;
}
.kardex-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.summary-card {
  background: #0c84d9;
  padding: 18px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}
.summary-card h4 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #111827;
}
.kardex-table table {
  width: 100%;
  border-collapse: collapse;
}
.kardex-table th,
.kardex-table td {
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}
.kardex-table th {
  text-align: left;
  color: #374151;
}
.alert {
  background: #fee2e2;
  padding: 14px;
  border-radius: 10px;
  margin-top: 20px;
}
.empty-state {
  padding: 18px;
  border-radius: 10px;
  background: #f8fafc;
  color: #475569;
  margin-top: 20px;
}
.btn-primary {
  border: none;
  background: #2563eb;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-primary:hover {
  background: #1d4ed8;
}
@media (max-width: 900px) {
  .kardex-summary {
    grid-template-columns: 1fr;
  }
  .kardex-header,
  .search-row {
    grid-template-columns: 1fr;
  }
}
</style>
