import { effect } from "@/reactivity/effect";
import { EMPTY_OBJ } from "@/shared";
import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";

// 创建渲染器
export function createRenderer(options) {
  const { createElement:hostCreateElement, patchProp:hostPatchProp,  insert:hostInsert,remove:hostRemove,setElementText:hostSetElementText } = options
  function render(vnode, container) {
    // patch
    patch(null,vnode, container, null)
  }



  function patch(n1, n2, container, parentComponent) {
    // n1:老节点，n2：新节点
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1,n2, container, parentComponent)
        break;
      case Text:
        processText(n1,n2, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2, container, parentComponent)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1,n2, container, parentComponent)
        }
        break;
    }
  
  }
  function processText(n1,n2: any, container: any) {
    const { children } = n2;
    const textNode = n2.el = document.createTextNode(children);
    container.appendChild(textNode)
  }
  function processFragment(n1,n2: any, container: any, parentComponent) {
    mountChildren(n2.children, container, parentComponent)
  }

  function processElement(n1, n2: any, container: any, parentComponent) {
    if (!n1) {
      mountElement(n2, container, parentComponent)
    } else { 
      patchElement(n1, n2, container,parentComponent)
    }
  }

  function patchElement(n1, n2: any, container,parentComponent) { 
    console.log("🪶 ~ file: renderer.ts:55 ~ patchElement ~ n2:", n2)
    console.log("🪶 ~ file: renderer.ts:55 ~ patchElement ~ n1:", n1)
    // props
    // children
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    const el = (n2.el = n1.el);
    patchChildren(n1, n2,el,parentComponent);
    patchProps(el,oldProps, newProps)
  }
  function patchChildren(n1, n2,container,parentComponent) {
    const preShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (preShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 1. 把老的 children 清空
        unMountChildren(n1.children)
      };
      if (c1 !== c2) {
        // 2. 设置text
        hostSetElementText(container, c2);
      }
    } else { 
      if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 清空文本节点
        hostSetElementText(container, '');
        mountChildren(c2, container, parentComponent)
      }
    }
  }

  function unMountChildren(children) {
    for (let i = 0; i < children.length; i++) {
      const element = children[i].el;
      hostRemove(element)
    }
  }

  function patchProps(el, oldProps: any, newProps: any) {
    if (oldProps !== newProps) { 
      for (const key in newProps) {
        const prevProp = oldProps[key];
        const nextProp = newProps[key];
        if (prevProp !== nextProp) { 
          hostPatchProp(el,key, prevProp, nextProp)
        }
      }
      if (oldProps !== EMPTY_OBJ) { 
        for (const key in oldProps) {
          // 如果老的key在新的里面没有就删除
          if (!(key in newProps)) {
            hostPatchProp(el,key, oldProps[key], null)
    
          }
        }
      }
      
    }
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
      mountChildren(vnode.children, el, parentComponent)
    }
    // 处理props，循环遍历设置属性
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key,null, val)
    }
    //canvas设置属性： el.x = 10;
    hostInsert(el, container)
  }

  function mountChildren(children, container, parentComponent) {
    children.forEach(child => {
      patch(null,child, container, parentComponent)
    })
  }
  function processComponent(n1,n2: any, container: any, parentComponent) {
    mountComponent(n2, container, parentComponent)
  }

  function mountComponent(initialVnode: any, container: any, parentComponent) {
    const instance = createComponentInstance(initialVnode, parentComponent)
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container)
  }

  function setupRenderEffect(instance: any, initialVnode: any, container: any) {
    effect(() => { 
      if (!instance.isMounted) {
        console.log('初始化');
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode->patch
        // vnode->element->mountElement
        patch(null,subTree, container, instance)
        // elements->mount
        initialVnode.el = subTree.el;
        instance.isMounted = true
      } else { 
        console.log('update');
        const { proxy } = instance
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        // 更新subtree
        instance.subTree = subTree
        patch(prevSubTree,subTree, container, instance)
      }
    })
  }
  return {
    createApp:createAppApi(render)
  }
}




