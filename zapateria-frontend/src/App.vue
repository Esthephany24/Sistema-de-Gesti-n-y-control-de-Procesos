<template>
  <div id="layout">
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
          <router-link to="/almacen" active-class="active">
            <i class="fas fa-warehouse"></i> Gestion Almacén
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
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Cambia el título del header según la pantalla actual
const currentRouteName = computed(() => {
  switch(route.path) {
    case '/': return 'Gestión de Pedidos';
    case '/dashboard': return 'Monitor de Producción';
    case '/operario': return 'Control de Trazabilidad';
    case '/almacen': return 'Gestión de Materiales';
    default: return 'Sistema de Gestión';
  }
});
</script>

<style>
/* Diseño Base para la Aplicación de Tesis */
:root {
  --primary: #373549;
  --secondary: #1a3b94;
  --accent: #3498db;
  --bg-light: #f4f7f6;
}

body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }

#layout {
  display: flex;
  height: 100vh;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background-color: var(--primary);
  color: white;
  padding: 20px;
}

.logo { border-bottom: 1px solid #537a4a; margin-bottom: 20px; padding-bottom: 10px; }
.logo h2 { margin: 0; color: #fff; font-size: 1.2rem; }

.nav-links { list-style: none; padding: 0; }
.nav-links li { margin: 15px 0; }
.nav-links a {
  color: #bdc3c7;
  text-decoration: none;
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 5px;
  transition: 0.3s;
}

.nav-links a:hover, .active {
  background-color: var(--secondary);
  color: white !important;
}

/* Contenido Principal */
.content {
  flex: 1;
  background-color: var(--bg-light);
  display: flex;
  flex-direction: column;
}

.top-header {
  background: rgb(64, 66, 83);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.view-container {
  padding: 30px;
  overflow-y: auto;
}
</style>