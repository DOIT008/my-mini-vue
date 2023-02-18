//.vue文件 <template></template>--->render函数
import {h,getCurrentInstance} from "../../lib/my-mini-vue.esm.js";
import { Foo } from "./Foo.js";
export const App = {
  name:'App',
  render() { 
    return h('div', {}, [h('p', {},'currentInstance demo'),h(Foo)])
  },
  setup() { 
    // 获取当前组件实例，只能在setup中使用
    const instance = getCurrentInstance();
    console.log('App:',instance);
  }
}
