import { describe, it, expect } from 'vitest';
import { reactive,isReactive,isProxy } from "@/reactivity/reactive";
describe("reactive", () => {
  it('happy path', () => { 
    const original = {
      foo: 1
    };
    const observe = reactive(original);
    // 原数据对象和包装后的对象不一样
    expect(observe).not.toBe(original)
    // 但能正常访问属性
    expect(observe.foo).toBe(1)
    // 测试是否是reactive数据
    expect(isReactive(observe)).toBe(true);
    expect(isReactive(original)).toBe(false);
    // 判断数据对象是否是Proxy
    expect(isProxy(observe)).toBe(true)
  })

  it("多层数据嵌套，是否是响应式数据呢", () => { 
    const origionalData = {
      user: {
        age:13
      },
      bookList: [{name:'《红楼梦》',count:18}]
    }
    const reactiveData = reactive(origionalData)
    expect(isReactive(reactiveData.user)).toBe(true)
    expect(isReactive(reactiveData.bookList)).toBe(true)
    expect(isReactive(reactiveData.bookList[0])).toBe(true)
  })
})