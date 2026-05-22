<template>
  <div class="almacen-container">
    <header class="almacen-header">
      <h2><i class="fas fa-warehouse"></i> Gestión de Almacén</h2>
      <p>Control de stock y movimientos de materia prima</p>
    </header>

    <section class="inventory-summary">
      <div class="summary-card">
        <div class="icon-box"><i class="fas fa-boxes"></i></div>
        <div class="card-info">
          <h3>Total de Ítems</h3>
          <p class="number">{{ inventario.length }}</p>
        </div>
      </div>
      <div class="summary-card alert" v-if="insumosConBajoStock > 0">
        <div class="icon-box"><i class="fas fa-exclamation-triangle"></i></div>
        <div class="card-info">
          <h3>Stock Crítico</h3>
          <p class="number text-danger">{{ insumosConBajoStock }} insumos</p>
        </div>
      </div>
    </section>

    <section class="toolbar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input type="text" v-model="busqueda" placeholder="Buscar material..." />
      </div>
      <div class="action-buttons">
        <button class="btn btn-in" @click="abrirCRUD('create')">
          <i class="fas fa-plus-circle"></i> Nuevo Material
        </button>
      </div>
    </section>

    <section class="inventory-table-section">
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Material</th>
              <th>Stock Actual</th>
              <th>Mínimo</th>
              <th>Estado</th>
              <th>Acciones de Movimiento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventarioFiltrado" :key="item.codigo">
              <td class="fw-bold">{{ item.codigo }}</td>
              <td>{{ item.descripcion }} <br><small class="text-muted">{{ item.unidad }}</small></td>
              <td :class="{ 'text-danger fw-bold': item.stockActual <= item.stockMinimo }">
                {{ item.stockActual }}
              </td>
              <td>{{ item.stockMinimo }}</td>
              <td>
                <span :class="item.stockActual > item.stockMinimo ? 'badge badge-success' : 'badge badge-danger'">
                  {{ item.stockActual > item.stockMinimo ? 'OK' : 'Bajo' }}
                </span>
              </td>
              <td class="actions-cell">
                <button class="btn-action-tab btn-in-tab" @click="prepararMovimiento(item, 'ingreso')" title="Entrada de Stock">
                  <i class="fas fa-arrow-down"></i> Entrada
                </button>
                <button class="btn-action-tab btn-out-tab" @click="prepararMovimiento(item, 'despacho')" title="Salida a Planta">
                  <i class="fas fa-arrow-up"></i> Salida
                </button>
                <button class="btn-action-tab btn-edit" @click="abrirCRUD('edit', item)" title="Editar Material">
                  <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn-action-tab btn-delete" @click="eliminarMaterial(item)" title="Eliminar Material">
                  <i class="fas fa-trash"></i> Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="modalActivo" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ tipoMovimiento === 'ingreso' ? '📥 Registrar Entrada' : '📤 Despacho a Planta' }}</h3>
          <button @click="cerrarModal" class="btn-close">&times;</button>
        </div>
        
        <form @submit.prevent="guardarMovimiento">
          <div class="form-body">
            <div class="info-item">
              <label>Material Seleccionado:</label>
              <p><strong>{{ materialSeleccionado.descripcion }}</strong> ({{ materialSeleccionado.codigo }})</p>
            </div>

            <div class="form-group">
              <label>Cantidad ({{ materialSeleccionado.unidad }}):</label>
              <input type="number" v-model="form.cantidad" required min="1" step="0.01" />
            </div>

            <div class="form-group" v-if="tipoMovimiento === 'ingreso'">
              <label>Proveedor / N° Factura:</label>
              <input type="text" v-model="form.referencia" placeholder="Ej: Curtiembre Central - Fac 102" required />
            </div>

            <div class="form-group" v-else>
              <label>Sección de Destino:</label>
              <select v-model="form.destino" required>
                <option value="Cortado">Cortado</option>
                <option value="Alistado">Alistado</option>
                <option value="Aparado">Aparado</option>
                <option value="Armado">Armado</option>
                <option value="Rematado">Rematado</option>
              </select>
            </div>

            <div class="form-group">
              <label>Observaciones:</label>
              <textarea v-model="form.notas" rows="2"></textarea>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="cerrarModal" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save">Confirmar Registro</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Modal CRUD -->
    <div v-if="modalCRUDActivo" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ crudTipo === 'create' ? '➕ Nuevo Material' : '✏️ Editar Material' }}</h3>
          <button @click="cerrarCRUD" class="btn-close">&times;</button>
        </div>

        <form @submit.prevent="guardarCRUD">
          <div class="form-body">
            <div class="form-group">
              <label>Nombre del Material:</label>
              <input type="text" v-model="crudForm.nombre" required />
            </div>

            <div class="form-group">
              <label>Unidad de Medida:</label>
              <input type="text" v-model="crudForm.unidad_medida" />
            </div>

            <div class="form-group">
              <label>Stock Inicial:</label>
              <input type="number" v-model="crudForm.stock_actual" min="0" step="0.01" />
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" @click="cerrarCRUD" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-save">Guardar</button>
          </div>
        </form>
      </div>
    </div>
    
    <!-- Confirm Delete Modal -->
    <ConfirmModal v-if="confirmVisible" :message="`Eliminar material: ${confirmItem?.descripcion}?`" @confirm="confirmDelete" @cancel="cancelDelete" />
  </div>
</template>

<script setup>
import '../styles/AlmacenView.css';
import { ref, computed, onMounted } from 'vue';
import * as materialesAPI from '../services/materiales';
import ConfirmModal from '../components/ConfirmModal.vue';

const busqueda = ref('');
const modalActivo = ref(false);
const tipoMovimiento = ref(''); // 'ingreso' o 'despacho'
const materialSeleccionado = ref(null);

const form = ref({
  cantidad: 0,
  referencia: '',
  destino: 'Cortado',
  notas: ''
});

const inventario = ref([]);

const cargarInventario = async () => {
  try {
    const data = await materialesAPI.listarMateriales();
    inventario.value = data.map(m => ({
      codigo: `MAT-${String(m.id_material).padStart(3, '0')}`,
      id_material: m.id_material,
      descripcion: m.nombre,
      unidad: m.unidad_medida || '',
      stockMinimo: 0,
      stockActual: parseFloat(m.stock_actual || 0)
    }));
  } catch (err) {
    console.error('Error cargando inventario', err);
  }
};

onMounted(() => {
  cargarInventario();
});

const inventarioFiltrado = computed(() => {
  if (!busqueda.value) return inventario.value;
  return inventario.value.filter(i => i.descripcion.toLowerCase().includes(busqueda.value.toLowerCase()));
});

const insumosConBajoStock = computed(() => {
  return inventario.value.filter(item => item.stockActual <= item.stockMinimo).length;
});

const prepararMovimiento = (item, tipo) => {
  materialSeleccionado.value = item;
  tipoMovimiento.value = tipo;
  form.value = { cantidad: 0, referencia: '', destino: 'Cortado', notas: '' };
  modalActivo.value = true;
};

const cerrarModal = () => {
  modalActivo.value = false;
};

const guardarMovimiento = () => {
  const item = inventario.value.find(i => i.codigo === materialSeleccionado.value.codigo);
  
  if (tipoMovimiento.value === 'ingreso') {
    item.stockActual += parseFloat(form.value.cantidad);
  } else {
    if (form.value.cantidad > item.stockActual) {
      alert('Error: Stock insuficiente para realizar el despacho.');
      return;
    }
    item.stockActual -= parseFloat(form.value.cantidad);
  }
  
  // Persistir cambio de stock en servidor
  (async () => {
    try {
      const id = item.id_material;
      await materialesAPI.actualizarMaterial(id, {
        nombre: item.descripcion,
        unidad_medida: item.unidad,
        stock_actual: item.stockActual
      });
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Movimiento registrado correctamente', type: 'success' } }));
      cerrarModal();
    } catch (err) {
      console.error(err);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Error al registrar movimiento en servidor', type: 'error' } }));
    }
  })();
};

// --- CRUD modal state & handlers ---
const modalCRUDActivo = ref(false);
const crudTipo = ref('create'); // 'create' | 'edit'
const crudForm = ref({ nombre: '', unidad_medida: '', stock_actual: 0 });

const abrirCRUD = (tipo, item = null) => {
  crudTipo.value = tipo;
  if (tipo === 'edit' && item) {
    crudForm.value = {
      nombre: item.descripcion,
      unidad_medida: item.unidad,
      stock_actual: item.stockActual || 0
    };
    materialSeleccionado.value = item;
  } else {
    crudForm.value = { nombre: '', unidad_medida: '', stock_actual: 0 };
    materialSeleccionado.value = null;
  }
  modalCRUDActivo.value = true;
};

const cerrarCRUD = () => {
  modalCRUDActivo.value = false;
};

const guardarCRUD = async () => {
  try {
    if (crudTipo.value === 'create') {
      const nuevo = await materialesAPI.crearMaterial({
        nombre: crudForm.value.nombre,
        unidad_medida: crudForm.value.unidad_medida,
        stock_actual: crudForm.value.stock_actual
      });
      inventario.value.unshift({
        codigo: `MAT-${String(nuevo.id_material).padStart(3, '0')}`,
        id_material: nuevo.id_material,
        descripcion: nuevo.nombre,
        unidad: nuevo.unidad_medida,
        stockMinimo: 0,
        stockActual: parseFloat(nuevo.stock_actual || 0)
      });
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Material creado', type: 'success' } }));
    } else if (crudTipo.value === 'edit' && materialSeleccionado.value) {
      const id = materialSeleccionado.value.id_material;
      await materialesAPI.actualizarMaterial(id, {
        nombre: crudForm.value.nombre,
        unidad_medida: crudForm.value.unidad_medida,
        stock_actual: crudForm.value.stock_actual
      });
      materialSeleccionado.value.descripcion = crudForm.value.nombre;
      materialSeleccionado.value.unidad = crudForm.value.unidad_medida;
      materialSeleccionado.value.stockActual = parseFloat(crudForm.value.stock_actual || 0);
      window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Material actualizado', type: 'success' } }));
    }
    cerrarCRUD();
    } catch (err) {
    console.error(err);
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Error al guardar material', type: 'error' } }));
  }
};

const eliminarMaterial = async (item) => {
  // abrir modal de confirmación
  confirmItem.value = item;
  confirmVisible.value = true;
};

// confirmación modal state
const confirmVisible = ref(false);
const confirmItem = ref(null);

const confirmDelete = async () => {
  if (!confirmItem.value) return;
  try {
    await materialesAPI.eliminarMaterial(confirmItem.value.id_material);
    inventario.value = inventario.value.filter(i => i.id_material !== confirmItem.value.id_material);
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Material eliminado', type: 'success' } }));
  } catch (err) {
    console.error(err);
    window.dispatchEvent(new CustomEvent('toast', { detail: { message: 'Error al eliminar material', type: 'error' } }));
  } finally {
    confirmVisible.value = false;
    confirmItem.value = null;
  }
};

const cancelDelete = () => {
  confirmVisible.value = false;
  confirmItem.value = null;
};
</script>
