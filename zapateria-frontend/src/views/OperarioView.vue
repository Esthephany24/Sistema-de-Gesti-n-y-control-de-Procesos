<template>
  <div class="terminal-container">
    <header class="terminal-header">
      <h2><i class="fas fa-qrcode"></i> Terminal de Operario</h2>
      <div class="user-info">
        <i class="fas fa-user-circle"></i> Operario activo: <strong>{{ operarioActual }}</strong>
      </div>
    </header>

    <section v-if="!seccionSeleccionada" class="station-selector">
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
        <h3>📍 Sección actual: <span class="highlight">{{ seccionSeleccionada }}</span></h3>
        <button class="btn-back" @click="cambiarSeccion">
          <i class="fas fa-arrow-left"></i> Cambiar Estación
        </button>
      </div>

      <div class="work-queue">
        <h4>Lotes Pendientes por Procesar</h4>
        
        <div class="table-responsive">
          <table class="terminal-table">
            <thead>
              <tr>
                <th>Cód. Pedido</th>
                <th>Modelo</th>
                <th>Cantidad</th>
                <th>Acción Rápida</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="lote in lotesPendientes" :key="lote.id">
                <td class="fw-bold">{{ lote.id }}</td>
                <td>{{ lote.modelo }}</td>
                <td>
                  <span class="badge-qty">{{ lote.docenas }} Docenas</span>
                </td>
                <td>
                  <button 
                    class="btn-action" 
                    @click="registrarAvance(lote.id, lote.docenas)"
                  >
                    <i class="fas fa-check"></i> Registrar Salida
                  </button>
                </td>
              </tr>
              <tr v-if="lotesPendientes.length === 0">
                <td colspan="4" class="empty-state">No hay lotes pendientes en esta estación.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// --- DATOS DEL USUARIO Y CONFIGURACIÓN ---
// Simulamos el operario que inició sesión en la tablet
const operarioActual = ref('Esthephany'); 

// Variable que guarda la estación actual. Inicia en null para forzar la selección.
const seccionSeleccionada = ref(null);

// El flujo exacto de la fábrica
const secciones = ref([
  'Cortado', 
  'Alistado', 
  'Aparado', 
  'Armado', 
  'Rematado'
]);

// --- DATOS SIMULADOS (Mockup de la base de datos) ---
const lotesPendientes = ref([
  { id: 'P-003', modelo: 'Bota de Seguridad Mod. A', docenas: 2 },
  { id: 'P-004', modelo: 'Zapato Escolar Clásico', docenas: 5 },
  { id: 'P-005', modelo: 'Deportivo Ligero', docenas: 3 }
]);

// --- LÓGICA DE LA INTERFAZ ---

// Función para cuando el operario presiona el botón de su sección
const seleccionarSeccion = (seccion) => {
  seccionSeleccionada.value = seccion;
  // Aquí en el futuro haríamos un fetch() al Backend para traer los lotes 
  // específicos de esta sección desde PostgreSQL.
};

// Función para regresar y elegir otra sección
const cambiarSeccion = () => {
  seccionSeleccionada.value = null;
};

// Función principal de trabajo: marca un lote como completado en esta fase
const registrarAvance = (idPedido, docenas) => {
  const confirmacion = confirm(`¿Confirmar la salida de ${docenas} docenas del pedido ${idPedido}?`);
  
  if (confirmacion) {
    // 1. Aquí enviaríamos la petición HTTP (POST/PUT) al Backend (Node.js)
    // indicando que Esthephany terminó este lote en la sección actual.
    
    // 2. Simulamos que el lote desaparece de la lista porque ya pasó a la siguiente fase
    lotesPendientes.value = lotesPendientes.value.filter(lote => lote.id !== idPedido);
    
    alert('✅ Registro guardado exitosamente. El lote avanzó a la siguiente etapa.');
  }
};
</script>

<style scoped>
/* --- ESTILOS VISUALES (Optimizados para pantallas táctiles/tablets) --- */
.terminal-container {
  padding: 20px;
  background-color: #0a0813;
  min-height: 100vh;
  font-family: Arial, sans-serif;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 2px solid #1e4750;
  padding-bottom: 15px;
  margin-bottom: 30px;
  color: #2c3e50;
}

.user-info {
  background-color: #e8f4f8;
  padding: 10px 20px;
  border-radius: 20px;
  color: #2980b9;
}

/* Pantalla 1: Cuadrícula de Botones Gigantes */
.station-selector {
  text-align: center;
}

.station-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.btn-station {
  background-color: #34495e;
  color: white;
  border: none;
  padding: 40px 20px;
  font-size: 1.5rem;
  font-weight: bold;
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.btn-station:active {
  transform: scale(0.98);
  background-color: #2c3e50;
}

/* Pantalla 2: Terminal de Trabajo */
.terminal-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.highlight {
  color: #e67e22;
  font-weight: bold;
  text-transform: uppercase;
}

.btn-back {
  background-color: #95a5a6;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}

/* Tabla de Lotes */
.table-responsive {
  overflow-x: auto;
}

.terminal-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.terminal-table th {
  background-color: #34495e;
  color: white;
  padding: 15px;
  text-align: left;
}

.terminal-table td {
  padding: 15px;
  border-bottom: 1px solid #ecf0f1;
  vertical-align: middle;
}

.fw-bold { font-weight: bold; font-size: 1.1rem; }

.badge-qty {
  background-color: #f39c12;
  color: white;
  padding: 5px 12px;
  border-radius: 15px;
  font-weight: bold;
  font-size: 1.1rem;
}

.btn-action {
  background-color: #27ae60;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  width: 100%; /* Botón ancho para no fallar el 'tap' en la tablet */
}

.btn-action:active { background-color: #2ecc71; }

.empty-state {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-style: italic;
}
</style>