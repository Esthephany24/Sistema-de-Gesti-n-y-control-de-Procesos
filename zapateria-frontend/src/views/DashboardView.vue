<template>
  <div class="dashboard-container">
    <header class="dashboard-header">
      <div>
        <p class="eyebrow">Planta de Producción</p>
        <h2>Dashboard Kanban de Producción</h2>
        <p class="subtitle">Visualiza el avance de cada docena en tiempo real.</p>
      </div>
      <div class="header-badge">Sistema Industrial de Calzado</div>
    </header>

    <section class="kpi-grid">
      <article class="kpi-card blue">
        <div>
          <p class="kpi-label">Total de Docenas Activas</p>
          <h3>{{ totalDocenasActivas }}</h3>
        </div>
        <span class="kpi-pill">Activo</span>
      </article>

      <article class="kpi-card green">
        <div>
          <p class="kpi-label">En Fase</p>
          <h3>{{ totalEnProceso }}</h3>
        </div>
        <span class="kpi-pill">Kanban</span>
      </article>

      <article class="kpi-card yellow">
        <div>
          <p class="kpi-label">Docenas en Acabado</p>
          <h3>{{ docenasTerminadasHoy }}</h3>
        </div>
        <span class="kpi-pill">Listo</span>
      </article>
    </section>

    <section class="kanban-board">
      <div class="kanban-column" v-for="stage in stages" :key="stage.key">
        <div class="column-header" :style="{ backgroundColor: stage.color }">
          <strong>{{ stage.label }}</strong>
          <span>{{ cardsByStage[stage.key]?.length || 0 }}</span>
        </div>

        <div class="column-body">
          <div v-if="cardsByStage[stage.key]?.length === 0" class="empty-column">
            Ninguna docena en esta etapa.
          </div>

          <article
            class="kanban-card"
            v-for="docena in cardsByStage[stage.key]"
            :key="docena.id_docena"
          >
            <div class="card-top">
              <span class="chip">Docena {{ docena.numero_docena }}</span>
              <span class="status">{{ docena.estado_actual }}</span>
            </div>
            <div class="card-body">
              <div class="qr-holder">
                <img :src="qrUrl(docena.codigo_qr)" alt="QR" />
              </div>
              <div class="card-info">
                <p class="model">{{ docena.modelo }}</p>
                <p class="detail">Color: <strong>{{ docena.color }}</strong></p>
                <p class="detail">Serie: {{ docena.serie || 'N/D' }}</p>
                <p class="detail">Cliente: {{ docena.cliente }}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <footer class="board-footer">
      <div v-if="error" class="feedback error">Error: {{ error }}</div>
      <div v-else class="feedback">Actualización automática cada 7 segundos.</div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';

const stages = [
  { key: 'CORTE', label: 'CORTE', color: '#2f80ed' },
  { key: 'APARADO', label: 'APARADO', color: '#f2c94c' },
  { key: 'ARMADO', label: 'ARMADO', color: '#f2994a' },
  { key: 'ACABADO', label: 'ACABADO', color: '#27ae60' }
];

const trazabilidad = ref([]);
const error = ref(null);
const loading = ref(false);
let refreshInterval = null;

const fetchTrazabilidad = async () => {
  loading.value = true;
  error.value = null;
  try {
    const response = await fetch('http://localhost:3000/api/produccion/trazabilidad');
    if (!response.ok) throw new Error('No fue posible cargar los datos de trazabilidad');
    trazabilidad.value = await response.json();
  } catch (err) {
    error.value = err.message || 'Error de red';
  } finally {
    loading.value = false;
  }
};

const cardsByStage = computed(() => {
  const grouped = { CORTE: [], APARADO: [], ARMADO: [], ACABADO: [] };
  trazabilidad.value.forEach((item) => {
    if (grouped[item.estado_actual]) grouped[item.estado_actual].push(item);
  });
  return grouped;
});

const totalDocenasActivas = computed(() => trazabilidad.value.length);
const totalEnProceso = computed(() => trazabilidad.value.filter((item) => item.estado_actual !== 'ACABADO').length);
const docenasTerminadasHoy = computed(() => cardsByStage.value.ACABADO.length);

const qrUrl = (codigo) => {
  const payload = encodeURIComponent(codigo || 'ZAPATERIA');
  return `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${payload}`;
};

onMounted(() => {
  fetchTrazabilidad();
  refreshInterval = setInterval(fetchTrazabilidad, 7000);
});

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval);
});
</script>

<style scoped>
.dashboard-container {
  min-height: 100vh;
  padding: 28px;
  background: linear-gradient(180deg, #f7fafc 0%, #e8eff6 100%);
  color: #1f2937;
  font-family: 'Inter', system-ui, sans-serif;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #4b5563;
  font-size: 0.85rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.dashboard-header h2 {
  margin: 0;
  font-size: clamp(1.9rem, 2.5vw, 2.6rem);
  color: #111827;
}

.subtitle {
  margin: 10px 0 0;
  color: #4b5563;
  max-width: 560px;
}

.header-badge {
  align-self: center;
  background: rgba(47, 128, 237, 0.12);
  color: #1d4ed8;
  padding: 12px 18px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-bottom: 28px;
}

.kpi-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 22px;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08);
  background: #ffffff;
}

.kpi-label {
  margin: 0;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b7280;
}

.kpi-card h3 {
  margin: 10px 0 0;
  font-size: 2rem;
  letter-spacing: -0.03em;
}

.kpi-pill {
  background: rgba(30, 64, 175, 0.08);
  color: #1d4ed8;
  font-size: 0.8rem;
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 700;
}

.blue { border-left: 4px solid #2f80ed; }
.green { border-left: 4px solid #27ae60; }
.yellow { border-left: 4px solid #f2c94c; }

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.kanban-column {
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 22px;
  box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
  overflow: hidden;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  color: #ffffff;
  font-weight: 700;
}

.column-body {
  padding: 20px;
  min-height: 360px;
  display: grid;
  gap: 16px;
}

.empty-column {
  color: #6b7280;
  padding: 24px;
  border: 1px dashed #d1d5db;
  border-radius: 18px;
  text-align: center;
  background: #f8fafc;
}

.kanban-card {
  display: grid;
  gap: 16px;
  padding: 20px;
  border-radius: 20px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.chip {
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #2563eb;
  background: rgba(59, 130, 246, 0.12);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 700;
}

.status {
  font-size: 0.8rem;
  color: #374151;
  font-weight: 600;
}

.card-body {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 16px;
  align-items: center;
}

.qr-holder {
  background: #eef2ff;
  padding: 16px;
  border-radius: 18px;
  display: grid;
  place-items: center;
}

.qr-holder img {
  width: 100%;
  height: auto;
  border-radius: 14px;
}

.card-info {
  display: grid;
  gap: 8px;
}

.model {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: #111827;
}

.detail {
  margin: 0;
  color: #4b5563;
  font-size: 0.95rem;
}

.board-footer {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

.feedback {
  color: #4b5563;
  font-size: 0.95rem;
}

.error {
  color: #b91c1c;
}

@media (max-width: 1250px) {
  .kanban-board { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 820px) {
  .kpi-grid { grid-template-columns: 1fr; }
  .kanban-board { grid-template-columns: 1fr; }
  .dashboard-header { flex-direction: column; align-items: flex-start; }
}
</style>
