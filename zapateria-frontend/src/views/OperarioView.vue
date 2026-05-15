<template>
  <div class="terminal-container">
    
    <section v-if="!seccionSeleccionada" class="station-selector">
      <h3>Selecciona tu estación de trabajo</h3>
      <div class="station-grid">
        <button
          v-for="seccion in secciones"
          :key="seccion.key"
          class="btn-station"
          @click="seleccionarSeccion(seccion.key)"
        >
          {{ seccion.label }}
          <span class="stage-count">{{ seccion.count }}</span>
        </button>
      </div>
    </section>

    <section v-else class="active-terminal">
      <div class="terminal-controls">
        <h3>📍 Sección actual: <span class="highlight">{{ seccionSeleccionadaLabel }}</span></h3>
        <button class="btn-back" @click="cambiarSeccion">
          <i class="fas fa-arrow-left"></i> Cambiar Estación
        </button>
      </div>

      <div class="work-queue">
        <h4>Docenas en cola para {{ seccionSeleccionadaLabel }}</h4>
        <div class="table-responsive">
          <table class="terminal-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Modelo</th>
                <th v-if="seccionSeleccionada !== 'DOC_ACABADO'">Docena</th>
                <th v-if="seccionSeleccionada !== 'DOC_ACABADO'">Color</th>
                <th v-if="seccionSeleccionada === 'DOC_ACABADO'">Serie</th>
                <th v-if="seccionSeleccionada !== 'DOC_ACABADO'">
                  Acción
                </th>
                <th v-else>
                  Avance Pedido
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="docena in docenas" :key="docena.id_docena">
                <td class="fw-bold">P-{{ String(docena.id_pedido).padStart(3, '0') }}</td>
                <td>{{ docena.modelo }}</td>
                <!--
                <td><span class="badge-qty">{{ docena.numero_docena }}</span></td>
                <td>
                  <span class="color-pill">
                    {{docena.color}}
                  </span>
                </td>
                -->
                <td v-if="seccionSeleccionada !== 'DOC_ACABADO'">
                  <span class="badge-qty">
                    {{ docena.numero_docena }}
                  </span>
                </td>
                <td v-if="seccionSeleccionada !== 'DOC_ACABADO'">
                  <span class="color-pill">
                    {{ docena.color }}
                  </span>
                </td>
                <td v-if="seccionSeleccionada === 'DOC_ACABADO'">
                  {{ docena.serie }}
                </td>
                <!--
                <td class="action-group">
                  <template v-if="!docena.asignado">
                    <button 
                      class="btn-assign" 
                      @click="abrirAsignacion(docena)"
                    >
                    Asignar
                    </button>
                    </template>

                    <template v-else>
                      <span class="operario-badge">
                        {{ docena.operario_asignado}}
                      </span>
                    </template>

                    <button
                      class="btn-action-small"
                      @click="registrarAvance(docena)"
                      :disabled="isSubmitting"
                    >
                      Salida
                    </button>
                </td>-->
                <td v-if="seccionSeleccionada !== 'DOC_ACABADO'" class="action-group">
                  <template v-if="!docena.asignado">
                    <button
                      class="btn-assign" @click="abrirAsignacion(docena)">
                      Asignar
                    </button>
                  </template>
                  <template v-else>
                    <span class="operario-badge">
                      {{ docena.operario_asignado }}
                    </span>
                  </template>
                  <button class="btn-action-small"
                    @click="registrarAvance(docena)" :disabled="isSubmitting">
                    Salida
                  </button>
              </td>
              <td v-else>
                <div class="packing-container">
                  <div class="packing-info">
                    <span>
                      {{ docena.docenas_terminadas }}
                      /
                      {{ docena.total_doc_pedido }}
                      docenas
                    </span>
                    <span>
                      {{ docena.porcentaje_avance }}%
                    </span>
                  </div>
                  <div class="packing-bar">
                    <div
                      class="packing-fill"
                      :style="{
                        width: docena.porcentaje_avance + '%'
                      }"
                    ></div>
                  </div>
                  <button
                    class="btn-detail"
                    @click="verDetallePedido(docena)" >
                    Ver detalle
                  </button>
                  <button class="btn-pack">
                    Empaquetar
                  </button>
                </div>
              </td>
              </tr>
              <tr v-if="docenas.length === 0">
                <td colspan="5" class="empty-state">No hay docenas activas para esta estación.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <section v-if="isDocAcabadoSection && docenasCompletadas.length" class="progress-report">
        <h4>Avance de pedidos terminados</h4>
        <div class="progress-grid">
          <div class="progress-card" v-for="pedido in docenasCompletadas" :key="pedido.id_pedido">
            <div class="progress-header">
              <h4>Pedido P-{{ String(pedido.id_pedido).padStart(3, '0') }}</h4>
              <span class="progress-percentage">{{ pedido.porcentaje_avance }}%</span>
            </div>
            <div class="progress-info">
              <p class="progress-text">{{ pedido.docenas_acabadas }} de {{ pedido.total_docenas }} docenas terminadas</p>
            </div>
            <div class="progress-bar-container">
              <div class="progress-bar-large">
                <div class="progress-fill-large" :style="{ width: pedido.porcentaje_avance + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div v-if="modalDetalle" class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h3>
              Pedido P-{{
                String(pedidoDetalle.id_pedido).padStart(3, '0')}}
            </h3>
            <button
              class="btn-close"
              @click="modalDetalle = false">
              X
            </button>
          </div>
          <div v-if="detallePedido.length">
            <p>
              <strong>Modelo:</strong>
              {{ detallePedido[0].modelo }}
            </p>
            <p>
              <strong>Serie:</strong>
              {{ detallePedido[0].serie }}
            </p>
            <h4>Docenas acabadas</h4>
            <ul class="detalle-list">
            <div
              v-for="item in detallePedido"
              :key="item.numero_docena"
              class="detalle-item">
              <span class="detalle-docena">
                Docena {{ item.numero_docena }}
              </span>
              <span class="detalle-color">
                {{ item.color }}
              </span>
            </div>
            </ul>
          </div>
        </div>
      </div>
      <div v-if="mensajes" class="feedback info">{{ mensajes }}</div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const operarioActual = ref('Esthephany');
const seccionSeleccionada = ref(null);
const secciones = ref([]);
const docenas = ref([]);
const docenasCompletadas = ref([]);
const mensajes = ref('');
const operariosDisponibles = ref([]);
const docenaSeleccionada = ref(null);
const modalDetalle = ref(false);
const detallePedido = ref([]);
const pedidoDetalle = ref(null);
const isSubmitting = ref(false);

const stageLabels = {
  POR_CORTAR: 'POR CORTAR',
  CORTADO: 'CORTADO',
  CORTE: 'CORTADO',
  ALISTADO: 'ALISTADO',
  APARADO: 'APARADO',
  EMPASTADO: 'EMPASTADO',
  ARMADO: 'ARMADO',
  PEGADO: 'PEGADO',
  REMATADO: 'REMATADO',
  DOC_ACABADO: 'DOC ACABADO',
  TERMINADO: 'DOC ACABADO'
};

const stationStateFetch = {
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

const defaultStageList = [
  { key: 'POR_CORTAR', label: 'POR CORTAR', count: 0 },
  { key: 'CORTADO', label: 'CORTADO', count: 0 },
  { key: 'ALISTADO', label: 'ALISTADO', count: 0 },
  { key: 'APARADO', label: 'APARADO', count: 0 },
  { key: 'EMPASTADO', label: 'EMPASTADO', count: 0 },
  { key: 'ARMADO', label: 'ARMADO', count: 0 },
  { key: 'PEGADO', label: 'PEGADO', count: 0 },
  { key: 'REMATADO', label: 'REMATADO', count: 0 },
  { key: 'DOC_ACABADO', label: 'DOC ACABADO', count: 0 }
];

const fetchSecciones = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/produccion/secciones');
    if (!response.ok) throw new Error('No se pudo cargar las secciones');
    const data = await response.json();
    secciones.value = data.map((item) => ({
      key: item.stage,
      label: stageLabels[item.stage] || item.stage,
      count: item.count
    }));
  } catch (err) {
    mensajes.value = err.message || 'Error al cargar secciones';
    console.error(err);
    secciones.value = defaultStageList;
  }
};

/*const fetchDocenas = async (estado) => {
  try {
    const estadoQuery = stationStateFetch[estado] || estado;
    const response = await fetch(`http://localhost:3000/api/produccion/trazabilidad/operarios/${estadoQuery}`);
    if (!response.ok) throw new Error('No se pudo cargar las docenas');
    docenas.value = await response.json();
  } catch (err) {
    mensajes.value = err.message || 'Error al cargar docenas';
    console.error(err);
  }
};
*/

const fetchDocenas = async (estado) => {
  try {

    let url = '';

    if (estado === 'DOC_ACABADO') {

      url = 'http://localhost:3000/api/produccion/trazabilidad/doc-acabado-resumen';

    } else {

      const estadoQuery = stationStateFetch[estado] || estado;

      url = `http://localhost:3000/api/produccion/trazabilidad/operarios/${estadoQuery}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('No se pudo cargar las docenas');
    }

    docenas.value = await response.json();

  } catch (err) {

    mensajes.value = err.message || 'Error al cargar docenas';

    console.error(err);
  }
};

const obtenerRolPorSeccion = (estado) => {
  const roles = {
    POR_CORTAR: 'Encargado corte',
    CORTADO: 'CORTADO',
    ALISTADO: 'ALISTADO',
    APARADO: 'APARADO',
    EMPASTADO: 'EMPASTADO',
    ARMADO: 'ARMADO',
    PEGADO: 'PEGADO',
    REMATADO: 'REMATADO'
  };

  return roles[estado];
};

const abrirAsignacion = async (docena) => {
  try {

    docenaSeleccionada.value = docena;

    const rol = obtenerRolPorSeccion(seccionSeleccionada.value);

    const response = await fetch(
      `http://localhost:3000/api/produccion/operarios?rol=${rol}`
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Error cargando operarios');
    }

    operariosDisponibles.value = data;

    const id_operario = prompt(
      operariosDisponibles.value
        .map(o => `${o.id_operario} - ${o.nombre}`)
        .join('\n') +
      '\n\nIngrese ID Operario'
    );

    if (!id_operario) return;

    await asignarOperario(docena.id_docena, id_operario);

  } catch (err) {
    console.error(err);
  }
};

const asignarOperario = async (id_docena, id_operario) => {

  const response = await fetch(
    'http://localhost:3000/api/produccion/asignar',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_docena,
        id_operario
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error);
  }

  await fetchDocenas(seccionSeleccionada.value);
};

const verDetallePedido = async (pedido) => {

  try {

    pedidoDetalle.value = pedido;

    const response = await fetch(
      `http://localhost:3000/api/produccion/trazabilidad/doc-acabado-detalle/${pedido.id_pedido}`
    );

    if (!response.ok) {
      throw new Error('Error cargando detalle');
    }

    detallePedido.value = await response.json();

    modalDetalle.value = true;

  } catch (err) {

    console.error(err);

  }

};

const fetchDocenasCompletadas = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/produccion/trazabilidad/completadas');
    if (!response.ok) throw new Error('No se pudo cargar el avance de pedidos');
    docenasCompletadas.value = await response.json();
  } catch (err) {
    console.error(err);
  }
};

const seleccionarSeccion = async (estado) => {
  seccionSeleccionada.value = estado;
  mensajes.value = '';
  await fetchDocenas(estado);
  if (estado === 'DOC_ACABADO') {
    await fetchDocenasCompletadas();
  }
};

const cambiarSeccion = () => {
  seccionSeleccionada.value = null;
  docenas.value = [];
  mensajes.value = '';
};

const isDocAcabadoSection = computed(() => seccionSeleccionada.value === 'DOC_ACABADO');

const seccionSeleccionadaLabel = computed(() => {
  return stageLabels[seccionSeleccionada.value] || seccionSeleccionada.value;
});

const registrarAvance = async (docena) => {
  isSubmitting.value = true;
  mensajes.value = '';

  try {
    const response = await fetch('http://localhost:3000/api/produccion/avanzar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_docena: docena.id_docena,
        estado_actual: seccionSeleccionada.value,
        id_operario: 1
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'No se pudo avanzar la docena');

    mensajes.value = `Docena ${docena.numero_docena} actualizada correctamente.`;
    await fetchDocenas(seccionSeleccionada.value);
    await fetchSecciones();
  } catch (err) {
    mensajes.value = err.message || 'Error al actualizar la docena';
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  await fetchSecciones();
  await fetchDocenasCompletadas();
});
</script>

<style scoped>
.terminal-container {
  min-height: 100vh;
  padding: 24px;
  background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 30%),
    linear-gradient(180deg, #0b1120 0%, #101828 100%);
  color: #f8fafc;
  font-family: Inter, system-ui, sans-serif;
}

.terminal-header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  padding: 28px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.92);
  box-shadow: 0 24px 72px rgba(15, 23, 42, 0.35);
  margin-bottom: 28px;
}

.terminal-header h2 {
  margin: 0;
  font-size: 1.75rem;
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.station-selector {
  text-align: center;
}

.station-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.btn-station {
  padding: 24px 18px;
  border-radius: 24px;
  border: 1px solid rgba(56, 189, 248, 0.24);
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.16), rgba(15, 23, 42, 0.88));
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: grid;
  gap: 10px;
}

.stage-count {
  justify-self: end;
  font-size: 0.9rem;
  opacity: 0.8;
}

.btn-station:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 40px rgba(56, 189, 248, 0.12);
}

.active-terminal {
  display: grid;
  gap: 24px;
}

.terminal-controls {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
}

.highlight {
  color: #38bdf8;
}

.btn-back,
.btn-action {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  padding: 14px 20px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

.btn-back {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.btn-action {
  background: linear-gradient(90deg, #22c55e, #10b981);
  color: #ffffff;
}

.work-queue {
  padding: 24px;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.work-queue h4 {
  margin: 0 0 18px;
  font-size: 1.15rem;
}

.table-responsive {
  overflow-x: auto;
}

.terminal-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

.terminal-table th,
.terminal-table td {
  padding: 16px 14px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  text-align: left;
}

.terminal-table thead {
  background: rgba(15, 23, 42, 0.95);
}

.terminal-table th {
  color: #93c5fd;
  font-size: 0.92rem;
  letter-spacing: 0.02em;
}

.terminal-table td {
  color: #e2e8f0;
}

.fw-bold {
  font-weight: 700;
}

.badge-qty,
.progress-pill {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(59, 130, 246, 0.16);
  color: #93c5fd;
  font-weight: 700;
}

.progress-report {
  padding: 24px;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(148, 163, 184, 0.18);
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 18px;
  margin-top: 18px;
}

.progress-card {
  padding: 20px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.progress-percentage {
  font-weight: 700;
  color: #10b981;
}

.progress-info {
  margin-bottom: 12px;
}

.progress-text {
  margin: 0;
  color: #cbd5e1;
}

.progress-bar-large {
  width: 100%;
  height: 8px;
  background: rgba(148, 163, 184, 0.2);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill-large {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.feedback {
  padding: 18px 20px;
  border-radius: 22px;
  background: rgba(16, 185, 129, 0.12);
  color: #d1fae5;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.empty-state {
  text-align: center;
  padding: 22px;
  color: #cbd5e1;
}

.color-pill {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  font-weight: 700;
}

.action-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-assign {
  border: none;
  padding: 8px 10px;
  border-radius: 10px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-action-small {
  border: none;
  padding: 8px 10px;
  border-radius: 10px;
  background: #10b981;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
}

.operario-badge {
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  font-size: 0.8rem;
  font-weight: 700;
}

@media (max-width: 900px) {
  .terminal-header,
  .terminal-controls,
  .station-grid {
    flex-direction: column;
  }

  .terminal-table {
    min-width: 100%;
  }
}

.packing-container {
  min-width: 260px;
}

.packing-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 0.8rem;
}

.packing-bar {
  width: 100%;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(255,255,255,0.1);
  margin-bottom: 10px;
}

.packing-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #10b981);
}

.btn-pack {
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  background: #f59e0b;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal-content {
  width: 500px;
  max-width: 90%;
  background: #111827;
  border-radius: 20px;
  padding: 24px;
  color: white;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.btn-close {
  border: none;
  background: red;
  color: white;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.btn-detail {
  border: none;
  padding: 8px 12px;
  border-radius: 10px;
  background: #6366f1;
  color: white;
  cursor: pointer;
  margin-right: 10px;
}

.detalle-list {
  margin-top: 12px;
  padding-left: 20px;
}

.detalle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  margin-bottom: 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.05);
}

.detalle-docena {
  font-weight: 700;
  color: #e2e8f0;
}

.detalle-color {
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(168, 85, 247, 0.2);
  color: #d8b4fe;
  font-size: 0.85rem;
}
</style>
