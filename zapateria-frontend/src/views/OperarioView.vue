<template>
  <div class="terminal-container">
    <header class="terminal-header">
      <div>
        <p class="eyebrow">Terminal de Operario</p>
        <h2><i class="fas fa-qrcode"></i> Control táctico de docenas</h2>
      </div>
      <div class="user-info">
        <i class="fas fa-user-circle"></i>
        <span>Operario activo</span>
        <strong>{{ operarioActual.name }}</strong>
      </div>
    </header>

    <section v-if="!seccionSeleccionada" class="all-docenas-section">
      <h3>📋 Docenas disponibles en producción</h3>
      <div class="docenas-table-wrapper">
        <table class="docenas-table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>ID Cliente</th>
              <th>Docena</th>
              <th>Modelo</th>
              <th>Color</th>
              <th>Serie</th>
              <th>Estado</th>
              <th>QR</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in trazabilidad" :key="item.id_docena" class="docena-table-row">
              <td><strong>#{{ item.id_pedido }}</strong></td>
              <td>{{ item.id_cliente || 'N/D' }}</td>
              <td>#{{ item.id_docena }} ({{ item.numero_docena }}/{{ item.total_docenas_pedido }})</td>
              <td>{{ item.modelo }}</td>
              <td>{{ item.color }}</td>
              <td>{{ item.serie || 'N/D' }}</td>
              <td>
                <button
                  v-if="!item.asignado"
                  class="btn-state"
                  @click.stop="openAssignModal(item)"
                >
                  Por asignar
                </button>
                <span v-else class="assigned-label">
                  {{ item.operario_asignado || 'Por asignar' }}
                </span>
              </td>
              <td><small>{{ item.codigo_qr }}</small></td>
            </tr>
          </tbody>
        </table>
      </div>

      <hr class="divider" />

      <h3>Selecciona tu estación de trabajo</h3>
      <div class="station-grid">
        <button
          v-for="seccion in secciones"
          :key="seccion"
          class="btn-station"
          @click="seleccionarSeccion(seccion)"
        >
          {{ seccion }}
        </button>
      </div>
    </section>

    <section v-else class="active-terminal">
      <div class="terminal-controls">
        <div>
          <p class="location-label">📍 Sección actual</p>
          <h3>{{ seccionSeleccionada }}</h3>
        </div>
        <button class="btn-back" @click="cambiarSeccion">
          <i class="fas fa-arrow-left"></i> Cambiar Sección
        </button>
      </div>

      <div class="scan-panel">
        <label for="qrInput">Escanea o ingresa código QR</label>
        <div class="scan-row">
          <input
            id="qrInput"
            v-model="qrInput"
            @keyup.enter="seleccionarDocena"
            placeholder="Ej: QR-1234-ABCD"
          />
          <button class="btn-scan" @click="seleccionarDocena">Buscar</button>
        </div>
        <p class="hint">Selecciona una docena de la lista o ingresa su código QR.</p>
      </div>

      <div class="orders-list">
        <article class="order-card" v-for="order in groupedDocenas" :key="order.id_pedido">
          <div class="order-header">
            <div>
              <p class="eyebrow">Pedido #{{ order.id_pedido }}</p>
              <h4>{{ order.cliente }}</h4>
            </div>
            <div class="order-meta">
              <span>{{ order.docenas.length }} docenas</span>
            </div>
          </div>

          <div class="docena-row" v-for="item in order.docenas" :key="item.id_docena">
            <div class="docena-info" @click="seleccionarDesdeLista(item)">
              <strong>#{{ item.id_docena }} · Docena {{ item.numero_docena }}/{{ item.total_docenas_pedido }}</strong>
              <p>{{ item.modelo }} · {{ item.color }} · {{ item.serie || 'Sin serie' }}</p>
              <small>QR: {{ item.codigo_qr }}</small>
            </div>
            <div class="docena-actions">
              <button class="btn-assign" @click.stop="openAssignModal(item)">
                {{ assignButtonLabel }}
              </button>
              <button class="btn-select" @click="seleccionarDesdeLista(item)">
                Ver
              </button>
            </div>
          </div>
        </article>
      </div>

      <section class="summary-panel" v-if="selectedDocena" ref="summaryPanelRef">
        <div class="summary-card">
          <div class="summary-header">
            <div>
              <p class="eyebrow">Resumen de la docena</p>
              <h3>Docena {{ selectedDocena.numero_docena }}</h3>
            </div>
            <div class="status-pill">Estado: {{ selectedDocena.estado_actual }}</div>
          </div>

          <div class="summary-grid">
            <div>
              <span>Modelo</span>
              <strong>{{ selectedDocena.modelo }}</strong>
            </div>
            <div>
              <span>Color</span>
              <strong>{{ selectedDocena.color }}</strong>
            </div>
            <div>
              <span>Serie</span>
              <strong>{{ selectedDocena.serie || 'N/D' }}</strong>
            </div>
            <div>
              <span>Código QR</span>
              <strong>{{ selectedDocena.codigo_qr }}</strong>
            </div>
            <div>
              <span>ID Docena</span>
              <strong>#{{ selectedDocena.id_docena }}</strong>
            </div>
            <div>
              <span>Número en Pedido</span>
              <strong>{{ selectedDocena.numero_docena }}/{{ selectedDocena.total_docenas_pedido }}</strong>
            </div>
            <div>
              <span>Asignado a</span>
              <strong>{{ selectedDocena.operario_asignado ? selectedDocena.operario_asignado : 'Por asignar' }}</strong>
            </div>
          </div>

          <button class="btn-action-large" @click="finalizarEtapa" :disabled="isSubmitting">
            {{ isSubmitting ? 'Procesando...' : 'FINALIZAR ETAPA Y AVANZAR' }}
          </button>
          <p class="feedback" v-if="mensajes">{{ mensajes }}</p>
        </div>
      </section>

      <section v-if="docenasDisponibles.length === 0" class="empty-state">
        No hay docenas activas para esta estación en este momento.
      </section>
    </section>

    <div class="modal-overlay" v-if="showAssignModal">
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <p class="eyebrow">Asignación</p>
            <h3>{{ assignButtonLabel }}</h3>
          </div>
          <button class="modal-close" @click="closeAssignModal">×</button>
        </div>

        <div class="modal-detail">
          <p><strong>Docena:</strong> {{ assignmentDocena && assignmentDocena.numero_docena }}</p>
          <p><strong>Pedido:</strong> #{{ assignmentDocena && assignmentDocena.id_pedido }}</p>
          <p><strong>ID Cliente:</strong> {{ assignmentDocena && assignmentDocena.id_cliente ? assignmentDocena.id_cliente : 'N/D' }}</p>
          <p><strong>Modelo:</strong> {{ assignmentDocena && assignmentDocena.modelo }}</p>
          <p><strong>Color:</strong> {{ assignmentDocena && assignmentDocena.color }}</p>
          <p><strong>Serie:</strong> {{ assignmentDocena && assignmentDocena.serie ? assignmentDocena.serie : 'N/D' }}</p>
          <p><strong>Estado:</strong> {{ assignmentDocena && assignmentDocena.estado_actual }}</p>
          <p><strong>QR:</strong> {{ assignmentDocena && assignmentDocena.codigo_qr }}</p>
        </div>

        <label for="operarioSelect">Selecciona {{ selectedWorkerLabel }}</label>
        <select id="operarioSelect" v-model="selectedOperarioId">
          <option value="" disabled>Selecciona un operario</option>
          <option
            v-for="oper in availableOperarios"
            :key="oper.id_operario"
            :value="oper.id_operario"
          >
            {{ oper.nombre }} {{ oper.rol ? `- ${oper.rol}` : '' }}
          </option>
        </select>

        <div class="modal-actions">
          <button class="btn-assign-large" @click="assignOperario" :disabled="!selectedOperarioId || isSubmitting">
            {{ isSubmitting ? 'Asignando...' : 'Confirmar asignación' }}
          </button>
          <button class="btn-secondary" @click="closeAssignModal" type="button">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const operarioActual = ref({ id: 1, name: 'Esthephany' });
const seccionSeleccionada = ref(null);
const qrInput = ref('');
const trazabilidad = ref([]);
const selectedDocena = ref(null);
const assignmentDocena = ref(null);
const operarios = ref([]);
const selectedOperarioId = ref('');
const showAssignModal = ref(false);
const mensajes = ref('');
const isSubmitting = ref(false);
const summaryPanelRef = ref(null);

const secciones = ['CORTE', 'APARADO', 'ARMADO', 'ACABADO'];

const stageWorkerRole = {
  CORTE: 'CORTADOR',
  APARADO: 'APARADOR',
  ARMADO: 'ARMADOR',
  ACABADO: 'ACABADOR'
};

const stageWorkerLabel = {
  CORTE: 'cortador',
  APARADO: 'aparador',
  ARMADO: 'armador',
  ACABADO: 'acabador'
};

const availableOperarios = computed(() => {
  if (!assignmentDocena.value) return operarios.value;
  const rolBuscado = stageWorkerRole[assignmentDocena.value.estado_actual];
  if (!rolBuscado) return operarios.value;
  const filtrados = operarios.value.filter((oper) => oper.rol && oper.rol.toUpperCase().includes(rolBuscado));
  return filtrados.length ? filtrados : operarios.value;
});

const selectedWorkerLabel = computed(() => {
  if (!assignmentDocena.value) return 'operario';
  return stageWorkerLabel[assignmentDocena.value.estado_actual] || 'operario';
});

const fetchDocenas = async (estado) => {
  try {
    let url = 'http://localhost:3000/api/produccion/trazabilidad';
    if (estado) {
      url = `http://localhost:3000/api/produccion/trazabilidad/estado/${estado}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('No se pudo cargar las docenas activas');
    trazabilidad.value = await response.json();
  } catch (err) {
    mensajes.value = err.message || 'Error al cargar docenas';
    console.error(err);
  }
};

const fetchOperarios = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/produccion/operarios');
    if (!response.ok) throw new Error('No se pudo cargar los operarios');
    operarios.value = await response.json();
  } catch (err) {
    mensajes.value = err.message || 'Error al cargar operarios';
    console.error(err);
  }
};

const seleccionarSeccion = async (seccion) => {
  seccionSeleccionada.value = seccion;
  selectedDocena.value = null;
  assignmentDocena.value = null;
  qrInput.value = '';
  mensajes.value = '';
  await fetchDocenas(seccion);
};

const cambiarSeccion = async () => {
  seccionSeleccionada.value = null;
  selectedDocena.value = null;
  assignmentDocena.value = null;
  selectedOperarioId.value = '';
  showAssignModal.value = false;
  qrInput.value = '';
  mensajes.value = '';
  await fetchDocenas(null);
};

const docenasDisponibles = computed(() => {
  return trazabilidad.value;
});

const groupedDocenas = computed(() => {
  let docenasAMostrar = trazabilidad.value;

  // Si hay búsqueda activa, filtrar solo docenas que coincidan
  if (qrInput.value.trim()) {
    const searchTerm = qrInput.value.trim();
    docenasAMostrar = trazabilidad.value.filter(
      (item) => item.codigo_qr === searchTerm || String(item.id_docena) === searchTerm
    );
  }

  const groups = {};
  docenasAMostrar.forEach((item) => {
    if (!groups[item.id_pedido]) {
      groups[item.id_pedido] = {
        id_pedido: item.id_pedido,
        cliente: item.cliente,
        docenas: []
      };
    }
    groups[item.id_pedido].docenas.push(item);
  });
  return Object.values(groups);
});

const assignButtonLabel = computed(() => {
  if (assignmentDocena.value) {
    return `Seleccionar ${stageWorkerLabel[assignmentDocena.value.estado_actual] || 'operario'}`;
  }
  if (!seccionSeleccionada.value) return 'Seleccionar operario';
  return `Seleccionar ${stageWorkerLabel[seccionSeleccionada.value] || 'operario'}`;
});

const selectedFromInput = computed(() => {
  if (!qrInput.value) return null;
  return docenasDisponibles.value.find(
    (item) => item.codigo_qr === qrInput.value.trim() || String(item.id_docena) === qrInput.value.trim()
  );
});

const seleccionarDocena = () => {
  const docena = selectedFromInput.value;
  if (!docena) {
    mensajes.value = 'No se encontró una docena con ese código en esta estación.';
    selectedDocena.value = null;
    return;
  }
  selectedDocena.value = docena;
  mensajes.value = '';
};

const seleccionarDesdeLista = (item) => {
  selectedDocena.value = item;
  qrInput.value = item.codigo_qr;
  mensajes.value = '';
  // Scroll al resumen después de que se actualice el DOM
  setTimeout(() => {
    summaryPanelRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 0);
};

const openAssignModal = (item) => {
  assignmentDocena.value = item;
  selectedOperarioId.value = '';
  showAssignModal.value = true;
  mensajes.value = '';
};

const closeAssignModal = () => {
  assignmentDocena.value = null;
  selectedOperarioId.value = '';
  showAssignModal.value = false;
};

const assignOperario = async () => {
  if (!assignmentDocena.value || !selectedOperarioId.value) return;

  isSubmitting.value = true;
  mensajes.value = '';

  try {
    const response = await fetch('http://localhost:3000/api/produccion/asignar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_docena: assignmentDocena.value.id_docena,
        id_operario: Number(selectedOperarioId.value)
      })
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No fue posible asignar el operario');

    mensajes.value = `Operario asignado correctamente a la docena ${assignmentDocena.value.numero_docena}.`;
    closeAssignModal();
    await fetchDocenas(seccionSeleccionada.value);
  } catch (err) {
    mensajes.value = err.message;
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

const finalizarEtapa = async () => {
  if (!selectedDocena.value) return;

  isSubmitting.value = true;
  mensajes.value = '';

  try {
    const response = await fetch('http://localhost:3000/api/produccion/avanzar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_docena: selectedDocena.value.id_docena,
        id_operario: operarioActual.value.id
      })
    });

    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'No fue posible actualizar la docena');

    mensajes.value = 'Etapa finalizada con éxito. La docena avanzó al siguiente proceso.';
    await fetchDocenas(seccionSeleccionada.value);
    selectedDocena.value = null;
    qrInput.value = '';
  } catch (err) {
    mensajes.value = err.message;
    console.error(err);
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(async () => {
  await fetchOperarios();
  await fetchDocenas(null);
});
</script>

<style scoped>
.terminal-container {
  min-height: 100vh;
  padding: 22px;
  background: radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 35%),
    linear-gradient(180deg, #0f172a 0%, #131a2d 100%);
  color: #f8fafc;
  font-family: 'Inter', system-ui, sans-serif;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 18px;
  align-items: center;
  padding: 24px;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.88);
  box-shadow: 0 28px 80px rgba(15, 23, 42, 0.35);
  margin-bottom: 24px;
}

.user-info {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.15);
  color: #e2e8f0;
  font-weight: 600;
}

.station-selector {
  text-align: center;
}

.all-docenas-section {
  margin-bottom: 32px;
}

.all-docenas-section h3 {
  margin-bottom: 18px;
  font-size: 1.2rem;
}

.docenas-table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 360px;
  border-radius: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.94);
}

.docenas-table {
  min-width: 1000px;
}

.btn-state {
  background: #f59e0b;
  color: white;
  border: none;
  border-radius: 14px;
  padding: 10px 14px;
  cursor: pointer;
  font-weight: 700;
}

.assigned-label {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(34, 197, 94, 0.18);
  color: #d9f99d;
  font-weight: 700;
}

.docenas-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.docenas-table thead {
  background: rgba(14, 165, 233, 0.15);
  border-bottom: 2px solid rgba(148, 163, 184, 0.2);
}

.docenas-table th {
  padding: 14px 12px;
  text-align: left;
  font-weight: 700;
  color: #bfdbfe;
  white-space: nowrap;
}

.docenas-table tbody tr {
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  transition: background 0.2s ease;
}

.docenas-table tbody tr:hover {
  background: rgba(59, 130, 246, 0.08);
}

.docenas-table td {
  padding: 12px;
  color: #f8fafc;
}

.state-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.state-corte {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.state-aparado {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
}

.state-armado {
  background: rgba(249, 115, 22, 0.2);
  color: #fed7aa;
}

.state-acabado {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
}

.divider {
  border: none;
  border-top: 1px solid rgba(148, 163, 184, 0.15);
  margin: 28px 0;
}

.station-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 24px;
}

.btn-station {
  display: block;
  width: 100%;
  padding: 24px 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: linear-gradient(180deg, rgba(14, 165, 233, 0.18), rgba(15, 23, 42, 0.7));
  color: #f8fafc;
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
}

.station-grid button:hover {
  transform: translateY(-2px);
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

.location-label,
.eyebrow {
  margin: 0;
  color: #93c5fd;
  font-size: 0.85rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.btn-back {
  padding: 12px 18px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(148, 163, 184, 0.18);
  color: #f8fafc;
  font-weight: 700;
  cursor: pointer;
}

.scan-panel {
  padding: 24px;
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.scan-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  margin-top: 14px;
}

input,
select {
  width: 100%;
  border: none;
  border-radius: 18px;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  font-size: 1rem;
  outline: none;
}

input::placeholder {
  color: rgba(248, 250, 252, 0.6);
}

select {
  appearance: none;
  color: #f8fafc;
  background: rgba(15, 23, 42, 0.96);
}

select option {
  color: #f8fafc;
  background: #0f172a;
}

.btn-scan,
.btn-assign,
.btn-assign-large,
.btn-secondary,
.btn-select,
.modal-close {
  border: none;
  border-radius: 16px;
  cursor: pointer;
}

.btn-scan {
  padding: 0 24px;
  background: #10b981;
  color: white;
  font-weight: 700;
}

.orders-list {
  display: grid;
  gap: 18px;
}

.order-card {
  border-radius: 24px;
  background: rgba(15, 23, 42, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.18);
  padding: 20px;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.order-meta {
  color: #cbd5e1;
  font-weight: 700;
}

.docena-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
  align-items: center;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.04);
  margin-bottom: 12px;
}

.docena-row:last-child {
  margin-bottom: 0;
}

.docena-info {
  cursor: pointer;
}

.docena-info strong {
  display: block;
  margin-bottom: 6px;
}

.docena-info p,
.docena-info small {
  margin: 0;
  color: #cbd5e1;
}

.docena-actions {
  display: grid;
  gap: 10px;
}

.btn-assign {
  background: #3b82f6;
  color: white;
  padding: 12px 18px;
  font-weight: 700;
}

.btn-select {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  padding: 12px 18px;
}

.summary-panel {
  padding: 0;
  margin-top: 24px;
}

.summary-card {
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.84));
  padding: 24px;
  border: 2px solid rgba(16, 185, 129, 0.3);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
}

.summary-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  margin-bottom: 18px;
}

.status-pill {
  padding: 12px 18px;
  border-radius: 999px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.16);
  color: #a7f3d0;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-grid span {
  display: block;
  color: #94a3b8;
  margin-bottom: 6px;
  font-size: 0.88rem;
}

.summary-grid strong {
  display: block;
  color: #f8fafc;
  font-size: 1rem;
}

.btn-action-large,
.btn-assign-large {
  width: 100%;
  padding: 18px;
  border-radius: 18px;
  background: linear-gradient(90deg, #22c55e, #10b981);
  color: white;
  font-size: 1.05rem;
  font-weight: 700;
}

.btn-action-large:disabled,
.btn-assign-large:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #f8fafc;
  padding: 14px 18px;
  font-weight: 700;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 50;
}

.modal-card {
  width: min(620px, 100%);
  background: #0f172a;
  border-radius: 24px;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}

.modal-close {
  width: 42px;
  height: 42px;
  font-size: 1.5rem;
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.05);
}

.modal-detail {
  color: #cbd5e1;
  margin: 0 0 18px;
}

.modal-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.empty-state {
  padding: 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px dashed rgba(148, 163, 184, 0.2);
  color: #cbd5e1;
  text-align: center;
}

@media (max-width: 900px) {
  .terminal-controls,
  .scan-row,
  .summary-grid,
  .docena-row,
  .modal-actions {
    grid-template-columns: 1fr;
  }
}
</style>
