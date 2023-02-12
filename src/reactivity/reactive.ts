import { mutableHandlers,readonlyHandlers } from "./baseHandlers";
export function reactive(dataObj: any) {
  return createActiveObject(dataObj,mutableHandlers);
}

export function readonly(target: any) {
  return createActiveObject(target,readonlyHandlers);
}

function createActiveObject(target,baseHandlers) { 
  return new Proxy(target,baseHandlers)
}