<template>
  <div class="confirm-overlay">
    <div class="confirm-box">
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn-cancel" @click="$emit('cancel')">Cancelar</button>
        <button class="btn-delete" @click="$emit('confirm')">Eliminar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ message: { type: String, default: '¿Confirmar?' } });
defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.confirm-box {
  background: #0f172a;
  padding: 18px;
  border-radius: 8px;
  width: 320px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.2);
}
.confirm-message { margin-bottom: 12px; font-weight: 600; }
.confirm-actions { display:flex; justify-content: flex-end; gap: 8px; }
.btn-cancel { background: #ccc; border: none; padding: 8px 12px; border-radius:6px; }
.btn-delete { background: #e74c3c; color: white; border: none; padding: 8px 12px; border-radius:6px; }
</style>
