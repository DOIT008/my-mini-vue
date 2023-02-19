//.vue文件 <template></template>--->render函数
import { h, provide, inject } from "../../lib/my-mini-vue.esm.js";
export const App = {
  name:'App',
  render() { 
    return h('div', {}, [h('p', {},'apiProvideInject'),h(Provider)])
  },
  setup() { 
    
  }
}
const Provider = {
  name:'Provider',
  render() { 
    return h('div', {}, [h('p', {},'Provider'),h(ProviderTow)])
  },
  setup() { 
    provide('foo','fooVal')
    provide('bar','barVal')
  }
}
const ProviderTow = {
  name:'Provider',
  render() { 
    return h('div', {}, [h('p', {},`ProviderTwo, foo：${this.foo}`),h(Consumer)])
  },
  setup() { 
    // 截了一下
    provide('foo', 'fooTwo');
    const foo = inject('foo');
    return {
      foo
    } 
  }
}
const Consumer = {
  name: 'Consumer',
  render() { 
    return h('div', {}, `Consumer-${this.foo}-${this.bar}-${this.barz}`)
  },
  setup() { 
    const foo = inject('foo')
    const bar = inject('bar')
    // 可以传默认值
    // const barz = inject('barz','barzDefault')
    // 可以传函数
    const barz = inject('barz',()=>'barzDefault')
    return {
      foo,
      bar,
      barz
    }
  }
}