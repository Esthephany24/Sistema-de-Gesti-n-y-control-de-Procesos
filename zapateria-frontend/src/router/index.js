import { createRouter, createWebHistory } from 'vue-router';
import VentasView from '../views/VentasView.vue';
import DashboardView from '../views/DashboardView.vue';
import DashboardDetailView from '../views/DashboardDetailView.vue';
import OperarioView from '../views/OperarioView.vue';
import AlmacenView from '../views/AlmacenView.vue';
import DespachosView from '../views/DespachosView.vue';
import ClientesView from '../views/ClientesView.vue';
import ModelosView from '../views/ModelosView.vue';
import SeriesView from '../views/SeriesView.vue';
import CatalogosView from '../views/CatalogosView.vue';
import NotificacionesView from '../views/NotificacionesView.vue';
import AsignacionMateriales from '../views/AsignacionMateriales.vue';
import AlmacenDashboardView from '../views/AlmacenDashboardView.vue';
import KardexView from '../views/KardexView.vue';

const routes = [
  { path: '/', component: VentasView },
  { path: '/dashboard', component: DashboardView },
  { path: '/dashboard/detalle/:section', component: DashboardDetailView },
  { path: '/operario', component: OperarioView },
  { path: '/almacen', component: AlmacenView },
  { path: '/almacen-dashboard', component: AlmacenDashboardView },
  { path: '/kardex', component: KardexView },
  { path: '/catalogos', component: CatalogosView },
  { path: '/notificaciones', component: NotificacionesView },
  { path: '/asignacion-materiales', component: AsignacionMateriales },
  // legacy top-level routes kept for compatibility
  { path: '/clientes', component: ClientesView },
  { path: '/modelos', component: ModelosView },
  { path: '/series', component: SeriesView },
  { path: '/despachos', component: DespachosView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});