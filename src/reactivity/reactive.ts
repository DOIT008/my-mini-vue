import { track,trigger } from "./effect";
export function reactive(dataObj: any) {
  return new Proxy(dataObj, {
    // 这里的target就是原始数据对象，key就是数据对象属性
    get(target, key) {
      let res = Reflect.get(target, key)
      // todo:依赖收集
      track(target,key)
      return res;
    },
    // 这里的value就是新值
    set(target, key, value) {
      let res = Reflect.set(target, key,value)
      // 触发依赖,遍历之前收集到的依赖，执行每一个fn
      trigger(target,key)
      return res
    }
  })
}