import { track, trigger } from "./effect";
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
// 封装get
function createGetter(isReadonly = false) {
  return function (target, key) {
    let res = Reflect.get(target, key);
    // todo:依赖收集
    if (!isReadonly) {
      track(target, key);
    }
    return res;
  };
}
// 封装set
function createSetter() {
  return function (target, key, value) {
    let res = Reflect.set(target, key, value);
    // 触发依赖,遍历之前收集到的依赖，执行每一个fn
    trigger(target, key);
    return res;
  };
}
export const mutableHandlers = {
  get,
  set,
};

export const readonlyHandlers = {
  get: readonlyGet,
  set(target, key, value) {
    console.warn(`${key} set失败，因为target是readonly`,target)
    return true;
  },
};
