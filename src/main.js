import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './styles/app.css'
import App from './App.vue'
import router from './router'
import Icon from './components/Icon.vue'
import AddToPlaylistButton from './components/AddToPlaylistButton.vue'
import FavoriteSongButton from './components/FavoriteSongButton.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.component('Icon', Icon)
app.component('AddToPlaylistButton', AddToPlaylistButton)
app.component('FavoriteSongButton', FavoriteSongButton)
app.mount('#app')
