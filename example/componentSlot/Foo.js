import { h,renderSlots } from "../../lib/my-mini-vue.esm.js";
export const Foo = {
  setup() { 
    
  },
  render() {
    console.log(this.$slots);
    const foo = h('p', {}, 'foo')
    // 具名插槽
    // 1. 获取到要渲染的元素
    // 2. 获取到要渲染的位置
    return h('div', {},[renderSlots(this.$slots,'header'),foo,renderSlots(this.$slots,'footer')])
  }
}