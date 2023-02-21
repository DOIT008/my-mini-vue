import { h ,ref} from "../../lib/my-mini-vue.esm.js";
const nextChildren = 'nextChildren';
const prevChildren = 'oldChildren';

export default {
  name:'ArrayToText',
  setup() { 
    const isChange = ref(false);
    window.isChange = isChange;
    return {
      isChange
    }
  },
  render() { 
    const self = this;
    return self.isChange ? h('div', {}, nextChildren) : h("div", {}, prevChildren);
  }
}