<template>
  <div class="catalogos-view">
    <!-- Selector de Catálogos -->
    <section v-if="!catalogoSeleccionado" class="catalogo-selector">
      <h2>Catálogos</h2>
      <div class="catalogo-grid">
        <div
          v-for="catalogo in catalogos"
          :key="catalogo.key"
          class="catalogo-card"
          @click="seleccionarCatalogo(catalogo.key)"
        >
          <div class="catalogo-icon">{{ catalogo.icon }}</div>
          <div class="catalogo-info">
            <h3>{{ catalogo.label }}</h3>
            <p class="catalogo-count">{{ catalogo.count }} registros</p>
          </div>
          <div class="catalogo-arrow">→</div>
        </div>
      </div>
    </section>

    <!-- Contenido del Catálogo Seleccionado -->
    <section v-else class="catalogo-detail">
      <div class="catalogo-header">
        <h2>{{ catalogoSeleccionadoLabel }}</h2>
        <button class="btn-back" @click="volverAlSelector">
          ← Volver
        </button>
      </div>

      <!-- SERIES -->
      <div v-if="catalogoSeleccionado === 'series'" class="catalogo-contenido">
        <div class="header">
          <button @click="abrirModalSeries(null)" class="btn-new">+ Nueva Serie</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="s in series" :key="s.id_serie">
                <td>{{ s.id_serie }}</td>
                <td>{{ s.descripcion }}</td>
                <td class="actions-cell">
                  <button @click="abrirModalSeries(s)" class="btn">Editar</button>
                  <button @click="confirmarEliminacionSerie(s.id_serie)" class="btn del">Borrar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="showModalSeries" class="modal-overlay">
          <div class="modal-content">
            <header><h3>{{ editingSerieId ? 'Editar' : 'Nueva' }} Serie</h3></header>
            <div class="modal-body">
              <div class="form-group">
                <label>Descripción</label>
                <input v-model="formSerie.descripcion" />
              </div>
            </div>
            <footer>
              <button @click="guardarSerie" class="btn save">Guardar</button>
              <button @click="cerrarModalSeries" class="btn">Cancelar</button>
            </footer>
          </div>
        </div>
      </div>

      <!-- MODELOS -->
      <div v-if="catalogoSeleccionado === 'modelos'" class="catalogo-contenido">
        <div class="header">
          <button @click="abrirModalModelos(null)" class="btn-new">+ Nuevo Modelo</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in modelos" :key="m.id_modelo">
                <td>{{ m.id_modelo }}</td>
                <td>{{ m.nombre }}</td>
                <td class="actions-cell">
                  <button @click="abrirModalModelos(m)" class="btn">Editar</button>
                  <button @click="confirmarEliminacionModelo(m.id_modelo)" class="btn del">Borrar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="showModalModelos" class="modal-overlay">
          <div class="modal-content">
            <header><h3>{{ editingModeloId ? 'Editar' : 'Nuevo' }} Modelo</h3></header>
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre</label>
                <input v-model="formModelo.nombre" />
              </div>
            </div>
            <footer>
              <button @click="guardarModelo" class="btn save">Guardar</button>
              <button @click="cerrarModalModelos" class="btn">Cancelar</button>
            </footer>
          </div>
        </div>
      </div>

      <!-- CLIENTES -->
      <div v-if="catalogoSeleccionado === 'clientes'" class="catalogo-contenido">
        <div class="header">
          <button @click="abrirModalClientes(null)" class="btn-new">+ Nuevo Cliente</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in clientes" :key="c.id_cliente">
                <td>{{ c.id_cliente }}</td>
                <td>{{ c.nombre }}</td>
                <td>{{ c.apellido }}</td>
                <td class="actions-cell">
                  <button @click="abrirModalClientes(c)" class="btn">Editar</button>
                  <button @click="confirmarEliminacionCliente(c.id_cliente)" class="btn del">Borrar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="showModalClientes" class="modal-overlay">
          <div class="modal-content">
            <header><h3>{{ editingClienteId ? 'Editar' : 'Nuevo' }} Cliente</h3></header>
            <div class="modal-body">
              <div class="form-group">
                <label>Nombre</label>
                <input v-model="formCliente.nombre" />
              </div>
              <div class="form-group">
                <label>Apellido</label>
                <input v-model="formCliente.apellido" />
              </div>
            </div>
            <footer>
              <button @click="guardarCliente" class="btn save">Guardar</button>
              <button @click="cerrarModalClientes" class="btn">Cancelar</button>
            </footer>
          </div>
        </div>
      </div>
    </section>

    <!-- Modal de Confirmación -->
    <ConfirmModal
      v-if="showConfirm"
      :message="confirmMsg"
      @confirm="ejecutarEliminacion"
      @cancel="cancelarEliminacion"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { listSeries, createSerie, updateSerie, deleteSerie } from '../services/series';
import { listModelos, createModelo, updateModelo, deleteModelo } from '../services/modelos';
import { listClientes, createCliente, updateCliente, deleteCliente } from '../services/clientes';

// Estado de navegación
const catalogoSeleccionado = ref(null);
const catalogos = ref([
  { key: 'series', label: 'Series', icon: '📚', count: 0 },
  { key: 'modelos', label: 'Modelos', icon: '👗', count: 0 },
  { key: 'clientes', label: 'Clientes', icon: '👥', count: 0 }
]);

// Series
const series = ref([]);
const showModalSeries = ref(false);
const editingSerieId = ref(null);
const formSerie = ref({ descripcion: '' });

// Modelos
const modelos = ref([]);
const showModalModelos = ref(false);
const editingModeloId = ref(null);
const formModelo = ref({ nombre: '' });

// Clientes
const clientes = ref([]);
const showModalClientes = ref(false);
const editingClienteId = ref(null);
const formCliente = ref({ nombre: '', apellido: '' });

// Confirmación de eliminación
const showConfirm = ref(false);
const confirmMsg = ref('');
const eliminacionPendiente = ref(null);

const catalogoSeleccionadoLabel = computed(() => {
  const catalogo = catalogos.value.find(c => c.key === catalogoSeleccionado.value);
  return catalogo ? catalogo.label : '';
});

// ===== FUNCIONES DE NAVEGACIÓN =====
const seleccionarCatalogo = (key) => {
  catalogoSeleccionado.value = key;
};

const volverAlSelector = () => {
  catalogoSeleccionado.value = null;
};

// ===== CARGA INICIAL =====
const cargarTodos = async () => {
  try {
    const [seriesData, modelosData, clientesData] = await Promise.all([
      listSeries(),
      listModelos(),
      listClientes()
    ]);
    
    series.value = seriesData;
    modelos.value = modelosData;
    clientes.value = clientesData;

    catalogos.value[0].count = seriesData.length;
    catalogos.value[1].count = modelosData.length;
    catalogos.value[2].count = clientesData.length;
  } catch (err) {
    console.error('Error cargando catálogos:', err);
    showToast('Error al cargar los catálogos', 'error');
  }
};

const showToast = (msg, type = 'success') => {
  window.dispatchEvent(new CustomEvent('toast', { detail: { message: msg, type } }));
};

// ===== SERIES =====
const abrirModalSeries = (serie) => {
  if (serie) {
    editingSerieId.value = serie.id_serie;
    formSerie.value = { descripcion: serie.descripcion };
  } else {
    editingSerieId.value = null;
    formSerie.value = { descripcion: '' };
  }
  showModalSeries.value = true;
};

const cerrarModalSeries = () => {
  showModalSeries.value = false;
  editingSerieId.value = null;
};

const guardarSerie = async () => {
  if (!formSerie.value.descripcion) {
    showToast('Descripción obligatoria', 'warn');
    return;
  }
  try {
    if (editingSerieId.value) {
      await updateSerie(editingSerieId.value, formSerie.value);
    } else {
      await createSerie(formSerie.value);
    }
    await cargarTodos();
    cerrarModalSeries();
    showToast('Serie guardada correctamente', 'success');
  } catch (err) {
    showToast(err.response?.data?.error || err.message, 'error');
  }
};

const confirmarEliminacionSerie = (id) => {
  eliminacionPendiente.value = { tipo: 'serie', id };
  confirmMsg.value = '¿Desea eliminar esta serie?';
  showConfirm.value = true;
};

// ===== MODELOS =====
const abrirModalModelos = (modelo) => {
  if (modelo) {
    editingModeloId.value = modelo.id_modelo;
    formModelo.value = { nombre: modelo.nombre };
  } else {
    editingModeloId.value = null;
    formModelo.value = { nombre: '' };
  }
  showModalModelos.value = true;
};

const cerrarModalModelos = () => {
  showModalModelos.value = false;
  editingModeloId.value = null;
};

const guardarModelo = async () => {
  if (!formModelo.value.nombre) {
    showToast('Nombre obligatorio', 'warn');
    return;
  }
  try {
    if (editingModeloId.value) {
      await updateModelo(editingModeloId.value, formModelo.value);
    } else {
      await createModelo(formModelo.value);
    }
    await cargarTodos();
    cerrarModalModelos();
    showToast('Modelo guardado correctamente', 'success');
  } catch (err) {
    showToast(err.response?.data?.error || err.message, 'error');
  }
};

const confirmarEliminacionModelo = (id) => {
  eliminacionPendiente.value = { tipo: 'modelo', id };
  confirmMsg.value = '¿Desea eliminar este modelo?';
  showConfirm.value = true;
};

// ===== CLIENTES =====
const abrirModalClientes = (cliente) => {
  if (cliente) {
    editingClienteId.value = cliente.id_cliente;
    formCliente.value = { nombre: cliente.nombre, apellido: cliente.apellido };
  } else {
    editingClienteId.value = null;
    formCliente.value = { nombre: '', apellido: '' };
  }
  showModalClientes.value = true;
};

const cerrarModalClientes = () => {
  showModalClientes.value = false;
  editingClienteId.value = null;
};

const guardarCliente = async () => {
  if (!formCliente.value.nombre || !formCliente.value.apellido) {
    showToast('Nombre y apellido obligatorios', 'warn');
    return;
  }
  try {
    if (editingClienteId.value) {
      await updateCliente(editingClienteId.value, formCliente.value);
    } else {
      await createCliente(formCliente.value);
    }
    await cargarTodos();
    cerrarModalClientes();
    showToast('Cliente guardado correctamente', 'success');
  } catch (err) {
    showToast(err.response?.data?.error || err.message, 'error');
  }
};

const confirmarEliminacionCliente = (id) => {
  eliminacionPendiente.value = { tipo: 'cliente', id };
  confirmMsg.value = '¿Desea eliminar este cliente?';
  showConfirm.value = true;
};

// ===== ELIMINACIÓN =====
const ejecutarEliminacion = async () => {
  try {
    const { tipo, id } = eliminacionPendiente.value;
    if (tipo === 'serie') {
      await deleteSerie(id);
      showToast('Serie eliminada', 'success');
    } else if (tipo === 'modelo') {
      await deleteModelo(id);
      showToast('Modelo eliminado', 'success');
    } else if (tipo === 'cliente') {
      await deleteCliente(id);
      showToast('Cliente eliminado', 'success');
    }
    await cargarTodos();
    showConfirm.value = false;
    eliminacionPendiente.value = null;
  } catch (err) {
    showToast(err.response?.data?.error || err.message, 'error');
  }
};

const cancelarEliminacion = () => {
  showConfirm.value = false;
  eliminacionPendiente.value = null;
};

onMounted(cargarTodos);
</script>

<style scoped>
.catalogos-view {
  padding: 0;
  min-height: calc(100vh - 60px);
  background: linear-gradient(180deg, #0b1120 0%, #111827 100%);
  color: #f8fafc;
  padding: 20px;
}

/* ===== SELECTOR DE CATÁLOGOS ===== */
.catalogo-selector {
  padding: 40px 20px;
}

.catalogo-selector h2 {
  text-align: center;
  font-size: 28px;
  color: #f8fafc;
  margin-bottom: 40px;
  font-weight: 700;
}

.catalogo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.catalogo-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border: none;
}

.catalogo-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.catalogo-icon {
  font-size: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.catalogo-info {
  flex: 1;
}

.catalogo-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.catalogo-count {
  margin: 4px 0 0 0;
  font-size: 13px;
  opacity: 0.9;
}

.catalogo-arrow {
  font-size: 24px;
}

/* ===== DETALLE DEL CATÁLOGO ===== */
.catalogo-detail {
  padding: 0;
}

.catalogo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.08);
}

.catalogo-header h2 {
  margin: 0;
  font-size: 24px;
  color: #f8fafc;
}

.btn-back {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  color: #e5e7eb;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.catalogo-contenido {
  margin-top: 20px;
}

.header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.btn-new {
  padding: 10px 16px;
  background: #22c55e;
  color: #052e16;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-new:hover {
  background: #16a34a;
}

.table-wrap {
  max-height: 60vh;
  overflow-y: auto;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.5);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.data-table thead th {
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.06);
  color: #93c5fd;
  font-weight: 700;
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 10;
}

.data-table td {
  padding: 15px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #e5e7eb;
}
.actions-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}
.data-table tr:hover {
  background: rgba(255, 255, 255, 0.03);
}

/* ===== MODALES ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  z-index: 1000;
}

.modal-content {
  background: #111827;
  padding: 24px;
  border-radius: 8px;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.45);
  color: #f8fafc;
}

.modal-content header {
  margin-bottom: 20px;
}

.modal-content h3 {
  margin: 0;
  font-size: 20px;
  color: #f8fafc;
}

.modal-body {
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.form-group label {
  font-weight: 500;
  margin-bottom: 6px;
  color: #f8fafc;
}

.form-group input {
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  font-size: 14px;
  background: #0b1120;
  color: #f8fafc;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.modal-content footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  background: #2563eb;
  color: white;
}

.btn:hover {
  background: #1d4ed8;
}

.btn.del {
  background: #ef4444;
  color: white;
}

.btn.del:hover {
  background: #dc2626;
}

.btn.save {
  background: #22c55e;
  color: #052e16;
}

.btn.save:hover {
  background: #16a34a;
}
</style>
