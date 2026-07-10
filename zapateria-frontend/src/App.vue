<template>
  <div id="layout">
    <Toast />
    <nav class="sidebar">
      <div class="logo">
        <h2>SGC Zapatería</h2>
        <span>Control de Producción</span>
      </div>
      
      <ul class="nav-links">
        <li>
          <router-link to="/" active-class="active">
            <i class="fas fa-shopping-cart"></i> Módulo de Ventas
          </router-link>
        </li>
        <li>
          <router-link to="/dashboard" active-class="active">
            <i class="fas fa-chart-line"></i> Dashboard Jefe
          </router-link>
        </li>
        <li>
          <router-link to="/operario" active-class="active">
            <i class="fas fa-qrcode"></i> Terminal Operario
          </router-link>
        </li>
        <li>
          <router-link to="/despachos" active-class="active">
            <i class="fas fa-warehouse"></i> Envios y Despachos
          </router-link>
        </li>
        <li>
          <router-link to="/almacen" active-class="active">
            <i class="fas fa-warehouse"></i> Gestion Almacén
          </router-link>
        </li>
        <li>
          <router-link to="/almacen-dashboard" active-class="active">
            <i class="fas fa-chart-pie"></i> Dashboard Almacén
          </router-link>
        </li>
        <li>
          <router-link to="/kardex" active-class="active">
            <i class="fas fa-book-open"></i> Kardex
          </router-link>
        </li>
        <li>
          <router-link to="/asignacion-materiales" active-class="active">
            <i class="fas fa-tasks"></i> Asignación Materiales
          </router-link>
        </li>
        <li>
          <router-link to="/catalogos" active-class="active">
            <i class="fas fa-book"></i> Catálogos
          </router-link>
        </li>
      </ul>
    </nav>

    <main class="content">
      <header class="top-header">
        <h1>{{ currentRouteName }}</h1>
        <div class="header-right">
          <button class="notification-button" type="button" @click="openNotifications">
            <i class="fas fa-bell"></i>
            <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
          </button>
          <div class="user-info">Sesión: Administrador</div>
        </div>
      </header>
      
      <section class="view-container">
        <router-view></router-view>
      </section>
    </main>
  </div>
</template>

<script setup>
import './styles/App.css';
import { computed, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Toast from './components/Toast.vue';

const route = useRoute();
const router = useRouter();
const unreadCount = ref(0);

const cargarNotificaciones = async () => {
  try {
    /*const response = await fetch('http://localhost:3000/api/notificaciones');*/
    const url = `${import.meta.env.VITE_API_URL}/notificaciones`;
    console.log("URL API:", url);
    const response = await fetch(url);
    
    const data = await response.json();
    unreadCount.value = Array.isArray(data)
      ? data.filter((item) => item.leido === false).length
      : 0;
  } catch (error) {
    console.error('Error cargando notificaciones:', error);
    unreadCount.value = 0;
  }
};

const openNotifications = () => {
  router.push('/notificaciones');
};

onMounted(cargarNotificaciones);

// Cambia el título del header según la pantalla actual
const currentRouteName = computed(() => {
    switch(true) {
      case route.path.startsWith('/catalogos'): return 'Catálogos';
      case route.path === '/catalogos': return 'Catálogos';
      case route.path.startsWith('/dashboard/detalle'): return 'Detalle Dashboard';
      case route.path === '/': return 'Gestión de Pedidos';
      case route.path === '/dashboard': return 'Monitor de Producción';
      case route.path === '/operario': return 'Control de Trazabilidad';
      case route.path === '/despachos': return 'Envios y Despachos';
      case route.path === '/almacen': return 'Gestión de Materiales';
      case route.path === '/almacen-dashboard': return 'Dashboard de Almacén';
      case route.path === '/kardex': return 'Kardex';
      case route.path === '/notificaciones': return 'Notificaciones';
      case route.path === '/asignacion-materiales': return 'Asignación de Materiales';
      default: return 'Sistema de Gestión';
  }
});
</script>


