import { isProxy } from '@/reactivity/reactive';
import { mutableHandlers, readonlyHandlers,shallowReadonlyHandlers } from "./baseHandlers";
// 设置一个枚举
export const enum ReactiveFlags { 
  IS_REACTIVE = "_is_reactive",
  IS_READONLY = '_is_readonly'
}
export function reactive(dataObj: any) {
  return createActiveObject(dataObj,mutableHandlers);
}

export function readonly(target: any) {
  return createActiveObject(target,readonlyHandlers);
}


export function shallowReadonly(target) {
  return createActiveObject(target,shallowReadonlyHandlers);
}

function createActiveObject(target,baseHandlers) { 
  return new Proxy(target,baseHandlers)
}

// 判断一个数据对象是否是响应式数据对象
export function isReactive(dataObj) { 
  // 会触发get操作，不管是不是reactive
  return !!dataObj[ReactiveFlags.IS_REACTIVE]
}

// 判断一个数据对象是否是readonly
export function isReadonly(dataObj) { 
  return !!dataObj[ReactiveFlags.IS_READONLY]
}
// 判断一个数据对象是否是Proxy代理对象
export function isProxy(target) { 
  return isReactive(target)||isReadonly(target)
}