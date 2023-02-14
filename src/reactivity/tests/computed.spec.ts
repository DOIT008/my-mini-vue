import {computed} from "@/reactivity/computed";
import { reactive } from "@/reactivity/reactive";
import {describe,it,expect} from 'vitest'
describe("computed", () => {
  it('happy path', () => { 
    const user = reactive({
      age:10
    })
    // 计算属性
    const age = computed(() => { 
      return user.age
    })
    // 
    expect(age.value).toBe(10)
  })

  it("should compute lazily", () => {
    const value = reactive({
      foo:1
    })
    const getter = vitest.fn(() => { 
      return value.foo
    })
    const cValue = computed(getter);
    // lazy,如果没访问cValue.value时，getter就不会调用
    expect(getter).not.toHaveBeenCalled()
    // 开始访问cValue.value
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)

    // 不应该重新计算，触发get
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(1)

    value.foo = 2; // 触发set->trigger->effect->get
    expect(getter).toHaveBeenCalledTimes(1)

    // 现在应该重新计算了
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)

    // 不应该重新计算
    cValue.value;
    expect(getter).toHaveBeenCalledTimes(2)
  })

})