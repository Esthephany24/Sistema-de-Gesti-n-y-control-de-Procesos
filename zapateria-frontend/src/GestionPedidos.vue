<template>
  <div class="p-4">
    <h2 class="text-xl font-bold mb-4">Módulo de Gestión de Pedidos</h2>
    
    <div class="mb-4">
      <label>ID Cliente (Vanesa):</label>
      <input v-model="pedido.id_cliente" type="number" class="border p-2 ml-2" />
    </div>

    <div v-for="(item, index) in pedido.detalles" :key="index" class="mb-2 border-b pb-2">
      <input v-model="item.color" placeholder="Color" class="border p-1 mr-2" />
      <input v-model.number="item.cantidad_docenas" type="number" placeholder="Docenas" class="border p-1 w-20" />
      <button @click="eliminarFila(index)" class="text-red-500 ml-2">x</button>
    </div>

    <button @click="agregarFila" class="bg-blue-500 text-white p-2 rounded mt-2 mr-2">
      + Agregar Color
    </button>
    
    <button @click="guardarPedido" class="bg-green-600 text-white p-2 rounded mt-2">
      Guardar Pedido y Generar Trazabilidad
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const pedido = ref({
  id_cliente: 2,
  detalles: [
    { modelo: '47 STREET', serie: 'JUVENIL', color: '', cantidad_docenas: 1 }
  ]
});

const agregarFila = () => {
  pedido.value.detalles.push({ modelo: '47 STREET', serie: 'JUVENIL', color: '', cantidad_docenas: 1 });
};

const eliminarFila = (index) => {
  pedido.value.detalles.splice(index, 1);
};

const guardarPedido = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/pedidos', pedido.value);
    alert(res.data.message);
  } catch (err) {
    alert("Error al conectar con el servidor backend");
  }
};
</script>