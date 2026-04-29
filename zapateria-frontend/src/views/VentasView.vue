<template>
  <div class="ventas-view">
    <div class="header-section">
      <h2>Gestión de Pedidos</h2>
      <button @click="abrirModal" class="btn-nuevo">+ REGISTRAR PEDIDO</button>
    </div>

    <div class="tabla-container">
      <table class="tabla-pedidos">
        <thead>
          <tr>
            <th>ID Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total Docenas</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ped in listaPedidos" :key="ped.id_pedido">
            <td>#{{ ped.id_pedido }}</td>
            <td>{{ ped.cliente }}</td>
            <td>{{ new Date(ped.fecha_registro).toLocaleDateString() }}</td>
            <td>{{ ped.total_docenas || 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal-content">
        <header class="modal-header">
          <h3>REGISTRAR NUEVO PEDIDO</h3>
          <button @click="cerrarModal" class="btn-close">&times;</button>
        </header>
        
        <div class="modal-body">
          <div class="form-group">
            <label>CLIENTE:</label>
            <select v-model="nuevoPedido.id_cliente">
              <option v-for="c in clientes" :key="c.id_cliente" :value="c.id_cliente">{{ c.nombre }}</option>
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

    <div v-if="mostrarExito" class="modal-overlay">
      <div class="modal-content success-modal">
        <div class="success-icon">✓</div>
        <h3>¡Registro Exitoso!</h3>
        <p>El pedido ha sido registrado y la trazabilidad de las docenas se generó con éxito.</p>
        <button @click="cerrarExito" class="btn-entendido">Entendido</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const mostrarModal = ref(false);
const mostrarExito = ref(false); // Nueva variable para el pop-up de exito[]
const listaPedidos = ref([]);
const clientes = ref([]);
const modelos = ref([]);
const series = ref([]);

const nuevoPedido = ref({
  id_cliente: null,
  id_modelo: null,
  id_serie: null,
  detalles: [{ color: '', cantidad_docenas: 1 }]
});

const abrirModal = () => { mostrarModal.value = true; };
const cerrarModal = () => { mostrarModal.value = false; };
const cerrarExito = () => { mostrarExito.value = false; };

const cargarDatos = async () => {
  try {
    const [resP, resC, resM, resS] = await Promise.all([
      axios.get('http://localhost:3000/api/pedidos/lista'),
      axios.get('http://localhost:3000/api/clientes'),
      axios.get('http://localhost:3000/api/modelos'),
      axios.get('http://localhost:3000/api/series')
    ]);
    listaPedidos.value = resP.data;
    clientes.value = resC.data;
    modelos.value = resM.data;
    series.value = resS.data;
  } catch (error) { console.error("Error cargando datos", error); }
};

const agregarFilaColor = () => { nuevoPedido.value.detalles.push({ color: '', cantidad_docenas: 1 }); };
const eliminarFilaColor = (index) => { nuevoPedido.value.detalles.splice(index, 1); };

const guardarPedido = async () => {
  try {
    await axios.post('http://localhost:3000/api/pedidos', nuevoPedido.value);
  
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

<style scoped>
.ventas-view { padding: 20px; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }

/* Estilos de la Tabla con Scroll */
.tabla-container { max-height: 400px; overflow-y: auto; border: 1px solid #ddd; border-radius: 8px; }
.tabla-pedidos { width: 100%; border-collapse: collapse; }
.tabla-pedidos th { position: sticky; top: 0; background: #2c3e50; color: white; padding: 12px; }
.tabla-pedidos td { padding: 12px; border-bottom: 1px solid #eee; }

/* Estilos de los Modales */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: white; width: 500px; border-radius: 12px; padding: 20px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }

/* Pop-up de Éxito específico */
.success-modal { text-align: center; padding: 40px; }
.success-icon { font-size: 50px; color: #27ae60; border: 3px solid #27ae60; width: 80px; height: 80px; line-height: 80px; border-radius: 50%; margin: 0 auto 20px; }
.btn-entendido { background: #27ae60; color: white; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 20px; }

/* Otros estilos del formulario */
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; text-align: left; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.fila-color { display: flex; gap: 10px; margin-bottom: 8px; }
.input-color { flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.input-cant { width: 70px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.btn-registrar { background: #27ae60; color: white; padding: 12px 40px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; width: 100%; }
.btn-nuevo { background: #3498db; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
</style>