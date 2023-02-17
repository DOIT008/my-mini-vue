import { shallowReadonly } from "@/reactivity/reactive";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
export function createComponentInstance(vnode) { 
  const component = {
    vnode,
    type: vnode.type,
    setupState: {},
    el: null,
    props: {},
    emit: () => { }
  }
  component.emit = emit.bind(null,component) as any
  return component
}

export function setupComponent(instance) { 
  initProps(instance,instance.vnode.props)
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
    const setupResult = setup(shallowReadonly(instance.props), {emit:instance.emit})
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


