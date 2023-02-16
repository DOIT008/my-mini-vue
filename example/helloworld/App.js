//.vue文件 <template></template>--->render函数
import { h } from "../../lib/my-mini-vue.esm.js";
export const App = {
  render() { 
    return h('div', {
      id: 'Wrapper',
      class:['hallo','world']
    }, [h('p', { class: 'red' }, '你好呀'), h('label', {class:'blue'},'世界')])
  },
  setup() { 
    return {
      msg:'my-mini-vue'
    }
  }
}