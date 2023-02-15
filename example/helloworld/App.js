//.vue文件 <template></template>--->render函数
import { h } from "../../lib/my-mini-vue.esm.js";
export const App = {
  render() { 
    return h('div','hello,'+this.msg)
  },
  setup() { 
    return {
      msg:'my-mini-vue'
    }
  }
}