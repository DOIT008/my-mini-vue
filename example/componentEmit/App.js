//.vue文件 <template></template>--->render函数
import { h } from "../../lib/my-mini-vue.esm.js";
import { Foo } from "./Foo.js";
window.self = null;
export const App = {
  render() { 
    window.self = this;
    return h('div', {
      id: 'Wrapper',
      class: ['hallo', 'world'],
    },
      [h('div', {}, 'hi,' + this.msg), h(Foo, {})]
    )
  },
  setup() { 
    return {
      msg:'my-mini-vue'
    }
  }
}