import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

// 启动《东方五律战记》(Touhou: Fivefold Dominion) Vue 3 + Pinia 应用
const app = createApp(App);
app.use(createPinia());
app.mount('#app');
