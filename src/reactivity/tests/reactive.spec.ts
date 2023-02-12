import { describe, it, expect } from 'vitest';
import { reactive,isReactive } from "@/reactivity/reactive";
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
    expect(isReactive(original)).toBe(false)
  })
})