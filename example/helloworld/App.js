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
      onClick(){ 
        console.log('click!');
      },
      onMousedown(){ 
        console.log('onMousedown');
      },
    },
      [h('div', {}, 'hi,' + this.msg), h(Foo, {
        count:1
       },)]
      // this.$el-> get root element
      // 'hello，'+this.msg
    // [h('p', { class: 'red' }, '你好呀'), h('label', {class:'blue'},'世界')]
    )
  },
  setup() { 
    return {
      msg:'my-mini-vue'
    }
  }
}