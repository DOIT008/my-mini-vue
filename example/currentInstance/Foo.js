import {h,getCurrentInstance} from "../../lib/my-mini-vue.esm.js";
export const Foo = {
  name:'Foo',
  render() { 
    return h('div', {}, 'foo')
  },
  setup() { 
    // 获取当前组件实例，只能在setup中使用
    const instance = getCurrentInstance();
    console.log('Foo:',instance);
  }
}