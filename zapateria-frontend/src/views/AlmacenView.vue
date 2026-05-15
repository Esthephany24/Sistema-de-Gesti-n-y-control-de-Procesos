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
        <button class="btn btn-in" @click="abrirModal('ingreso')">
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
  </div>
</template>

<script setup>
import '../styles/AlmacenView.css';
import { ref, computed } from 'vue';

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

const inventario = ref([
  { codigo: 'MAT-001', descripcion: 'Cuero Negro Liso 1.8mm', unidad: 'dm2', stockMinimo: 500, stockActual: 1200 },
  { codigo: 'MAT-002', descripcion: 'Suela Goma T40', unidad: 'Pares', stockMinimo: 100, stockActual: 45 },
  { codigo: 'MAT-003', descripcion: 'Pegamento PVC', unidad: 'Litros', stockMinimo: 20, stockActual: 15 },
]);

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
  
  alert('Movimiento registrado correctamente');
  cerrarModal();
};
</script>
