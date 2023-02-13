export const extend = Object.assign
// 判断是否是对象
export function isObject(value) { 
  return value !== null&&typeof value === "object"
}