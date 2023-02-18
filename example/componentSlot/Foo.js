import { h,renderSlots } from "../../lib/my-mini-vue.esm.js";
export const Foo = {
  setup() { 
    
  },
  render() {
    console.log(this.$slots);
    const foo = h('p', {},'foo')
    return h('div', {},[foo,renderSlots(this.$slots)])
  }
}