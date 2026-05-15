import { createRouter, createWebHistory } from 'vue-router';
import VentasView from '../views/VentasView.vue';
import DashboardView from '../views/DashboardView.vue';
import OperarioView from '../views/OperarioView.vue';
import AlmacenView from '../views/AlmacenView.vue';
import DespachosView from '../views/DespachosView.vue';

const routes = [
  { path: '/', component: VentasView },
  { path: '/dashboard', component: DashboardView },
  { path: '/operario', component: OperarioView },
  { path: '/almacen', component: AlmacenView },
  { path: '/despachos', component: DespachosView }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});