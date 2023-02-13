import { readonly,isReadonly } from "@/reactivity/reactive";
import { describe, it, expect } from "vitest";
describe("readonly", () => {
  it("happy path", () => {
    // 既然是readonly，也就是不能修改，那么收集依赖track和触发依赖trigger就没有存在地意义了
    const origionalData = {
      foo: 1, bar: {
      barz:3
      }
    }
    const packageData = readonly(origionalData);
    expect(packageData).not.toBe(origionalData);
    expect(packageData.foo).toBe(1)
    // 测试 packageData 是否是readonly
    expect(isReadonly(packageData)).toBe(true)
    expect(isReadonly(origionalData)).toBe(false)
    // 判断嵌套的数据是否是readonly
    expect(isReadonly(packageData.bar)).toBe(true)
    expect(isReadonly(origionalData.bar)).toBe(false)
  })

  it('warn when call set', () => { 
    console.warn = vitest.fn();
    const animal = readonly({
      age:18
    });
    animal.age = 19;
    expect(console.warn).toBeCalled()
  })
})