import { getCurrentInstance } from "./component";

export function provide(key, val) {
  // 存
  const instance: any = getCurrentInstance();
  if (instance) {
    let { provides } = instance;
    const parentProvides = instance.parent.provides;
    // 初始化
    if (provides === parentProvides) { 
      provides = instance.provides = Object.create(parentProvides)
    }
    provides[key] = val;
  }
}

export function inject(key,defaultValue) {
  // 取
  const instance: any = getCurrentInstance();
  if (instance) {
    // providers[key] = val
    const parentProvides = instance.parent.provides;
    if (key in parentProvides) {
      return parentProvides[key]
    } else if (defaultValue) { 
      if (typeof defaultValue === 'function') { 
        return defaultValue()
      }
      return defaultValue
    }
  }
}
