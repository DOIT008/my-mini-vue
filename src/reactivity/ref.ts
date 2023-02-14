import { hasChanged } from "@/shared";
import { trackEffects,triggerEffects,isTracking } from "./effect";

class RwfImpl { 
  private _value: any;
  public dep;
  constructor(value) { 
    this._value = value
    this.dep = new Set()
  }
  get value() { 
    // 收集依赖,如果有activeEffect的时候才收集
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    // 如果 新旧值相等就不用触发依赖了，也就不用触发fn了，不相等才进行触发依赖
    if (hasChanged(newValue, this._value)) { 
      // 修改数据
      this._value = newValue
      // 触发依赖
      triggerEffects(this.dep)
    }
    
  }
}

function trackRefValue(ref) {
  if (isTracking()) { 
    trackEffects(ref.dep)
  }
 }

export function ref(value) { 
  // const data = ref(1), data.value ,所以返回的应该是一个对象，那么我们就创建一个对象
  let dataObj = new RwfImpl(value);
  return dataObj
}