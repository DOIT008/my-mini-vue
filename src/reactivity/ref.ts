import { trackEffects,triggerEffects,isTracking } from "./effect";

class RwfImpl { 
  private _value: any;
  public dep;
  constructor(value) { 
    this._value = value
    this.dep = new Set()
  }
  get value() { 
    // 收集依赖,
    if (isTracking()) { 
      trackEffects(this.dep)
    }
    return this._value
  }
  set value(newValue) { 
    // 修改数据
    this._value = newValue
    // 触发依赖
    triggerEffects(this.dep)
  }
}


export function ref(value) { 
  // const data = ref(1), data.value ,所以返回的应该是一个对象，那么我们就创建一个对象
  let dataObj = new RwfImpl(value);
  return dataObj
}