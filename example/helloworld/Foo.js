import { h } from "../../lib/my-mini-vue.esm.js";
export const Foo = {
  setup(props) { 
    // props 是 shallow readonly型的
    console.log(props);
    props.count++
  },
  render() { 
    return h('div', {},'foo：'+this.count)
  }
}