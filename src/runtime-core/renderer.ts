import { isObject } from "@/shared/index";
import { createComponentInstance, setupComponentInstance } from "./component"

export function render(vnode, container) { 
  // patch
  patch(vnode, container)
}

function patch(vnode, container) {
  // 判断vnode是否是element，如果是element就处理element，如果是component就处理component
    // 处理组件
  console.log(vnode.type);
  if (typeof vnode.type === 'string') {
    processElement(vnode,container)
  } else if(isObject(vnode.type)) { 
    processComponent(vnode,container)
  }
}

function processElement(vnode: any, container: any) {
  mountElement(vnode,container)
}

function mountElement(vnode: any, container: any) {
  // vnode->element->div
  const { props, children,type } = vnode
  const el = (vnode.el= document.createElement(type));
  // children有两种形态，一种是string，一种是array
  if (typeof children === 'string') {
    el.textContent = children
  } else if(Array.isArray(children)) { 
    // 递归
    mountChildren(vnode,el)
  }

  function mountChildren(vnode,container) {
    vnode.children.forEach(child => { 
      patch(child,container)
    })
  }
  
  // 处理props，循环遍历设置属性
  for (const key in props) {
    el.setAttribute(key, props[key])
  }
  container.appendChild(el)
}
function processComponent(vnode: any, container: any) {
  mountComponent(vnode,container)
}

function mountComponent(initialVnode: any,container:any) {
  const instance = createComponentInstance(initialVnode)
  setupComponentInstance(instance)
  setupRenderEffect(instance,initialVnode,container)
}

function setupRenderEffect(instance: any,initialVnode:any, container: any) {
  const { proxy } = instance
  const subTree = instance.render.call(proxy)
  // vnode->patch
  // vnode->element->mountElement
  patch(subTree, container)
  // elements->mount
  initialVnode.el = subTree.el
}


