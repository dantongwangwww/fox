import { createApp } from "vue";
import App from "@/App.vue";
import router from "@/router/index.js";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import "@/reset.css";
import "@/style.css";
import "virtual:svg-icons-register";
import globalComponent from "@/components/install.js";
import 'leaflet/dist/leaflet.css'

const app = createApp(App);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus);
app.use(router);
app.use(globalComponent);
app.mount("#app");


