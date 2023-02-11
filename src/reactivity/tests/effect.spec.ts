import { describe, it, expect } from 'vitest';
import { reactive} from "@/reactivity/reactive";
import { effect } from "@/reactivity/effect";
describe("effect", () => {
  it('happy path', () => { 
    const user = reactive({
      age: 10,
      sum:10000
    });
    let newAge;
    effect(() => { 
      newAge = user.age+1;
    })
    let newSum;
    effect(() => {
      newSum = user.sum + 1000;
    });
    expect(newAge).toBe(11);
    // expect(newSum).toBe(11000);
    // 更新数据,触发set
    user.age++;
    expect(newAge).toBe(12);
    // user.sum++;
    // expect(newSum).toBe(11001);
  })
})
