import { readonly } from "@/reactivity/reactive";
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
  })
})