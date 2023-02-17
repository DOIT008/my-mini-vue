import { h } from "../../lib/my-mini-vue.esm.js";
export const Foo = {
  setup(props, { emit }) { 
    const emitAdd = () => { 
      emit('add', 12, 2);
      emit('add-foo');
    }
    return {
      emitAdd
    }
  },
  render() {
    const btn = h('button', {
      onClick:this.emitAdd
    }, 'emitAdd')
    const foo = h('p', {},'foo')
    return h('div', {},[btn, foo])
  }
}