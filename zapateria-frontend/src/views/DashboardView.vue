<template>
  <div class="dashboard-container">
    <section class="kpi-grid">
      <div class="kpi-card primary clickable" @click="goToDetalle('produccion')" title="Ver detalles de producción">
        <div class="kpi-icon"><i class="fas fa-shoe-prints"></i></div>
        <div class="kpi-data">
          <h3>Total en Producción</h3>
          <p class="kpi-number">{{ totalDocenasActivas }} docenas</p>
          <div class="detail-action"><i class="fas fa-eye"></i> Ver detalles</div>
        </div>
      </div>
      <div class="kpi-card success clickable" @click="goToDetalle('terminados-hoy')" title="Ver docenas terminadas hoy">
        <div class="kpi-icon"><i class="fas fa-check-circle"></i></div>
        <div class="kpi-data">
          <h3>Terminados Hoy</h3>
          <p class="kpi-number">{{ docenasTerminadasHoy }} docenas</p>
          <div class="detail-action"><i class="fas fa-eye"></i> Ver detalles</div>
        </div>
      </div>
      <div class="kpi-card info clickable" @click="goToDetalle('terminados-semana')" title="Ver docenas terminadas esta semana">
        <div class="kpi-icon"><i class="fas fa-calendar-week"></i></div>
        <div class="kpi-data">
          <h3>Total Docenas Acabadas (Semana)</h3>
          <p class="kpi-number">{{ docenasTerminadasSemana }} docenas</p>
          <div class="detail-action"><i class="fas fa-eye"></i> Ver detalles</div>
        </div>
      </div>
      <div class="kpi-card secondary clickable" @click="goToDetalle('historial')" title="Ver historial de docenas acabadas">
        <div class="kpi-icon"><i class="fas fa-history"></i></div>
        <div class="kpi-data">
          <h3>Historial Docenas Acabadas</h3>
          <p class="kpi-number">{{ docenasTerminadasTotal }} docenas</p>
          <div class="detail-action"><i class="fas fa-eye"></i> Ver detalles</div>
        </div>
      </div>
      <div class="kpi-card warning clickable" @click="goToDetalle('stock')" title="Ver alertas de stock">
        <div class="kpi-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="kpi-data">
          <h3>Alertas de Stock</h3>
          <p class="kpi-number">{{ lowStockMaterials.length }} insumos bajos</p>
          <div class="detail-action"><i class="fas fa-eye"></i> Ver alertas</div>
        </div>
      </div>
    </section>

    <section class="production-flow">
      <h3>Estado Actual por Sección</h3>
      <div class="stages-grid">
        <div
          class="stage-card"
          v-for="seccion in estadoSecciones"
          :key="seccion.key"
          :class="{ 'active-selection': seccionDetalle?.key === seccion.key }"
          @click="mostrarDetalle(seccion)"
        >
          <h4>{{ seccion.nombre }}</h4>
          <div class="stage-stats">
            <span class="qty">{{ seccion.docenas }}</span>
            <span class="label">docenas</span>
          </div>
          <div class="progress-bar-container">
            <div
              class="progress-fill"
              :style="{ width: calcularPorcentaje(seccion.docenas) + '%', backgroundColor: seccion.color }"
              :class="{ overload: calcularPorcentaje(seccion.docenas) > 80 }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="seccionDetalle" class="detail-panel">
      <div class="detail-card">
        <div class="detail-header">
          <h3>Detalles de Producción en: <span class="highlight-text">{{ seccionDetalle.nombre }}</span></h3>
          <button class="btn-close" @click="() => { seccionDetalle = null; detalleProduccion = []; }">&times;</button>
        </div>

        <table class="detail-table">
          <thead>
            <tr>
              <th>Cód. Lote</th>
              <th>Color</th>
              <th>Serie</th>
              <th>Docenas</th>
              <th>Operario Responsable</th>
              <th>En proceso desde (Fecha/Hora)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in datosFiltrados" :key="item.lote + item.operario + item.fechaInicio">
              <td class="fw-bold">{{ item.lote }}</td>
              <td>{{ item.color || 'N/D' }}</td>
              <td>{{ item.serie || 'N/D' }}</td>
              <td><span class="badge-blue">{{ item.docenas }} doc.</span></td>
              <td><i class="fas fa-user"></i> {{ item.operario }}</td>
              <td><i class="far fa-clock"></i> {{ item.fechaInicio }}</td>
            </tr>
            <tr v-if="datosFiltrados.length === 0">
              <td colspan="6" class="empty-state">No hay registros detallados para esta sección en este momento.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import '../styles/DashboardView.css';
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import * as materialesAPI from '../services/materiales';

const router = useRouter();
const seccionDetalle = ref(null);
const detalleProduccion = ref([]);
const docenasTerminadasSemana = ref(0);
const docenasTerminadasTotal = ref(0);
const lowStockMaterials = ref([]);
const stockAlertError = ref(null);
const goToDetalle = (section) => {
  router.push(`/dashboard/detalle/${section}`);
};

const stateMap = {
  POR_CORTAR: 'Por cortar',
  CORTADO: 'Cortado',
  ALISTADO: 'Alistado',
  APARADO: 'Aparado',
  EMPASTADO: 'Empastado',
  ARMADO: 'Armado',
  PEGADO: 'Pegado',
  REMATADO: 'Rematado',
  DOC_ACABADO: 'Doc. Acabadas'
};

const estadoSecciones = ref([
  { nombre: 'POR CORTAR', key: 'POR_CORTAR', docenas: 0, color: '#5b6a87' },
  { nombre: 'Cortado', key: 'CORTADO', docenas: 0, color: '#3498db' },
  { nombre: 'Alistado', key: 'ALISTADO', docenas: 0, color: '#9b59b6' },
  { nombre: 'Aparado', key: 'APARADO', docenas: 0, color: '#f2994a' },
  { nombre: 'Empastado', key: 'EMPASTADO', docenas: 0, color: '#f1c40f' },
  { nombre: 'Armado', key: 'ARMADO', docenas: 0, color: '#27ae60' },
  { nombre: 'Pegado', key: 'PEGADO', docenas: 0, color: '#16a085' },
  { nombre: 'Rematado', key: 'REMATADO', docenas: 0, color: '#d35400' },
  { nombre: 'Doc Acabado', key: 'DOC_ACABADO', docenas: 0, color: '#2ecc71' }
]);
const docenasTerminadasHoy = ref(0);
const error = ref(null);
const loading = ref(false);

const capacidadMaximaIdeal = 50;
const calcularPorcentaje = (docenas) => {
  const porcentaje = (docenas / capacidadMaximaIdeal) * 100;
  return porcentaje > 100 ? 100 : Math.round(porcentaje);
};

const totalDocenasActivas = computed(() => {
  return estadoSecciones.value
    .filter((seccion) => seccion.key !== 'DOC_ACABADO')
    .reduce((total, seccion) => total + seccion.docenas, 0);
});

const fetchSecciones = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('http://localhost:3000/api/produccion/secciones');
    if (!response.ok) throw new Error('No se pudieron cargar las secciones');
    const data = await response.json();

    estadoSecciones.value = estadoSecciones.value.map((section) => {
      const found = data.find((item) => item.stage === section.key);
      return {
        ...section,
        docenas: found ? Number(found.count) : 0
      };
    });
  } catch (err) {
    error.value = err.message || 'Error al cargar las secciones';
  } finally {
    loading.value = false;
  }
};

const fetchDashboardSummary = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/produccion/dashboard/summary');
    if (!response.ok) throw new Error('No se pudo cargar el resumen del dashboard');
    const data = await response.json();
    docenasTerminadasHoy.value = Number(data.terminados_hoy || data.terminadosHoy || 0);
    docenasTerminadasSemana.value = Number(data.terminados_semana || data.terminadosSemana || 0);
    docenasTerminadasTotal.value = Number(data.terminados_total || data.terminadosTotal || 0);
  } catch (err) {
    error.value = err.message || 'Error al cargar el resumen del dashboard';
  }
};

const fetchLowStockMaterials = async () => {
  try {
    const materials = await materialesAPI.listarMateriales();
    lowStockMaterials.value = (materials || []).filter((m) => {
      const stockActual = parseFloat(m.stock_actual || 0);
      const stockMinimo = parseFloat(m.stock_minimo || 0);
      return stockActual <= stockMinimo;
    });
  } catch (err) {
    stockAlertError.value = err.message || 'No se pudieron cargar las alertas de stock';
    lowStockMaterials.value = [];
  }
};

const fetchDetallePorSeccion = async (seccion) => {

  try {

    const estadoDb = stateMap[seccion.key];

    const response = await fetch(
      `http://localhost:3000/api/produccion/dashboard/detalle/${estadoDb}`
    );

    if (!response.ok) {
      throw new Error('No se pudieron cargar los detalles');
    }

    const data = await response.json();

    detalleProduccion.value = data.map((item) => ({

      lote: item.lote,

      color: item.color || 'N/D',

      serie: item.serie || 'N/D',

      docenas: item.docenas || 1,

      operario: item.operario?.trim() || 'Sin asignar',

      fechaInicio: formatDate(item.fecha_inicio)

    }));

  } catch (err) {

    detalleProduccion.value = [];

    error.value =
      err.message || 'Error al cargar los detalles';

  }

};

const mostrarDetalle = async (seccion) => {
  if (seccionDetalle.value?.key === seccion.key) {
    seccionDetalle.value = null;
    detalleProduccion.value = [];
    return;
  }

  seccionDetalle.value = seccion;
  await fetchDetallePorSeccion(seccion);
};

const datosFiltrados = computed(() => detalleProduccion.value);

const formatDate = (dateString) => {
  if (!dateString) return 'N/D';
  const date = new Date(dateString);
  return date.toLocaleString('es-ES');
};

onMounted(() => {
  fetchSecciones();
  fetchDashboardSummary();
  fetchLowStockMaterials();
  setInterval(() => {
    fetchSecciones();
    fetchDashboardSummary();
    fetchLowStockMaterials();
  }, 5000);
});
</script>

<style scoped>
.dashboard-container { padding: 20px; background-color: #f4f6f9; min-height: 100vh; font-family: Arial, sans-serif; }
.dashboard-header { margin-bottom: 30px; color: #2c3e50; }
.dashboard-header h2 { margin: 0 0 8px; font-size: 2rem; }
.dashboard-header p { margin: 0; color: #556477; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
.kpi-card { display: flex; align-items: center; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #ccc; }
.kpi-card.primary { border-left-color: #3498db; }
.kpi-card.success { border-left-color: #2ecc71; }
.kpi-card.info { border-left-color: #1abc9c; }
.kpi-card.secondary { border-left-color: #9b59b6; }
.kpi-card.warning { border-left-color: #f1c40f; }
.kpi-card.clickable { cursor: pointer; }
.kpi-card.clickable:hover { transform: translateY(-3px); box-shadow: 0 8px 18px rgba(0,0,0,0.12); }
.kpi-icon { font-size: 2.5rem; margin-right: 20px; color: #7f8c8d; }
.detail-action { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; font-weight: 700; color: #2980b9; }
.detail-action i { font-size: 1rem; }
.stock-list {
  margin: 12px 0 0;
  padding-left: 18px;
  color: #2f3e50;
}
.stock-list li {
  font-size: 0.95rem;
  margin-bottom: 4px;
}

.kpi-data h3 { margin: 0; font-size: 0.9rem; color: #95a5a6; text-transform: uppercase; }
.kpi-number { margin: 8px 0 0; font-size: 1.8rem; font-weight: bold; color: #2c3e50; }
.production-flow h3 { color: #2c3e50; margin-bottom: 20px; }
.stages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }
.stage-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent; }
.stage-card:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.stage-card.active-selection { border-color: #3498db; background-color: #f0f8ff; transform: scale(1.02); }
.stage-card h4 { margin-top: 0; color: #34495e; font-size: 1.1rem; }
.stage-stats { margin: 15px 0; }
.qty { font-size: 2rem; font-weight: bold; color: #2980b9; display: block; }
.label { font-size: 0.85rem; color: #7f8c8d; }
.progress-bar-container { width: 100%; height: 8px; background-color: #ecf0f1; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background-color: #3498db; transition: width 0.3s ease; }
.progress-fill.overload { background-color: #e74c3c; }
.detail-panel { margin-top: 30px; animation: fadeIn 0.4s ease; }
.detail-card { background: white; padding: 25px; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
.detail-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #ecf0f1; padding-bottom: 15px; margin-bottom: 15px; }
.detail-header h3 { margin: 0; color: #2c3e50; }
.highlight-text { color: #3498db; }
.btn-close { background: none; border: none; font-size: 2rem; color: #7f8c8d; cursor: pointer; line-height: 1; }
.btn-close:hover { color: #e74c3c; }
.detail-table { width: 100%; border-collapse: collapse; }
.detail-table th { background-color: #f8f9fa; color: #34495e; padding: 12px 15px; text-align: left; font-weight: 600; border-bottom: 2px solid #ecf0f1; }
.detail-table td { padding: 15px; border-bottom: 1px solid #ecf0f1; color: #555; }
.fw-bold { font-weight: bold; color: #2c3e50; }
.badge-blue { background-color: #ebf5fb; color: #2980b9; padding: 5px 10px; border-radius: 6px; font-weight: bold; font-size: 0.9rem; border: 1px solid #d6eaf8; }
.empty-state { text-align: center; color: #95a5a6; font-style: italic; padding: 30px !important; }
.progress-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.progress-card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); padding: 20px; }
.progress-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.progress-header h4 { margin: 0; font-size: 1rem; font-weight: 600; color: #2c3e50; }
.progress-percentage { font-size: 1.3rem; font-weight: 700; color: #27ae60; }
.progress-info { margin-bottom: 12px; }
.progress-text { margin: 0; font-size: 0.9rem; color: #7f8c8d; }
.progress-bar-large { width: 100%; height: 8px; background: #ecf0f1; border-radius: 4px; overflow: hidden; }
.progress-fill-large { height: 100%; background: linear-gradient(90deg, #27ae60, #2ecc71); transition: width 0.3s ease; border-radius: 4px; }
.empty-progress { grid-column: 1 / -1; text-align: center; padding: 40px; color: #95a5a6; background: #f9fafb; border-radius: 12px; }
.board-footer { text-align: right; margin-top: 24px; font-size: 0.9rem; color: #7f8c8d; }
.feedback { color: #7f8c8d; }
.error { color: #e74c3c; }
@media (max-width: 1200px) { .stages-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } .kpi-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) { .stages-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dashboard-header { flex-direction: column; gap: 16px; } .dashboard-header h2 { font-size: 1.8rem; } }
@media (max-width: 480px) { .stages-grid { grid-template-columns: 1fr; } }
</style>
