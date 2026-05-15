<template>
  <div class="despacho-container">

    <h2>📦 Módulo de Despachos</h2>

    <div class="table-container">

      <table class="despacho-table">

        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Guía</th>
            <th>Transporte</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>

          <tr
            v-for="item in despachos"
            :key="item.id_despacho"
          >

            <td>
              P-{{ String(item.id_pedido).padStart(3, '0') }}
            </td>

            <td>
              {{ item.cliente }}
            </td>

            <td>

              <span
                class="badge"
                :class="item.estado_envio.toLowerCase()"
              >
                {{ item.estado_envio }}
              </span>

            </td>

            <td>
              {{ item.numero_guia || 'Sin guía' }}
            </td>

            <td>
              {{ item.empresa_transporte || '---' }}
            </td>

            <td class="actions">

              <button
                v-if="item.estado_envio === 'PENDIENTE_GUIA'"
                class="btn-guide"
                @click="registrarGuia(item)"
              >
                Registrar Guía
              </button>

              <button
                v-if="item.estado_envio === 'GUIA_GENERADA'"
                class="btn-send"
                @click="marcarEnviado(item)"
              >
                Marcar Enviado
              </button>

              <button
                v-if="item.estado_envio === 'ENVIADO'"
                class="btn-deliver"
                @click="marcarEntregado(item)"
              >
                Entregado
              </button>

            </td>

          </tr>

        </tbody>

      </table>

    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const despachos = ref([]);

const fetchDespachos = async () => {

  const response = await fetch(
    'http://localhost:3000/api/despachos'
  );

  despachos.value = await response.json();
};

const registrarGuia = async (item) => {

  const numero_guia = prompt('Número de guía');

  if (!numero_guia) return;

  const empresa_transporte = prompt('Empresa transporte');

  if (!empresa_transporte) return;

  await fetch(
    `http://localhost:3000/api/despachos/${item.id_despacho}/guia`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        numero_guia,
        empresa_transporte
      })
    }
  );

  fetchDespachos();
};

const marcarEnviado = async (item) => {

  await fetch(
    `http://localhost:3000/api/despachos/${item.id_despacho}/enviar`,
    {
      method: 'PUT'
    }
  );

  fetchDespachos();
};

const marcarEntregado = async (item) => {

  await fetch(
    `http://localhost:3000/api/despachos/${item.id_despacho}/entregar`,
    {
      method: 'PUT'
    }
  );

  fetchDespachos();
};

onMounted(() => {
  fetchDespachos();
});
</script>

<style scoped>

.despacho-container{
  padding:24px;
  color:white;
}

.table-container{
  margin-top:20px;
  overflow:auto;
}

.despacho-table{
  width:100%;
  border-collapse:collapse;
}

.despacho-table th,
.despacho-table td{
  padding:14px;
  border-bottom:1px solid #334155;
}

.badge{
  padding:6px 12px;
  border-radius:999px;
  font-size:.8rem;
  font-weight:bold;
}

.pendiente_guia{
  background:#f59e0b33;
}

.guia_generada{
  background:#3b82f633;
}

.enviado{
  background:#10b98133;
}

.entregado{
  background:#22c55e55;
}

.actions{
  display:flex;
  gap:10px;
}

.btn-guide,
.btn-send,
.btn-deliver{
  border:none;
  padding:8px 12px;
  border-radius:10px;
  cursor:pointer;
  color:white;
}

.btn-guide{
  background:#3b82f6;
}

.btn-send{
  background:#10b981;
}

.btn-deliver{
  background:#22c55e;
}

</style>