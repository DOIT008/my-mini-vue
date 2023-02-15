import { render } from "./renderer"
import { createVNode } from "./vnode"

export function createApp(rootComponent) { 
  return {
    mount(rootContainer) {
      // 1. component->vnode,所有的一切操作都是基于vnode的
      const vnode = createVNode(rootComponent)
      render(vnode,rootContainer)
    },
  }
} 