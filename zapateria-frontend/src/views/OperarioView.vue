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
      <div v-if="mostrarAsignacion" class="modal-overlay">
        <div class="modal-content assign-modal">
          <div class="modal-header">
            <h3>Asignar operario</h3>
            <button class="btn-close" @click="cerrarAsignacion">X</button>
          </div>
          <div class="modal-body">
            <p><strong>Pedido:</strong> P-{{ String(docenaSeleccionada?.id_pedido).padStart(3, '0') }} <strong>Docena:</strong> {{ docenaSeleccionada?.numero_docena }}</p>
            <div class="assign-list">
              <label v-for="op in operariosDisponibles" :key="op.id_operario" class="assign-item">
                <input type="radio" :value="op.id_operario" v-model="selectedOperarioId" />
                <span class="assign-name">{{ op.nombre }}</span>
                <span class="assign-meta">{{ op.id_operario }}</span>
              </label>
              <div v-if="operariosDisponibles.length === 0">No hay operarios disponibles.</div>
            </div>
          </div>
          <footer class="modal-footer">
            <button class="btn-cancel" @click="cerrarAsignacion">Cancelar</button>
            <button class="btn-registrar" :disabled="!selectedOperarioId" @click="() => asignarOperario(docenaSeleccionada.id_docena, selectedOperarioId)">Asignar</button>
          </footer>
        </div>
      </div>
      <div v-if="mensajes" class="feedback info">{{ mensajes }}</div>
    </section>
  </div>
</template>

<script setup>
import '../styles/OperarioView.css';
import { ref, computed, onMounted } from 'vue';

const operarioActual = ref('Esthephany');
const seccionSeleccionada = ref(null);
const secciones = ref([]);
const docenas = ref([]);
const docenasCompletadas = ref([]);
const mensajes = ref('');
const operariosDisponibles = ref([]);
const mostrarAsignacion = ref(false);
const selectedOperarioId = ref(null);
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

    operariosDisponibles.value = data || [];
    selectedOperarioId.value = operariosDisponibles.value.length ? operariosDisponibles.value[0].id_operario : null;
    mostrarAsignacion.value = true;

  } catch (err) {
    console.error(err);
  }
};

const cerrarAsignacion = () => {
  mostrarAsignacion.value = false;
  selectedOperarioId.value = null;
  docenaSeleccionada.value = null;
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

  // close assign modal and refresh list
  mostrarAsignacion.value = false;
  selectedOperarioId.value = null;
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
  // If the docena has no assigned operario, open the assign modal first
  if (!docena.asignado) {
    docenaSeleccionada.value = docena;
    await abrirAsignacion(docena);
    return;
  }

  isSubmitting.value = true;
  mensajes.value = '';

  try {
    const idOperario = docena.id_operario_asignado || selectedOperarioId.value;
    if (!idOperario) {
      mensajes.value = 'No hay operario asignado para esta docena';
      isSubmitting.value = false;
      return;
    }

    const response = await fetch('http://localhost:3000/api/produccion/avanzar', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_docena: docena.id_docena,
        estado_actual: seccionSeleccionada.value,
        id_operario: idOperario
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




