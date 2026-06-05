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
          <router-link to="/catalogos" active-class="active">
            <i class="fas fa-book"></i> Catálogos
          </router-link>
        </li>
      </ul>
    </nav>

    <main class="content">
      <header class="top-header">
        <h1>{{ currentRouteName }}</h1>
        <div class="user-info">Sesión: Administrador</div>
      </header>
      
      <section class="view-container">
        <router-view></router-view>
      </section>
    </main>
  </div>
</template>

<script setup>
import './styles/App.css';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Toast from './components/Toast.vue';

const route = useRoute();

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
      default: return 'Sistema de Gestión';
  }
});
</script>


