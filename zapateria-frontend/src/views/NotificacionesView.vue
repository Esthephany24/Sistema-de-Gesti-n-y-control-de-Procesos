<template>
  <div class="notificaciones-page">
    <div class="notificaciones-header">
      <div>
        <h2>Notificaciones</h2>
        <p>Mensajes recientes y estado de notificaciones no leídas.</p>
      </div>
      <button class="btn-marcar-todas" @click="marcarTodasLeidas" type="button">
        Marcar todas leídas
      </button>
    </div>

    <div class="notificaciones-list">
      <div v-for="item in notificaciones" :key="item.id_notificacion" class="notificacion-card">
        <div class="notificacion-top">
          <div>
            <h3>{{ item.titulo }}</h3>
            <p>{{ item.mensaje }}</p>
          </div>
          <span class="notificacion-fecha">{{ formatearFecha(item.fecha) }}</span>
        </div>

        <div class="notificacion-meta">
          <span class="notificacion-tipo">{{ item.tipo }}</span>
          <span :class="['notificacion-estado', item.leido ? 'leida' : 'no-leida']">
            {{ item.leido ? 'Leída' : 'No leída' }}
          </span>
          <button v-if="!item.leido" class="btn-marcar-leida" @click="marcarLeida(item.id_notificacion)" type="button">
            Marcar leída
          </button>
        </div>
      </div>
      <div v-if="notificaciones.length === 0" class="empty-state">
        No hay notificaciones para mostrar.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import '../components/Notificaciones.css';

const notificaciones = ref([]);

const cargarNotificaciones = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/notificaciones');
    notificaciones.value = await response.json();
  } catch (error) {
    console.error('Error cargando notificaciones:', error);
    notificaciones.value = [];
  }
};

const marcarLeida = async (id) => {
  try {
    await fetch(`http://localhost:3000/api/notificaciones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    await cargarNotificaciones();
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
  }
};

const marcarTodasLeidas = async () => {
  try {
    await fetch('http://localhost:3000/api/notificaciones', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    await cargarNotificaciones();
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
  }
};

const formatearFecha = (value) => {
  return value ? new Date(value).toLocaleString('es-ES') : '';
};

onMounted(cargarNotificaciones);
</script>
