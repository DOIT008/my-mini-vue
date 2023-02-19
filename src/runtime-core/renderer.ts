import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

// 创建渲染器
export function createRenderer(options) {
  const { createElement:hostCreateElement, patchProp:hostPatchProp,  insert:hostInsert } = options
  function render(vnode, container) {
    // patch
    patch(vnode, container, null)
  }



  function patch(vnode, container, parentComponent) {
    // shapeFlags，标识当前虚拟节点的类型，element？component？。。。
    // 处理组件
    // 判断vnode是否是element，如果是element就处理element，如果是component就处理component
    console.log(vnode.type);
    // Fragment——>只渲染children
    const { shapeFlag, type } = vnode;
    switch (type) {
      case Fragment:
        processFragment(vnode, container, parentComponent)
        break;
      case Text:
        processText(vnode, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(vnode, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(vnode, container, parentComponent)
        }
        break;
    }
  
  }
  function processText(vnode: any, container: any) {
    const { children } = vnode;
    const textNode = vnode.el = document.createTextNode(children);
    container.appendChild(textNode)
  }
  function processFragment(vnode: any, container: any, parentComponent) {
    mountChildren(vnode, container, parentComponent)
  }

  function processElement(vnode: any, container: any, parentComponent) {
    mountElement(vnode, container, parentComponent)
  }

  function mountElement(vnode: any, container: any, parentComponent) {
    // vnode->element->div
    const { props, children, type, shapeFlag } = vnode
    // canvas
    // new Element()
    const el = (vnode.el = hostCreateElement(type));
    // children有两种形态，一种是string，一种是array
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      // text_children
      el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      // array_children
      // 递归
      mountChildren(vnode, el, parentComponent)
    }
    // 处理props，循环遍历设置属性
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key, val)
    }
    //canvas设置属性： el.x = 10;
    hostInsert(el, container)
  }

  function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach(child => {
      patch(child, container, parentComponent)
    })
  }
  function processComponent(vnode: any, container: any, parentComponent) {
    mountComponent(vnode, container, parentComponent)
  }

  function mountComponent(initialVnode: any, container: any, parentComponent) {
    const instance = createComponentInstance(initialVnode, parentComponent)
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container)
  }

  function setupRenderEffect(instance: any, initialVnode: any, container: any) {
    const { proxy } = instance
    const subTree = instance.render.call(proxy)
    // vnode->patch
    // vnode->element->mountElement
    patch(subTree, container, instance)
    // elements->mount
    initialVnode.el = subTree.el
  }
  return {
    createApp:createAppApi(render)
  }
}


