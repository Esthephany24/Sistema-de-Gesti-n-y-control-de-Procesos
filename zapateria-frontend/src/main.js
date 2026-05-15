import './styles/global.css'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router' // Importamos el archivo de rutas que creamos

const app = createApp(App)

app.use(router) // Le decimos a Vue que use el router [cite: 2231]

app.mount('#app')

//createApp(App).mount('#app')

