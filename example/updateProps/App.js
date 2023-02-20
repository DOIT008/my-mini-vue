//.vue文件 <template></template>--->render函数
import { h,ref } from "../../lib/my-mini-vue.esm.js";
window.self = null;
export const App = {
  render() { 
    return h('div', { id: 'root', ...this.props }, [
      h('div', {}, 'count:' + this.count),
      h('button', {onClick: this.onClick,}, 'click'),
      h('button', {onClick: this.onChangeDemo1,}, 'changeProps-值改变了-修改'),
      h('button', {onClick: this.onChangeDemo2,}, 'changeProps-值变成了undefined-删除'),
      h('button', {onClick: this.onChangeDemo3,}, 'changeProps-key在新的里面没有了-删除'),
    ])
  },
  setup() { 
    const count = ref(0);
    const onClick = function () { 
      count.value++
    }
    const props = ref({
      foo: 'foo',
      bar:'bar'
    })
    const onChangeDemo1 = () => { 
      props.value.foo = 'new-foo'
    }
    const onChangeDemo2 = () => { 
      props.value.foo = undefined
    }
    const onChangeDemo3 = () => { 
      props.value = {
        foo:'foo'
      }
    }
    return {
      count,
      onClick,
      props,
      onChangeDemo1,
      onChangeDemo2,
      onChangeDemo3
    }
  }
}