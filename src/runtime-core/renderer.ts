import { createComponentInstance, setupComponentInstance } from "./component"

export function render(vnode, container) { 
  // patch
  patch(vnode, container)
}

function patch(vnode, container) {
    // 处理组件
  processComponent(vnode,container)
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode,container)
}

function mountComponent(vnode: any,container:any) {
  const instance = createComponentInstance(vnode)
  setupComponentInstance(instance)
  setupRenderEffect(instance,container)
}

function setupRenderEffect(instance:any,container:any) {
  const subTree = instance.render()
  // vnode->patch
  // vnode->element->mountElement
  patch(subTree,container)
}

