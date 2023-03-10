//.vue文件 <template></template>--->render函数
import { h,createTextVNode} from "../../lib/my-mini-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  render() { 
    const app = h('div', {}, "App");
    // 单个vnode
    // const foo = h(Foo, {}, h('p', {}, '1234'))
    // 多个vnode
    const foo = h(Foo, {}, { header: ({ age })=> [h('p', { },'header'+age), createTextVNode('哈喽~')] , footer:()=>h('p', { },'footer') })
    return h('div', {},[app,foo])
  },
  setup() { 
    return {
      
    }
  }
}