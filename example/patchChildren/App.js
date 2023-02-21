//.vue文件 <template></template>--->render函数
import { h } from "../../lib/my-mini-vue.esm.js";
import ArrayToText from "./ArrayToText.js";
import TextToText from "./TextToText.js";
import TextToArray from "./TextToArray.js";
import ArrayToArray from "./ArrayToArray.js";
export const App = {
  render() { 
    return h('div', { id: 'root' }, [
      h('p', {tId:1},'主页'),
      // 老的是数组，新的是Text
      // h(ArrayToText)
      // 新旧都是text
      // h(TextToText)
      // 老的是text，新的是array
      // h(TextToArray)
      // 老的是Array，新的是array
      h(ArrayToArray)
    ])
  },
  setup() { 
    
  }
}