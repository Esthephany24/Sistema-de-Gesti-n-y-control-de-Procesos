<template>
  <div class="asignacion-materiales-view">
    <section class="filter-row">
      <div class="filter-item">
        <label>Pedido</label>
        <input v-model="filtroPedido" placeholder="Buscar pedido" />
      </div>
      <div class="filter-item">
        <label>Modelo</label>
        <input v-model="filtroModelo" placeholder="Buscar modelo" />
      </div>
      <div class="filter-item">
        <label>Estado</label>
        <input v-model="filtroEstado" placeholder="Buscar estado" />
      </div>
      <div class="filter-item" style="display:flex;align-items:flex-end;justify-content:center;">
        <button class="btn" @click="cargarAsignaciones">Buscar</button>
      </div>
    </section>

    <section class="table-wrapper">
      <div class="table-responsive">
        <table class="asignacion-table">
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
            <tr v-for="item in asignacionesFiltradas" :key="item.id_pedido + '-' + item.material">
              <td>#{{ item.id_pedido }}</td>
              <td>{{ item.modelo || 'N/D' }}</td>
              <td>{{ item.material }}</td>
              <td>{{ item.cantidad_necesaria }}</td>
              <td>{{ item.cantidad_reservada }}</td>
              <td>{{ item.cantidad_faltante }}</td>
              <td>
                <span :class="estadoClass(item.estado)">{{ item.estado }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!asignacionesFiltradas.length" class="empty-state">
        No hay asignaciones que coincidan con los filtros.
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import '../styles/AsignacionMateriales.css';
import { listarAsignaciones } from '../services/materiales';

const asignaciones = ref([]);
const filtroPedido = ref('');
const filtroModelo = ref('');
const filtroEstado = ref('');

const cargarAsignaciones = async () => {
  try {
    asignaciones.value = await listarAsignaciones();
  } catch (error) {
    console.error('Error cargando asignaciones', error);
  }
};

const estadoClass = (estado) => {
  const value = String(estado || '').trim().toLowerCase();
  return {
    'estado-chip': true,
    reservado: value === 'reservado',
    parcial: value === 'parcial',
    'sin-stock': value === 'sin stock' || value === 'sin_stock' || value === 'faltante' || value === 'no stock'
  };
};

const asignacionesFiltradas = computed(() => {
  const pedido = filtroPedido.value.trim().toLowerCase();
  const modelo = filtroModelo.value.trim().toLowerCase();
  const estado = filtroEstado.value.trim().toLowerCase();

  return asignaciones.value.filter((item) => {
    const matchesPedido = pedido === '' || String(item.id_pedido).includes(pedido);
    const matchesModelo = modelo === '' || String(item.modelo || '').toLowerCase().includes(modelo);
    const matchesEstado = estado === '' || String(item.estado || '').toLowerCase().includes(estado);
    return matchesPedido && matchesModelo && matchesEstado;
  });
});

onMounted(cargarAsignaciones);
</script>
