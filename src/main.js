import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/app.css'
import App from './App.vue'
import router from './router'
import Icon from './components/Icon.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)
app.mount('#app')
