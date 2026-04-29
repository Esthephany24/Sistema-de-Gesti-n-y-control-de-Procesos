<template>
  <div>
    <h1>Registro de Pedido - Cliente Vanesa</h1>
    <button @click="enviarPedido">Guardar Pedido de 12 Docenas</button>
  </div>
</template>

<script setup>
import axios from 'axios';

const enviarPedido = async () => {
  const pedidoData = {
    id_cliente: 1, // ID de Vanesa en tu BD
    detalles: [
      { modelo: '47 STREET', serie: 'JUVENIL', color: 'ROSADO', cantidad_docenas: 2 },
      { modelo: '47 STREET', serie: 'JUVENIL', color: 'CELESTE', cantidad_docenas: 2 },
      // ... agregar los otros 4 colores aquí
    ]
  };

  try {
    const response = await axios.post('http://localhost:3000/api/pedidos', pedidoData);
    alert(response.data.message); // "Pedido de Vanesa registrado con 12 docenas"
  } catch (error) {
    console.error("Error al guardar", error);
  }
};
</script>