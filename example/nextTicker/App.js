//.vue文件 <template></template>--->render函数
import { h,ref ,getCurrentInstance,nextTick} from "../../lib/my-mini-vue.esm.js";
window.self = null;
export const App = {
  setup() { 
    const count = ref(0);
    const instance = getCurrentInstance()
    const onClick = function () { 
      for (let i = 0; i < 100; i++) {
        count.value = i;
      }
      nextTick(() => { 
        console.log(instance);
      })
    }
    return {
      count,
      onClick
    }
  },
  render() { 
    const button = h('button', { onClick: this.onClick }, 'add');
    const p = h('p',{},'count:'+this.count)
    return h('div', {},[button,p])
  },
}