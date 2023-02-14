import { effect } from "../effect";
import { ref } from "../ref";
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
})