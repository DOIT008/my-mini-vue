import { createApp } from "../../lib/my-mini-vue.esm"
import { App } from "./App"
const rootContainer = document.querySelector('#app')
createApp(App).mount(rootContainer)