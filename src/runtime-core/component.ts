import { shallowReadonly } from "@/reactivity/reactive";
import { proxyRefs } from "@/reactivity/ref";
import { emit } from "./componentEmit";
import { initProps } from "./componentProps";
import { PublicInstanceProxyHandlers } from "./componentPublicInstance";
import { initSlots } from "./componentSlots";
export function createComponentInstance(vnode, parent) { 
  const component = {
    vnode,
    type: vnode.type,
    next:null, // 下次要更新的虚拟节点
    setupState: {},
    el: null,
    props: {},
    isMounted:false,
    slots: {},
    subTree: {},
    parent,
    provides:parent?parent.provides: {},
    emit: () => { }
  }
  component.emit = emit.bind(null,component) as any
  return component
}

export function setupComponent(instance) { 
  initProps(instance,instance.vnode.props)
  initSlots(instance,instance.vnode.children)
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
    // 赋值
    setCurrentInstance(instance)
    // 可能是个函数(将其当作render函数)，可能是object，就是数据
    const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit })
    // 清空
    setCurrentInstance(null)
    handlerSetupResult(instance,setupResult)
  }
}
function handlerSetupResult(instance,setupResult: any) {
  // 可能是个函数(将其当作render函数)，可能是object，就是数据
  if (typeof setupResult === "object") {
    instance.setupState = proxyRefs(setupResult) 
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (compiler && !Component.render) {
    if (Component.template) {
      Component.render = compiler(Component.template)
    }
  }
  // 
  instance.render = Component.render
}

let currentInstance = null;
export function getCurrentInstance(){ 
  return currentInstance
}

function setCurrentInstance(instance) { 
  currentInstance = instance
}

let compiler;
export function registerRuntimeCompiler(_compiler) { 
  compiler = _compiler
}
