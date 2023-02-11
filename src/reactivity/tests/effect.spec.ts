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
    expect(newSum).toBe(11000);
    // 更新数据,触发set
    user.age++;
    expect(newAge).toBe(12);
    user.sum++;
    expect(newSum).toBe(11001);
  })
  
  it('当调用effect时返回一个runner', () => { 
  // effect(fn)——>返回一个函数runner——>调用runner——>执行fn——>
    let foo = 19;
    const runner = effect(() => { 
      foo++;
      return 'foo'
    });
    expect(foo).toBe(20);
    // 重新调用了run方法
    const r = runner();
    expect(foo).toBe(21);
    expect(r).toBe('foo');
  })

  it('scheduler', () => { 
    /**
     * 1. 通过 effect 的第二个参数给定一个scheduler函数
     * 2. effect第一次执行的时候会执行fn
     * 3. 当响应式对象set不会执行fn，而是执行scheduler
     * 4. 当执行runner的时候会再次执行fn
     *  */

    let dummy;
    let run: any;
    const scheduler = vitest.fn(() => {
      run = runner
    })
    const obj = reactive({ foo: 1 });
    const runner = effect(() => { 
      dummy = obj.foo;
    }, {
      scheduler
    })
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // 更新操作，should be called on first trigger
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1)
    // manually run
    run();
    // should have run
    expect(dummy).toBe(2)
  })
})
