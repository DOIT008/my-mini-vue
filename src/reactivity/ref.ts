import { reactive } from '@/reactivity/reactive';
import { hasChanged, isObject } from "@/shared";
import { trackEffects,triggerEffects,isTracking } from "./effect";

// ref，接收的一般都是基础类型的数据，为啥要包裹成对象，是为了搜集和触发依赖的需要，get—>track，set->trigger
class RwfImpl { 
  private _value: any;
  public dep;
  private _rawValue: any; // 存储原始数据
  public _v_isRef = true;
  constructor(value) { 
    this._rawValue = value;
    // 如果value是对象->reactive(value)，否则就直接取value
    this._value = convert(value);
    this.dep = new Set()
  }
  get value() { 
    // 收集依赖,如果有activeEffect的时候才收集
    trackRefValue(this)
    return this._value
  }
  set value(newValue) {
    // 如果 新旧值相等就不用触发依赖了，也就不用触发fn了，不相等才进行触发依赖
    // 如果传的是对象，那么对比的新旧对比的时候也都应该是普通对象
    if (hasChanged(newValue, this._rawValue)) { 
      // 修改数据
      this._rawValue = newValue;
      this._value = convert(newValue) 
      // 触发依赖
      triggerEffects(this.dep)
    }
  }
}

// 转换数据
function convert(value) { 
  return isObject(value) ? reactive(value) : value 
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


// isRef，判断数据是不是ref()类型的数据
export function isRef(ref) {
  return !!ref._v_isRef
}

// 返回数据的值（value）
export function unRef(ref) { 
  // 如果是ref数据，返回ref.value,否则返回本身
  return isRef(ref)?ref.value:ref
}

// proxyRefs
export function proxyRefs(objectWithRefs) { 
  return new Proxy(objectWithRefs, {
    get(target, key) { 
      // get->ref(age)->返回.value即可，如果不是直接返回值本身即可
      return unRef(Reflect.get(target, key))
    },
    set(target, key, newValue) {
      // set->ref->修改.value，如果不是ref数据
      if (isRef(target[key]) && !isRef(newValue)) {
        return target[key].value = newValue
      } else { 
        return Reflect.set(target, key, newValue)
      }
      
    }
  })
}