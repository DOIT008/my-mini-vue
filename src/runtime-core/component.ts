import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
export function createComponentInstance(vnode) { 
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    el:null
  }
  return component
}

export function setupComponentInstance(instance) { 
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  // 设置代理数据
  instance.proxy = new Proxy({
    _:instance
  }, PublicInstanceProxyHandlers)
  const { setup } = Component;
  if (setup) { 
    // 可能是个函数(将其当作render函数)，可能是object，就是数据
    const setupResult = setup()
    handlerSetupResult(instance,setupResult)
  }
}
function handlerSetupResult(instance,setupResult: any) {
  // 可能是个函数(将其当作render函数)，可能是object，就是数据
  if (typeof setupResult === "object") {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  instance.render = Component.render
}

