<template>
  <div class="ventas-view">
    <div class="header-section">
      <div>
        <h2>Gestión de Pedidos</h2>
      </div>
      <div class="busqueda-pedidos">
        <input
          type="text"
          v-model="busquedaPedido"
          placeholder="Buscar pedido por ID"
          @keyup.enter="buscarPedidos"
        />
        <button @click="buscarPedidos" class="btn-search">Buscar</button>
        <button @click="limpiarBusqueda" class="btn-clear" v-if="busquedaPedido">×</button>
      </div>
      <div>
        <button @click="abrirModal" class="btn-nuevo">+ REGISTRAR PEDIDO</button>
        <button @click="abrirModalCliente" class="btn-cliente">+ REGISTRAR CLIENTE</button>
      </div>
    </div>

    <div class="tabla-container">
      <table class="tabla-pedidos">
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total Docenas</th>
            <th>Estado</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ped in listaPedidos" :key="ped.id_pedido">
            <td>#{{ ped.id_pedido }}</td>
            <td>{{ ped.cliente }}</td>
            <td>{{ new Date(ped.fecha_registro).toLocaleDateString() }}</td>
            <td>{{ ped.total_doc_pedido || 0 }}</td>
            <td>
              <span
                class="estado-badge" :class="ped.estado?.toLowerCase()">
                {{ ped.estado }}
              </span>
            </td>
            <td>
              <button class="btn-eye" @click="verDetallePedido(ped)" title="Ver detalle del pedido">👁</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <header class="modal-header">
          <h3>REGISTRAR NUEVO PEDIDO DE VENTA</h3>
          <button @click="cerrarModal" class="btn-close">&times;</button>
        </header>
        
        <div class="modal-body">
          <div class="form-group">
            <label>CLIENTE:</label>
            <select v-model="nuevoPedido.id_cliente">
              <option v-for="c in clientes" :key="c.id_cliente" :value="c.id_cliente">{{ c.nombre }} {{ c.apellido }}</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>MODELO:</label>
              <select v-model="nuevoPedido.id_modelo">
                <option v-for="m in modelos" :key="m.id_modelo" :value="m.id_modelo">{{ m.nombre }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>SERIE:</label>
              <select v-model="nuevoPedido.id_serie">
                <option v-for="s in series" :key="s.id_serie" :value="s.id_serie">{{ s.descripcion }}</option>
              </select>
            </div>
          </div>

          <div class="colores-section">
            <div class="colores-header">
              <h4>DETALLE DE COLORES</h4>
              <button @click="agregarFilaColor" class="btn-add">+ Añadir</button>
            </div>
            <div v-for="(det, index) in nuevoPedido.detalles" :key="index" class="fila-color">
              <input v-model="det.color" placeholder="Color" class="input-color">
              <input v-model.number="det.cantidad_docenas" type="number" class="input-cant">
              <button @click="eliminarFilaColor(index)" class="btn-del">×</button>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button @click="guardarPedido" class="btn-registrar">REGISTRAR</button>
        </footer>
      </div>
    </div>

    <div v-if="mostrarModalCliente" class="modal-overlay">
      <div class="modal-content client-modal">
        <header class="modal-header">
          <h3>REGISTRAR NUEVO CLIENTE</h3>
          <button @click="cerrarModalCliente" class="btn-close">&times;</button>
        </header>

        <div class="modal-body">
          <div class="form-group">
            <label>NOMBRE DEL CLIENTE:</label>
            <input v-model="nuevoCliente.nombre" type="text" placeholder="Ingrese el nombre del cliente" />
          </div>
          <div class="form-group">
            <label>APELLIDO:</label>
            <input v-model="nuevoCliente.apellido" type="text" placeholder="Ingrese el apellido del cliente"/>
          </div>
        </div>

        <footer class="modal-footer">
          <button @click="cerrarModalCliente" class="btn-cancel">Cancelar</button>
          <button @click="guardarCliente" class="btn-registrar">Registrar Cliente</button>
        </footer>
      </div>
    </div>

    <div v-if="mostrarDetallePedido" class="modal-overlay">
      <div class="modal-content detail-modal">
        <header class="modal-header">
          <h3>Detalle del pedido</h3>
          <button @click="cerrarDetallePedido" class="btn-close">&times;</button>
        </header>

        <div v-if="cargandoDetalle" class="detalle-loading">Cargando detalle...</div>

        <div v-else-if="pedidoDetalle?.pedido" class="detalle-content">
          <div class="detalle-summary">
            <p><strong>ID Pedido :</strong> #{{ pedidoDetalle.pedido.id_pedido }}</p>
            <p><strong>Cliente: </strong> {{ pedidoDetalle.pedido.cliente }}</p>
            <p><strong>Fecha: </strong> {{ new Date(pedidoDetalle.pedido.fecha_registro).toLocaleDateString() }}</p>
            <p><strong>Estado: </strong> {{ pedidoDetalle.pedido.estado }}</p>
            <div class="detalle-general">
              <div class="detalle-general-item"><span>Modelo: </span><strong>{{ pedidoDetalle.pedido.modelo || 'N/D' }}</strong></div>
              <div class="detalle-general-item"><span>Serie: </span><strong>{{ pedidoDetalle.pedido.serie || 'N/D' }}</strong></div>
            </div>
            <p><strong>Total Docenas: </strong> {{ pedidoDetalle.pedido.total_doc_pedido || 0 }}</p>
          </div>

          <h4>Detalle de líneas</h4>
          <table class="detalle-table">
            <thead>
              <tr>
                <th>Color </th>
                <th>Docenas </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detallesAgrupados" :key="item.color">
                <td>{{ item.color || 'N/D' }}</td>
                <td>{{ item.cantidad_docenas }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="detalle-empty">No se encontró información del pedido.</div>
      </div>
    </div>

    <div v-if="mostrarExito" class="modal-overlay">
      <div class="modal-content success-modal">
        <div class="success-icon">✓</div>
        <h3>¡Registro Exitoso!</h3>
        <p>Se registro exitosamente.</p>
        <button @click="cerrarExito" class="btn-entendido">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import './VentasView.css';

const mostrarModal = ref(false);
const mostrarModalCliente = ref(false);
const mostrarExito = ref(false); // Nueva variable para el pop-up de exito[]
const mostrarDetallePedido = ref(false);
const cargandoDetalle = ref(false);
const pedidoDetalle = ref({ pedido: null, detalles: [] });
const detallesAgrupados = ref([]);
const listaPedidos = ref([]);
const busquedaPedido = ref('');
const clientes = ref([]);
const modelos = ref([]);
const series = ref([]);

const nuevoPedido = ref({
  id_cliente: null,
  id_modelo: null,
  id_serie: null,
  detalles: [{ color: '', cantidad_docenas: 1 }]
});

const nuevoCliente = ref({ nombre: '', apellido: '' });

const abrirModal = () => { mostrarModal.value = true; };
const cerrarModal = () => { mostrarModal.value = false; };
const abrirModalCliente = () => { mostrarModalCliente.value = true; };
const cerrarModalCliente = () => { mostrarModalCliente.value = false; };
const cerrarExito = () => { mostrarExito.value = false; };
const cerrarDetallePedido = () => { mostrarDetallePedido.value = false; pedidoDetalle.value = { pedido: null, detalles: [] }; detallesAgrupados.value = []; };

const cargarDatos = async (idPedido = '') => {
  try {
    const [resP, resC, resM, resS] = await Promise.all([
      axios.get(`${import.meta.env.VITE_API_URL}/pedidos/lista`, { params: { id_pedido: idPedido } }),
      axios.get(`${import.meta.env.VITE_API_URL}/clientes`),
      axios.get(`${import.meta.env.VITE_API_URL}/modelos`),
      axios.get(`${import.meta.env.VITE_API_URL}/series`)
    ]);
    listaPedidos.value = resP.data;
    clientes.value = resC.data;
    modelos.value = resM.data;
    series.value = resS.data;
  } catch (error) { console.error("Error cargando datos", error); }
};

const buscarPedidos = async () => {
  if (!busquedaPedido.value || !busquedaPedido.value.toString().trim()) {
    cargarDatos();
    return;
  }

  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/pedidos/lista`, {
      params: { id_pedido: busquedaPedido.value }
    });
    listaPedidos.value = res.data;
  } catch (error) {
    console.error('Error buscando pedido', error);
    alert('No se pudo buscar el pedido. Verifique el ID e intente de nuevo.');
  }
};

const limpiarBusqueda = () => {
  busquedaPedido.value = '';
  cargarDatos();
};

const verDetallePedido = async (pedido) => {
  mostrarDetallePedido.value = true;
  cargandoDetalle.value = true;
  pedidoDetalle.value = { pedido: null, detalles: [] };

  try {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/pedidos/detalle/${pedido.id_pedido}`);
    pedidoDetalle.value = res.data;
    const grouped = new Map();
    (res.data.detalles || []).forEach((item) => {
      const color = item.color || 'N/D';
      const cantidad = Number(item.cantidad_docenas) || 0;
      if (!grouped.has(color)) {
        grouped.set(color, { color, cantidad_docenas: 0 });
      }
      grouped.get(color).cantidad_docenas += cantidad;
    });
    detallesAgrupados.value = Array.from(grouped.values());
  } catch (error) {
    console.error('Error cargando detalle del pedido', error);
    pedidoDetalle.value = { pedido: null, detalles: [] };
    detallesAgrupados.value = [];
  } finally {
    cargandoDetalle.value = false;
  }
};

const agregarFilaColor = () => { nuevoPedido.value.detalles.push({ color: '', cantidad_docenas: 1 }); };
const eliminarFilaColor = (index) => { nuevoPedido.value.detalles.splice(index, 1); };

const guardarCliente = async () => {
  try {
    if (!nuevoCliente.value.nombre || !nuevoCliente.value.nombre?.trim() ||
        !nuevoCliente.value.apellido || !nuevoCliente.value.apellido?.trim()) {
      alert('Por favor ingresa el nombre del cliente.');
      return;
    }

    await axios.post(`${import.meta.env.VITE_API_URL}/clientes`, nuevoCliente.value);
    cerrarModalCliente();
    await cargarDatos();
    nuevoCliente.value = { nombre: '', apellido: '' };
    /*alert('Cliente registrado exitosamente.');*/
    mostrarExito.value = true;
    cerrarModalCliente();
  } catch (error) {
    alert('Error al registrar cliente: ' + (error.response?.data?.error || error.message));
  }
};

const guardarPedido = async () => {
  try {
    await axios.post(`${import.meta.env.VITE_API_URL}/pedidos`, nuevoPedido.value);
  
    //  Cerramos el formulario y mostramos el Pop-up de exito
    cerrarModal();
    mostrarExito.value = true; 
    
    cargarDatos(); // Recarga la tabla con el scroll
    
    // Reiniciamos el formulario para el siguiente pedido
    nuevoPedido.value = { id_cliente: null, id_modelo: null, id_serie: null, detalles: [{ color: '', cantidad_docenas: 1 }] };
  } catch (error) {
    alert("Error al registrar: " + (error.response?.data?.error || error.message));
  }
};

onMounted(cargarDatos);
</script>