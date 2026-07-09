<template>
  <div class="series-view">
    <div class="header">
      <h2>Series</h2>
      <button @click="openNew" class="btn-new">+ Nueva Serie</button>
    </div>

    <div class="table-wrap">
      <table class="data-table">
        <thead>
          <tr><th>ID</th><th>Descripción</th><th>Acciones</th></tr>
        </thead>
        <tbody>
          <tr v-for="s in items" :key="s.id_serie">
            <td>{{ s.id_serie }}</td>
            <td>{{ s.descripcion }}</td>
            <td class="actions-cell">
              <button @click="edit(s)" class="btn">Editar</button>
              <button @click="confirmDelete(s.id_serie)" class="btn del">Borrar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <header><h3>{{ editId ? 'Editar' : 'Nueva' }} Serie</h3></header>
        <div class="modal-body">
          <div class="form-group">
            <label>Descripción</label>
            <input v-model="form.descripcion" />
          </div>
        </div>
        <footer>
          <button @click="save" class="btn save">Guardar</button>
          <button @click="close" class="btn">Cancelar</button>
        </footer>
      </div>
    </div>
    <ConfirmModal v-if="showConfirm" :message="confirmMsg" @confirm="doDelete" @cancel="() => showConfirm.value = false" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import { listSeries, createSerie, updateSerie, deleteSerie } from '../services/series';

const items = ref([]);
const showModal = ref(false);
const editId = ref(null);
const form = ref({ descripcion: '' });

const showConfirm = ref(false);
const confirmId = ref(null);
const confirmMsg = ref('');

const load = async () => { items.value = await listSeries(); };
const openNew = () => { editId.value = null; form.value = { descripcion: '' }; showModal.value = true; };
const edit = (s) => { editId.value = s.id_serie; form.value = { descripcion: s.descripcion }; showModal.value = true; };
const close = () => { showModal.value = false; };

const showToast = (msg, type = 'success') => { window.dispatchEvent(new CustomEvent('toast', { detail: { message: msg, type } })); };

const save = async () => { if (!form.value.descripcion) { showToast('Descripción obligatoria', 'warn'); return; } try { if (editId.value) await updateSerie(editId.value, form.value); else await createSerie(form.value); await load(); close(); showToast('Serie guardada correctamente', 'success'); } catch (err) { showToast(err.response?.data?.error || err.message, 'error'); } };
const confirmDelete = (id) => { confirmId.value = id; confirmMsg.value = '¿Desea eliminar esta serie?'; showConfirm.value = true; };
const doDelete = async () => { try { await deleteSerie(confirmId.value); await load(); showToast('Serie eliminada', 'success'); } catch (err) { showToast(err.response?.data?.error || err.message, 'error'); } showConfirm.value = false; };
const closeSuccess = () => { /* unused */ };
onMounted(load);
</script>

<style scoped>
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.btn-new { padding: 8px 12px; background: #059669; color: white; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; }
.table-wrap { max-height: 60vh; overflow: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table thead th { position: sticky; top: 0; background: #f3f4f6; font-weight: 600; padding: 8px; text-align: left; }
.data-table td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
.actions-cell { display: flex; gap: 10px; align-items: center; }
.modal-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.4); z-index: 1000; }
.modal-content { background: #fff; padding: 20px; border-radius: 8px; width: 400px; box-shadow: 0 8px 20px rgba(0,0,0,0.12); }
.modal-content header { margin-bottom: 16px; }
.modal-content h3 { margin: 0; font-size: 18px; }
.modal-body { margin-bottom: 16px; }
.form-group { display: flex; flex-direction: column; margin-bottom: 12px; }
.form-group label { font-weight: 500; margin-bottom: 4px; }
.modal-body input { padding: 8px; border: 1px solid #d1d5db; border-radius: 4px; width: 100%; box-sizing: border-box; }
.modal-content footer { display: flex; justify-content: flex-end; gap: 8px; }
.btn { padding: 8px 12px; border-radius: 4px; border: none; font-weight: 500; cursor: pointer; background: #2563eb; color: white; }
.btn.del { background: #b91c1c; }
.btn.save { background: #059669; }
</style>
