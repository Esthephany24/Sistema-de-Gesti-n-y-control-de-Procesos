<template>
  <div class="toast-container" v-if="visible">
    <div :class="['toast', type]">{{ message }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const message = ref('');
const type = ref('info');
let timeoutId = null;

const show = (payload) => {
  message.value = payload.message || '';
  type.value = payload.type || 'info';
  visible.value = true;
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => (visible.value = false), payload.duration || 3000);
};

window.addEventListener('toast', (e) => show(e.detail || {}));
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
}
.toast {
  padding: 12px 16px;
  border-radius: 6px;
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  font-weight: 600;
}
.toast.info { background: #2d9cdb; }
.toast.success { background: #2ecc71; }
.toast.error { background: #e74c3c; }
.toast.warn { background: #f39c12; }
</style>