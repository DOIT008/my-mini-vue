import { reactive } from '@/reactivity/reactive';
import { effect } from "../effect";
import { ref,isRef,unRef,proxyRefs } from "../ref";
import { describe,it,expect } from "vitest";
describe('ref', () => { 
  it("测试ref的get", () => {
    const data = ref(1);
    expect(data.value).toBe(1)
  })
  // 测试响应式
  it('should be reactive', () => {
    const data = ref(1);
    let dummy;
    let calls = 0;
    effect(() => { 
      calls++;
      dummy = data.value;
    })

    expect(calls).toBe(1)
    expect(dummy).toBe(1)

    // 修改数据
    data.value = 2;
    expect(calls).toBe(2)
    expect(dummy).toBe(2)

    // 再次修改
    data.value = 2;
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  })

  // 如果接收到的是一个对象呢
  it('should make nested properties reactive', () => { 
    const a = ref({
      count:1
    })
    let dummy;
    effect(() => { 
      dummy = a.value.count
    })
    expect(dummy).toBe(1);
    a.value.count = 2;
    expect(dummy).toBe(2)
  })

  // isRef
it('isRef', () => {
  const a = ref(1);
  const user = reactive({ age: 10 });
  expect(isRef(a)).toBe(true)
  expect(isRef(1)).toBe(false)
  expect(isRef(user)).toBe(false)
})
  
  // unRef(),返回数据的值（value）
  it('unRef', () => {
    const a = ref(1);
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
  })


  it('proxyRefs', () => { 
    const user = {
      age: ref(10),
      name:'小明'
    }
    // get->ref(age)->返回.value即可，如果不是直接返回值本身即可
    const proxyUser = proxyRefs(user);
    expect(user.age.value).toBe(10);
    expect(proxyUser.age).toBe(10);
    expect(proxyUser.name).toBe('小明');

    // 修改数据
    // set->ref->修改.value，如果不是ref数据

    proxyUser.age = 20;
    expect(user.age.value).toBe(20);
    expect(proxyUser.age).toBe(20);
// 
//     proxyUser.age = ref(10);
//     expect(user.age.value).toBe(10);
//     expect(proxyUser.age).toBe(10);

  })
})
