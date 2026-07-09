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

      <div :class="['work-queue', sectionCssClass]">
        <h4>Docenas en cola para {{ seccionSeleccionadaLabel }}</h4>

        <div v-if="seccionSeleccionada && seccionSeleccionada !== 'DOC_ACABADO'" class="search-panel">
          <div class="search-controls">
            <select v-model="searchMode" class="search-select">
              <option value="id_docena">Buscar por ID docena</option>
              <option value="codigo_qr">Buscar por código QR</option>
            </select>
            <input
              v-model="searchTerm"
              :placeholder="searchMode === 'id_docena' ? 'Ej. 123' : 'Escanea o escribe el código QR'"
              class="search-input"
              @keyup.enter="buscarDocena"
            />
            <button class="btn-search" @click="buscarDocena" :disabled="isSearching">
              {{ isSearching ? 'Buscando...' : 'Buscar' }}
            </button>
            <button v-if="searchMode === 'codigo_qr'" class="btn-scan" @click="alternarEscanerQr">
              {{ qrScannerActive ? 'Detener escáner' : 'Escanear QR' }}
            </button>
            <button class="btn-reset" @click="restaurarLista" :disabled="isSearching">
              Ver todos
            </button>
          </div>

          <div v-if="qrScannerActive" class="qr-scanner-card">
            <video ref="videoRef" class="qr-video" autoplay playsinline muted></video>
            <p class="qr-hint">Apunta la cámara al código QR para buscar la docena.</p>
          </div>
          <p v-if="searchMessage" class="search-message">{{ searchMessage }}</p>
        </div>

        <div class="table-responsive">
          <div class="scrollable-table">
            <table class="terminal-table">
              <thead>
              <tr>
                <th>Pedido</th>
                <th>Modelo</th>
                <th>ID Docena</th>
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
                <td>{{ docena.id_docena || '—' }}</td>
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
                <td :colspan="seccionSeleccionada === 'DOC_ACABADO' ? 5 : 6" class="empty-state">No hay docenas activas para esta estación.</td>
              </tr>
            </tbody>
          </table>
          </div>
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
            <div v-if="qrPreviewValue" class="qr-assignment-card">
              <div class="qr-preview">
                <QRCodeVue :value="qrPreviewValue" :size="180" level="H" render-as="svg" />
              </div>
              <button class="btn-download-qr" @click="descargarQr">Descargar imagen</button>
            </div>
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
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import QRCodeVue from 'qrcode.vue';

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
const searchMode = ref('id_docena');
const searchTerm = ref('');
const searchMessage = ref('');
const isSearching = ref(false);
const qrScannerActive = ref(false);
const videoRef = ref(null);
let qrStream = null;
let qrDetector = null;
let qrScanFrameRequested = false;

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
  searchTerm.value = '';
  searchMessage.value = '';
  await fetchDocenas(estado);
  if (estado === 'DOC_ACABADO') {
    await fetchDocenasCompletadas();
  }
};

const cambiarSeccion = () => {
  detenerEscanerQr();
  seccionSeleccionada.value = null;
  docenas.value = [];
  mensajes.value = '';
  searchTerm.value = '';
  searchMessage.value = '';
};

const isDocAcabadoSection = computed(() => seccionSeleccionada.value === 'DOC_ACABADO');

const qrPreviewValue = computed(() => {
  if (!docenaSeleccionada.value) return '';
  if (docenaSeleccionada.value.codigo_qr) return String(docenaSeleccionada.value.codigo_qr);
  if (docenaSeleccionada.value.id_docena) return `DOCENA-${docenaSeleccionada.value.id_docena}`;
  return '';
});

const seccionSeleccionadaLabel = computed(() => {
  return stageLabels[seccionSeleccionada.value] || seccionSeleccionada.value;
});

const sectionCssClass = computed(() => {
  if (!seccionSeleccionada.value) return '';
  return seccionSeleccionada.value.toLowerCase().replace(/_/g, '-');
});

const buscarDocena = async () => {
  const termino = searchTerm.value.trim();
  if (!termino) {
    searchMessage.value = 'Escribe un ID de docena o un código QR para buscar.';
    return;
  }

  isSearching.value = true;
  searchMessage.value = '';
  mensajes.value = '';

  try {
    const params = new URLSearchParams();
    if (searchMode.value === 'id_docena') {
      params.set('id_docena', termino);
    } else {
      params.set('codigo_qr', termino);
    }

    const estadoBusqueda = stationStateFetch[seccionSeleccionada.value] || seccionSeleccionada.value;
    if (estadoBusqueda) {
      params.set('estado', estadoBusqueda);
    }

    const response = await fetch(`http://localhost:3000/api/produccion/trazabilidad/buscar?${params.toString()}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'No se encontró la docena');
    }

    docenas.value = Array.isArray(data) ? data : [data];
    searchMessage.value = docenas.value.length
      ? `Se encontró ${docenas.value.length} resultado(s).`
      : 'No se encontró ninguna docena con esos datos.';
  } catch (err) {
    docenas.value = [];
    searchMessage.value = err.message || 'No se pudo buscar la docena.';
    console.error(err);
  } finally {
    isSearching.value = false;
  }
};

const restaurarLista = async () => {
  searchTerm.value = '';
  searchMessage.value = '';
  await fetchDocenas(seccionSeleccionada.value);
};

const detenerEscanerQr = () => {
  qrScannerActive.value = false;
  qrScanFrameRequested = false;
  if (qrStream) {
    qrStream.getTracks().forEach((track) => track.stop());
    qrStream = null;
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null;
  }
};

const escanearCodigoQr = async () => {
  if (!('BarcodeDetector' in window)) {
    searchMessage.value = 'Tu navegador no soporta escaneo de QR desde la cámara.';
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    searchMessage.value = 'La cámara no está disponible en este navegador.';
    return;
  }

  try {
    qrScannerActive.value = true;
    qrStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    if (videoRef.value) {
      videoRef.value.srcObject = qrStream;
      await videoRef.value.play();
    }

    qrDetector = new window.BarcodeDetector({ formats: ['qr_code'] });
    qrScanFrameRequested = true;
    const escanearFrame = async () => {
      if (!qrScanFrameRequested || !qrScannerActive.value || !videoRef.value || !qrDetector) return;
      try {
        const barcodes = await qrDetector.detect(videoRef.value);
        if (barcodes.length) {
          const valor = barcodes[0].rawValue;
          if (valor) {
            searchMode.value = 'codigo_qr';
            searchTerm.value = valor;
            detenerEscanerQr();
            await buscarDocena();
            return;
          }
        }
      } catch (err) {
        console.error('Error al leer QR:', err);
      }

      if (qrScannerActive.value) {
        requestAnimationFrame(escanearFrame);
      }
    };

    escanearFrame();
  } catch (err) {
    searchMessage.value = 'No se pudo abrir la cámara para leer el QR.';
    qrScannerActive.value = false;
    console.error(err);
  }
};

const alternarEscanerQr = async () => {
  if (qrScannerActive.value) {
    detenerEscanerQr();
    return;
  }

  await escanearCodigoQr();
};

const descargarQr = () => {
  if (!docenaSeleccionada.value || !qrPreviewValue.value) return;

  const svgEl = document.querySelector('.qr-preview svg');
  if (!svgEl) return;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `qr-docena-${docenaSeleccionada.value.id_docena || 'docena'}.png`;
  link.click();
  URL.revokeObjectURL(url);
};

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

onBeforeUnmount(() => {
  detenerEscanerQr();
});
</script>




