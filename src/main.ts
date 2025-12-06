import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn' // 中文语言包
import router from './router' // 引入路由

const app = createApp(App)
app.use(createPinia()) // 注册Pinia
app.use(ElementPlus, { locale: zhCn }) // 注册Element Plus（中文）
app.use(router) // 注册路由
app.mount('#app')
