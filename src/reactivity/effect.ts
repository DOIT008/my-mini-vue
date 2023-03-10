import { extend } from "@/shared/index";
// 声明一个变量，以便拿到 _effect
let activeEffect: any;
// 要不要进行依赖收集
let shouldTrack = false;
export class ReactiveEffect { 
  private _fn: Function;
  active = true; // 是否清空，清空后是false
  deps = []; // 存储所有的dep
  onStop?:()=>void
  // 为啥加public，为了在实例上能拿到该参数
  constructor(fn:Function,public scheduler?) { 
    this._fn = fn
  }
  run() { 
    if (!this.active) { 
      return this._fn()
    }
    // 当执行run的时候，这里的this就是ReactiveEffect实例，说白了就是下面的_effect
    activeEffect = this;
    shouldTrack = true;
    const result = this._fn();
    // reset
    shouldTrack = false;
    return result
    
  }
  stop() {
    // 未清空时再执行清空操作，防止重复清空
    if (this.active) {
      // 遍历所有的dep，找到当前的activeEffectye（也就是dep），删除即可
      cleanupEffect(this);
      if (this.onStop) { 
        this.onStop()
      }
      this.active = false;
    }
  }
}

function cleanupEffect(effect) { 
  effect.deps.forEach((dep:any) => { 
    dep.delete(effect)
  })
  effect.deps.length = 0
}

/**
 * 收集依赖的函数
 * target：数据对象
 * key：对象属性
 *  */
// 为啥要有两个参数呢，是因为每个属性就是一个数据，每个数据都对应着一个依赖，不然就没办法做响应式了
const targetMap = new Map();
export function track(target:any, key:any) {
  // 不能重复，所以选择Set,也就是target->key->dep
  // 这里的depsMap应该装的是该对象target中所有key的依赖
  let depsMap = targetMap.get(target);
  // 初始化时没有dep，需要创建一个
  if (!depsMap) {
    depsMap = new Map();
    targetMap.set(target, depsMap)
  }
  let dep = depsMap.get(key)
  // 没有dep就创建一个
  if (!dep) {
    dep = new Set();
    depsMap.set(key, dep)
  }
  if (!activeEffect) return
  if (!shouldTrack) return
  trackEffects(dep)
}

export function trackEffects(dep) { 
 // 如果曾经搜集过当前的依赖就不用重新收集了
 if (dep.has(activeEffect)) return 
 // 收集的是activeEffect实例
 dep.add(activeEffect)
 // 收集一下所有的dep
 activeEffect.deps.push(dep)
}

// 副作用,当effect执行的时候，其内部的函数fn也会执行
export function effect(fn: Function, option: any = {}) {
  // activeEffect没有的时候就不收集依赖
  if(isTracking()) return
  const scheduler = option.scheduler;
  // 被收集的对象,为啥是它呢，是因为它上面有run方法，可以修改数据？
  const _effect = new ReactiveEffect(fn, scheduler);
  // 将传入的onStop，传给effect实例
  // _effect.onStop = option.onStop
  extend(_effect, option)
  // 调用这个的时候已经返回foo
  _effect.run();
  // 其实返回的就是run方法，为啥要这么写，是为了处理run内部的this指向
  const runner: any = _effect.run.bind(_effect);
  // 以便在外面的函数访问当前的_effect实例,runner.effect变成了_effect实例
  runner.effect = _effect;
  return runner
}

// 遍历所有的dep中所有的依赖并执行
export function trigger(target:any,key:any) {
  let depsMap = targetMap.get(target);
  let dep = depsMap.get(key);
  triggerEffects(dep)
}

export function triggerEffects(dep) { 
  for (const effect of dep) {
    if (effect.scheduler) {
      effect.scheduler()
    } else { 
      effect.run()
    }
  }
}
// stop
export function stop(runner) { 
  runner.effect.stop()
}
//  ？？
export function isTracking() { 
  return shouldTrack&&activeEffect!==undefined
}