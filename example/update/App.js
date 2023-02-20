//.vue文件 <template></template>--->render函数
import { h,ref } from "../../lib/my-mini-vue.esm.js";
window.self = null;
export const App = {
  render() { 
    return h('div', { id: 'root' }, [h('div', {}, 'count:' + this.count), h('button', {
      onClick: this.onClick,
    },'click')])
  },
  setup() { 
    const count = ref(0);
    const onClick = function () { 
      count.value++
    }
    return {
      count,
      onClick
    }
  }
}