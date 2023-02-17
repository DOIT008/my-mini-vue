export const extend = Object.assign
// 判断是否是对象
export function isObject(value) { 
  return value !== null&&typeof value === "object"
}

// 判断两个值是否相等
export function hasChanged(newValue, oldValue) {
  return !Object.is(newValue,oldValue)
}
// 判断一个对象obj,是否有属性key
export function hasOwn(obj, key) { 
  return Object.prototype.hasOwnProperty.call(obj,key)
}

  // add->Add
 export function capitalize(str:string){ 
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  // add->onAdd
  export function toHandleKey (str: string){
    return str ? 'on' + capitalize(str) : ''
  };
  // add-foo--->addFoo
  export function calmlize (str){ 
    return str.replace(/-(\w)/g, (_,c:string) => { 
      return c ? c.toUpperCase() : '';
    })
  }