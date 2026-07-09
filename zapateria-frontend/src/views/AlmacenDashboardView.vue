<template>
  <div class="almacen-dashboard">
    <header class="dashboard-header">
      
      <button class="btn-refresh" @click="cargarDashboard">Actualizar</button>
    </header>

    <section class="kpi-grid">
      <div class="kpi-card">
        <h3>Total de materiales</h3>
        <p>{{ resumen.total_materiales }}</p>
      </div>
      <div class="kpi-card">
        <h3>Stock actual total</h3>
        <p>{{ resumen.total_stock_actual }}</p>
      </div>
      <div class="kpi-card">
        <h3>Stock reservado total</h3>
        <p>{{ resumen.total_stock_reservado }}</p>
      </div>
      <div class="kpi-card warning">
        <h3>Materiales críticos</h3>
        <p>{{ resumen.materiales_bajo_stock }}</p>
      </div>
    </section>

    <section class="section-list">
      <div class="section-panel">
        <h4>Materiales de stock crítico</h4>
        <div v-if="criticos.length === 0" class="empty-state">No hay materiales críticos.</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Material</th>
              <th>Stock actual</th>
              <th>Stock mínimo</th>
              <th>Faltante</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in criticos" :key="item.id_material">
              <td>MAT-{{ String(item.id_material).padStart(3, '0') }}</td>
              <td>{{ item.nombre }}</td>
              <td>{{ item.stock_actual }}</td>
              <td>{{ item.stock_minimo }}</td>
              <td>{{ item.faltante }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="section-panel">
        <h4>Materiales más usados</h4>
        <div v-if="masUsado.length === 0" class="empty-state">No hay datos de consumo.</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Material</th>
              <th>Total consumido</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in masUsado" :key="item.id_material">
              <td>{{ item.nombre }}</td>
              <td>{{ item.total_consumido }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section-panel">
      <h4>Consumo mensual por material</h4>
      <div v-if="consumoMensual.length === 0" class="empty-state">No hay consumo registrado este mes.</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Cantidad consumida</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in consumoMensual" :key="item.id_material">
            <td>{{ item.nombre }}</td>
            <td>{{ item.cantidad_consumida }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import '../styles/AlmacenView.css';
import { ref, onMounted } from 'vue';
import * as materialesAPI from '../services/materiales';

const resumen = ref({
  total_materiales: 0,
  total_stock_actual: 0,
  total_stock_reservado: 0,
  materiales_bajo_stock: 0
});
const criticos = ref([]);
const masUsado = ref([]);
const consumoMensual = ref([]);
const error = ref(null);

const cargarDashboard = async () => {
  error.value = null;
  try {
    const [summary, critic, used, monthly] = await Promise.all([
      materialesAPI.obtenerResumenDashboard(),
      materialesAPI.obtenerStockCritico(),
      materialesAPI.obtenerMasUsado(),
      materialesAPI.obtenerConsumoMensual()
    ]);
    resumen.value = summary || resumen.value;
    criticos.value = critic || [];
    masUsado.value = used || [];
    consumoMensual.value = monthly || [];
  } catch (err) {
    console.error('Error cargando dashboard de almacén', err);
    error.value = err.message || 'Error al cargar el dashboard';
  }
};

onMounted(cargarDashboard);
</script>

<style scoped>
.almacen-dashboard {
  padding: 20px;
  min-height: 100vh;
}
.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}
.kpi-card {
  padding: 20px;
  border-radius: 12px;
  background: #011122;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);
}
.kpi-card.warning {
  border: 1px solid #f1c40f;
}
.kpi-card h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #f9faf8;
}
.kpi-card p {
  font-size: 2rem;
  margin: 0;
  color: #ffffff;
}
.section-list {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.section-panel {
  padding: 18px;
  border-radius: 12px;
  background: #050521;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.04);
}
.section-panel h4 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #f9fcff;
}
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th,
.data-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #c1bb10;
  text-align: left;
}
.data-table th {
  font-weight: 600;
  color: #ffffff;
}
.empty-state {
  padding: 18px;
  border-radius: 8px;
  background: #2b2e56;
  color: #fdfefe;
}
.btn-refresh {
  border: none;
  background: #2563eb;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
}
.btn-refresh:hover {
  background: #1d4ed8;
}
@media (max-width: 900px) {
  .kpi-grid,
  .section-list {
    grid-template-columns: 1fr;
  }
}
</style>
