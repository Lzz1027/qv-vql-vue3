import { createApp } from "vue";
import "./style.css";
import Antd from "ant-design-vue";
import App from "./App.vue";
import "ant-design-vue/dist/reset.css";
import '@vue-flow/core/dist/style.css';
import '@vue-flow/core/dist/theme-default.css';
import pinia from "./stores";

const app = createApp(App);

app.use(pinia).use(Antd).mount("#app");
