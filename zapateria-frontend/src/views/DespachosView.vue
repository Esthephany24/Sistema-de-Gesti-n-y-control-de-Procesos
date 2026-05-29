<template>
  <div class="despacho-container">
    <div class="despacho-header">
      <div class="busqueda-card">
        <div class="busqueda-card__title">
          <span class="busqueda-card__icon">■</span>
          <h3>Buscar Despachos</h3>
        </div>
        <div class="busqueda-card__grid">
          <div class="field-group">
            <label>Por N.º Guía</label>
            <input
              type="text"
              v-model="searchGuia"
              placeholder="    "
              @keyup.enter="buscarDespachos"
            />
          </div>
          <div class="field-group">
            <label>Por N.º de Pedido</label>
            <input
              type="text"
              v-model="searchOrden"
              placeholder="   "
              @keyup.enter="buscarDespachos"
            />
          </div>
          <div class="busqueda-card__actions">
            <button class="btn-clear-large" @click="limpiarBusqueda">× Limpiar</button>
            <button class="btn-search-large" @click="buscarDespachos">Buscar</button>
          </div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <table class="despacho-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Guía</th>
            <th>Transporte</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in despachos"
            :key="item.id_despacho">
            <td>
              P-{{ String(item.id_pedido).padStart(3, '0') }}
            </td>
            <td>
              {{ item.cliente }}
            </td>
            <td>
              <span
                class="badge"
                :class="item.estado_envio.toLowerCase()">
                {{ item.estado_envio }}
              </span>
            </td>
            <td>
              {{ item.numero_guia || 'Sin guía' }}
            </td>
            <td>
              {{ item.empresa_transporte || '---' }}
            </td>
            <td class="actions">
              <button
                v-if="item.estado_envio === 'PENDIENTE_GUIA'"
                class="btn-guide"
                @click="abrirModalGuia(item)">
                Registrar Guía
              </button>
              <button
                v-if="item.estado_envio === 'GUIA_GENERADA'"
                class="btn-send"
                @click="marcarEnviado(item)">
                Marcar Enviado
              </button>
              <button
                v-if="item.estado_envio === 'ENVIADO'"
                class="btn-deliver"
                @click="marcarEntregado(item)">
                Entregado
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModalGuia" class="modal-overlay">
      <div class="modal-card">
        <header class="modal-header">
          <h3>Registrar guía</h3>
          <button class="btn-close" @click="cerrarModalGuia">×</button>
        </header>
        <div class="modal-body">
          <p class="modal-subtitle">Pedido: P-{{ String(guiaForm.id_pedido).padStart(3, '0') }}</p>
          <label>Número de guía</label>
          <input v-model="guiaForm.numero_guia" type="text" placeholder="Ej. G-12345" />
          <label>Empresa de transporte</label>
          <input v-model="guiaForm.empresa_transporte" type="text" placeholder="Ej. TransExpress" />
        </div>
        <footer class="modal-footer">
          <button class="btn-cancel" @click="cerrarModalGuia">Cancelar</button>
          <button class="btn-primary" @click="enviarGuia">Registrar guía</button>
        </footer>
      </div>
    </div>

    <div v-if="mostrarExitoGuia" class="modal-overlay">
      <div class="modal-card success-card">
        <div class="success-icon">✓</div>
        <h3>Guía registrada</h3>
        <p>Se registró correctamente la guía de despacho.</p>
        <button class="btn-primary" @click="cerrarExitoGuia">Aceptar</button>
      </div>
    </div>

    <div v-if="mostrarErrorGuia" class="modal-overlay">
      <div class="modal-card error-card">
        <h3>Error</h3>
        <p>{{ errorGuiaMensaje }}</p>
        <button class="btn-danger" @click="cerrarErrorGuia">Entendido</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import '../styles/DespachosView.css';
import { ref, onMounted } from 'vue';

const despachos = ref([]);
const searchGuia = ref('');
const searchOrden = ref('');
const mostrarModalGuia = ref(false);
const mostrarExitoGuia = ref(false);
const mostrarErrorGuia = ref(false);
const errorGuiaMensaje = ref('');
const guiaForm = ref({
  id_despacho: null,
  id_pedido: null,
  numero_guia: '',
  empresa_transporte: ''
});

const fetchDespachos = async (params = {}) => {
  try {
    let url = 'http://localhost:3000/api/despachos';
    const query = new URLSearchParams(params).toString();
    if (query) url += `?${query}`;
    const response = await fetch(url);
    despachos.value = await response.json();
  } catch (error) {
    console.error('Error al cargar despachos', error);
  }
};

const buscarDespachos = async () => {
  const guia = searchGuia.value?.toString().trim() || '';
  const orden = searchOrden.value?.toString().trim() || '';

  if (!guia && !orden) {
    fetchDespachos();
    return;
  }

  const params = {};
  if (guia) params.numero_guia = guia;
  if (orden) params.id_pedido = orden;

  await fetchDespachos(params);
};

const limpiarBusqueda = () => {
  searchGuia.value = '';
  searchOrden.value = '';
  fetchDespachos();
};

const abrirModalGuia = (item) => {
  guiaForm.value = {
    id_despacho: item.id_despacho,
    id_pedido: item.id_pedido,
    numero_guia: item.numero_guia || '',
    empresa_transporte: item.empresa_transporte || ''
  };
  mostrarModalGuia.value = true;
};

const cerrarModalGuia = () => {
  mostrarModalGuia.value = false;
  guiaForm.value = {
    id_despacho: null,
    id_pedido: null,
    numero_guia: '',
    empresa_transporte: ''
  };
};

const enviarGuia = async () => {
  if (!guiaForm.value.numero_guia?.trim() || !guiaForm.value.empresa_transporte?.trim()) {
    errorGuiaMensaje.value = 'Ingresa número de guía y empresa de transporte.';
    mostrarErrorGuia.value = true;
    return;
  }

  try {
    await fetch(
      `http://localhost:3000/api/despachos/${guiaForm.value.id_despacho}/guia`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numero_guia: guiaForm.value.numero_guia.trim(),
          empresa_transporte: guiaForm.value.empresa_transporte.trim()
        })
      }
    );
    cerrarModalGuia();
    mostrarExitoGuia.value = true;
    fetchDespachos();
  } catch (error) {
    console.error('Error registrando guía', error);
    alert('No se pudo registrar la guía. Intenta nuevamente.');
  }
};

const cerrarExitoGuia = () => {
  mostrarExitoGuia.value = false;
};

const cerrarErrorGuia = () => {
  mostrarErrorGuia.value = false;
};

const marcarEnviado = async (item) => {
  await fetch(`http://localhost:3000/api/despachos/${item.id_despacho}/enviar`, { method: 'PUT' });
  fetchDespachos();
};
const marcarEntregado = async (item) => {
  await fetch(`http://localhost:3000/api/despachos/${item.id_despacho}/entregar`, { method: 'PUT' });
  fetchDespachos();
};

onMounted(() => {
  fetchDespachos();
});
</script>
