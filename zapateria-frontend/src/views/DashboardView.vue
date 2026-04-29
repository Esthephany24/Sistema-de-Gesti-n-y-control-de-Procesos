<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <h2><i class="fas fa-chart-line"></i> Panel de Control - Planta de Producción</h2>
      <p>Monitoreo en tiempo real del flujo de trabajo</p>
    </header>

    <section class="kpi-grid">
      <div class="kpi-card primary">
        <div class="kpi-icon"><i class="fas fa-shoe-prints"></i></div>
        <div class="kpi-data">
          <h3>Total en Producción</h3>
          <p class="kpi-number">{{ totalDocenasActivas }} docenas</p>
        </div>
      </div>
      <div class="kpi-card success">
        <div class="kpi-icon"><i class="fas fa-check-circle"></i></div>
        <div class="kpi-data">
          <h3>Terminados Hoy</h3>
          <p class="kpi-number">{{ docenasTerminadasHoy }} docenas</p>
        </div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="kpi-data">
          <h3>Alertas de Stock</h3>
          <p class="kpi-number">2 Insumos bajos</p>
        </div>
      </div>
    </section>

    <section class="production-flow">
      <h3>Estado Actual por Sección (Haz clic en una sección para ver detalles)</h3>
      <div class="stages-grid">
        <div 
          class="stage-card" 
          v-for="(seccion, index) in estadoSecciones" 
          :key="index"
          :class="{ 'active-selection': seccionDetalle?.nombre === seccion.nombre }"
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
              :style="{ width: calcularPorcentaje(seccion.docenas) + '%' }"
              :class="{ 'overload': calcularPorcentaje(seccion.docenas) > 80 }"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <section v-if="seccionDetalle" class="detail-panel">
      <div class="detail-card">
        <div class="detail-header">
          <h3>Detalles de Producción en: <span class="highlight-text">{{ seccionDetalle.nombre }}</span></h3>
          <button @click="seccionDetalle = null" class="btn-close">&times;</button>
        </div>
        
        <table class="detail-table">
          <thead>
            <tr>
              <th>Cód. Lote</th>
              <th>Docenas</th>
              <th>Operario Responsable</th>
              <th>En proceso desde (Fecha/Hora)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in datosFiltrados" :key="item.lote">
              <td class="fw-bold">{{ item.lote }}</td>
              <td><span class="badge-blue">{{ item.docenas }} doc.</span></td>
              <td><i class="fas fa-user"></i> {{ item.operario }}</td>
              <td><i class="far fa-clock"></i> {{ item.fechaInicio }}</td>
            </tr>
            <tr v-if="datosFiltrados.length === 0">
              <td colspan="4" class="empty-state">No hay registros detallados para esta sección en este momento.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const docenasTerminadasHoy = ref(15);

const estadoSecciones = ref([
  { nombre: 'Cortado', docenas: 25 },
  { nombre: 'Alistado', docenas: 10 },
  { nombre: 'Aparado', docenas: 45 }, 
  { nombre: 'Armado', docenas: 12 },
  { nombre: 'Rematado', docenas: 8 }
]);

const totalDocenasActivas = computed(() => {
  return estadoSecciones.value.reduce((total, seccion) => total + seccion.docenas, 0);
});

const capacidadMaximaIdeal = 50; 
const calcularPorcentaje = (docenas) => {
  let porcentaje = (docenas / capacidadMaximaIdeal) * 100;
  return porcentaje > 100 ? 100 : Math.round(porcentaje);
};

// --- NUEVA LÓGICA DE DETALLES ---
const seccionDetalle = ref(null);

// Base de datos simulada con los registros exactos por AREa
const detalleProduccion = ref([
  { seccion: 'Cortado', lote: 'P-003', docenas: 2, operario: 'Esthephany', fechaInicio: '22/11/2025 14:35:17' },
  { seccion: 'Cortado', lote: 'P-008', docenas: 23, operario: 'Carlos S.', fechaInicio: '28/04/2026 08:15:00' },
  { seccion: 'Aparado', lote: 'P-001', docenas: 45, operario: 'Pedro M.', fechaInicio: '27/04/2026 16:30:00' },
  { seccion: 'Armado', lote: 'P-002', docenas: 12, operario: 'Luis F.', fechaInicio: '28/04/2026 10:00:00' },
]);

const mostrarDetalle = (seccion) => {
  // Si se hace clic en la misma sección abierta, se cierra
  if (seccionDetalle.value?.nombre === seccion.nombre) {
    seccionDetalle.value = null;
  } else {
    seccionDetalle.value = seccion;
  }
};

const datosFiltrados = computed(() => {
  if (!seccionDetalle.value) return [];
  return detalleProduccion.value.filter(d => d.seccion === seccionDetalle.value.nombre);
});
</script>

<style scoped>
.dashboard-container { padding: 20px; background-color: #f4f6f9; min-height: 100vh; font-family: Arial, sans-serif; }
.dashboard-header { margin-bottom: 30px; color: #2c3e50; }
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 40px; }
.kpi-card { display: flex; align-items: center; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #ccc; }
.kpi-card.primary { border-left-color: #3498db; }
.kpi-card.success { border-left-color: #2ecc71; }
.kpi-card.warning { border-left-color: #f1c40f; }
.kpi-icon { font-size: 2.5rem; margin-right: 20px; color: #7f8c8d; }
.kpi-data h3 { margin: 0; font-size: 0.9rem; color: #95a5a6; text-transform: uppercase; }
.kpi-number { margin: 5px 0 0; font-size: 1.8rem; font-weight: bold; color: #2c3e50; }
.production-flow h3 { color: #2c3e50; margin-bottom: 20px; }
.stages-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; }

.stage-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); text-align: center; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent; }
.stage-card:hover { transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
.stage-card.active-selection { border-color: #3498db; background-color: #f0f8ff; transform: scale(1.02); }

.stage-card h4 { margin-top: 0; color: #34495e; font-size: 1.1rem; }
.stage-stats { margin: 15px 0; }
.stage-stats .qty { font-size: 2rem; font-weight: bold; color: #2980b9; display: block; }
.stage-stats .label { font-size: 0.85rem; color: #7f8c8d; }
.progress-bar-container { width: 100%; height: 8px; background-color: #ecf0f1; border-radius: 4px; overflow: hidden; }
.progress-fill { height: 100%; background-color: #3498db; transition: width 0.3s ease; }
.progress-fill.overload { background-color: #e74c3c; }

/* NUEVOS ESTILOS PARA EL PANEL DE DETALLES */
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>