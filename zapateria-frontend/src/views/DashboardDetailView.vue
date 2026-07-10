<template>
  <div class="dashboard-detail-page">
    <div class="detail-top">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p class="subtitle">{{ pageSubtitle }}</p>
      </div>
      <button class="btn-back" @click="goBack">
        <i class="fas fa-arrow-left"></i> Volver al Dashboard
      </button>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>
    <div v-else-if="error" class="error-message">{{ error }}</div>

    <section v-else>
      <template v-if="section === 'stock'">
        <div v-if="lowStockMaterials.length === 0" class="empty-state">No hay insumos con stock bajo.</div>
        <div class="cards-grid">
          <article v-for="material in lowStockMaterials" :key="material.id_material" class="stock-card">
            <div class="stock-card-header">
              <h3>{{ material.nombre }}</h3>
              <span class="badge status">{{ material.stock_actual <= material.stock_minimo ? 'Crítico' : 'Atención' }}</span>
            </div>
            <div class="stock-card-body">
              <p class="stock-value">{{ material.stock_actual }} / {{ material.stock_minimo }} {{ material.unidad || 'u' }}</p>
              <p class="stock-meta">ID: {{ material.id_material }}</p>
            </div>
          </article>
        </div>
      </template>

      <template v-else-if="section === 'produccion'">
        <div v-if="activeDocenas.length === 0" class="empty-state">No hay docenas en producción activa.</div>
        <div v-else class="table-wrapper">
          <table class="detail-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Docena</th>
                <th>Estado</th>
                <th>Color</th>
                <th>Serie</th>
                <th>Operario</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in activeDocenas" :key="item.id_docena">
                <td>{{ item.lote }}</td>
                <td>{{ item.numero_docena }}</td>
                <td>{{ item.estado_actual }}</td>
                <td>{{ item.color || 'N/D' }}</td>
                <td>{{ item.serie || 'N/D' }}</td>
                <td>{{ item.operario || 'Sin asignar' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <template v-else>
        <div v-if="completedDocenas.length === 0" class="empty-state">No se encontraron docenas completadas para este período.</div>
        <div v-else class="cards-grid">
          <article v-for="item in completedDocenas" :key="item.id_docena" class="complete-card">
            <div class="complete-card-header">
              <h3>{{ item.lote }}</h3>
              <span class="badge success">Rematado</span>
            </div>
            <ul class="complete-list">
              <li><strong>Pedido:</strong> {{ item.id_pedido }}</li>
              <li><strong>Color:</strong> {{ item.color || 'N/D' }}</li>
              <li><strong>Serie:</strong> {{ item.serie || 'N/D' }}</li>
              <li><strong>Operario:</strong> {{ item.operario || 'Sin asignar' }}</li>
              <li><strong>Finalizado:</strong> {{ formatDate(item.fecha_fin) }}</li>
            </ul>
          </article>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import * as materialesAPI from '../services/materiales';


const route = useRoute();
const router = useRouter();
const section = computed(() => route.params.section || 'stock');

const loading = ref(false);
const error = ref(null);
const lowStockMaterials = ref([]);
const activeDocenas = ref([]);
const completedDocenas = ref([]);

const pageTitle = computed(() => {
  switch (section.value) {
    case 'stock': return 'Alertas de Stock';
    case 'produccion': return 'Total en Producción';
    case 'terminados-hoy': return 'Terminados Hoy';
    case 'terminados-semana': return 'Total Docenas Acabadas (Semana)';
    case 'historial': return 'Historial Docenas Acabadas';
    default: return 'Detalle Dashboard';
  }
});

const pageSubtitle = computed(() => {
  switch (section.value) {
    case 'stock': return 'Materiales con stock bajo en tarjetas.';
    case 'produccion': return 'Lista de docenas en proceso por sección.';
    case 'terminados-hoy': return 'Docenas que finalizaron Rematado hoy.';
    case 'terminados-semana': return 'Docenas que finalizaron Rematado esta semana.';
    case 'historial': return 'Historial de docenas completadas en Rematado.';
    default: return '';
  }
});

const goBack = () => {
  router.push('/dashboard');
};

const periodForSection = (sectionName) => {
  if (sectionName === 'terminados-hoy') return 'today';
  if (sectionName === 'terminados-semana') return 'week';
  return 'total';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES');
};

const fetchStock = async () => {
  const materials = await materialesAPI.listarMateriales();
  lowStockMaterials.value = (materials || []).filter((m) => {
    const stockActual = parseFloat(m.stock_actual || 0);
    const stockMinimo = parseFloat(m.stock_minimo || 0);
    return stockActual <= stockMinimo;
  });
};

const fetchProduccion = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/produccion/trazabilidad`);
  if (!response.ok) throw new Error('No se pudieron cargar los datos de producción');
  const data = await response.json();
  activeDocenas.value = (data || [])
    .filter((item) => item.estado_actual !== 'Doc. Acabadas')
    .map((item) => ({
      ...item,
      lote: item.id_pedido ? `P-${String(item.id_pedido).padStart(3, '0')}` : 'N/D'
    }));
};

const fetchCompletados = async () => {
  const period = periodForSection(section.value);
  const response = await fetch(`${import.meta.env.VITE_API_URL}/produccion/dashboard/completados?period=${period}`);
  if (!response.ok) throw new Error('No se pudieron cargar los datos completados');
  const data = await response.json();
  completedDocenas.value = (data || []).map((item) => ({
    ...item,
    fecha_fin: item.fecha_fin
  }));
};

const loadData = async () => {
  loading.value = true;
  error.value = null;
  lowStockMaterials.value = [];
  activeDocenas.value = [];
  completedDocenas.value = [];
  try {
    if (section.value === 'stock') {
      await fetchStock();
    } else if (section.value === 'produccion') {
      await fetchProduccion();
    } else {
      await fetchCompletados();
    }
  } catch (err) {
    error.value = err.message || 'Error al cargar los detalles';
  } finally {
    loading.value = false;
  }
};

watch(section, loadData, { immediate: true });
</script>

<style scoped>
.dashboard-detail-page { padding: 20px; background: #f4f6f9; min-height: 100vh; }
.detail-top { display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 24px; }
.detail-top h2 { margin: 0; font-size: 1.8rem; color: #2c3e50; }
.subtitle { margin: 8px 0 0; color: #607d8b; }
.btn-back { background: #3498db; border: none; color: white; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.btn-back i { margin-right: 8px; }
.loading, .empty-state, .error-message { padding: 24px; background: white; border-radius: 12px; color: #5f6a72; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.error-message { color: #e74c3c; }
.cards-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
.stock-card, .complete-card { background: white; border-radius: 14px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.stock-card-header, .complete-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.stock-card-header h3, .complete-card-header h3 { margin: 0; font-size: 1.1rem; color: #2c3e50; }
.badge { display: inline-flex; align-items: center; justify-content: center; padding: 6px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
.badge.success { background: #2ecc71; color: white; }
.badge.status { background: #f39c12; color: white; }
.stock-value { font-size: 1.4rem; font-weight: 700; margin: 0 0 8px; color: #2c3e50; }
.stock-meta { margin: 0; color: #7f8c8d; }
.complete-list { list-style: none; margin: 0; padding: 0; color: #4a5568; }
.complete-list li { margin-bottom: 8px; }
.table-wrapper { overflow-x: auto; background: white; border-radius: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
.detail-table { width: 100%; border-collapse: collapse; min-width: 720px; }
.detail-table th, .detail-table td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #ecf0f1; }
.detail-table th { background: #f8f9fa; color: #34495e; font-weight: 700; }
.detail-table td { color: #556a7a; }
@media (max-width: 768px) { .detail-top { flex-direction: column; align-items: flex-start; } }
</style>
