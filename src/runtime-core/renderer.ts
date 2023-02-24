import { effect } from "@/reactivity/effect";
import { EMPTY_OBJ } from "@/shared";
import { ShapeFlags } from "@/shared/shapeFlags";
import { createComponentInstance, setupComponent } from "./component"
import { createAppApi } from "./createApp";
import { Fragment, Text } from "./vnode";
import { getSequence } from "../../getSequence.js";
import { shouldUpdateComponent } from "./componentUpdateUtils";
import { queueJobs } from "./scheduler";

// 创建渲染器
export function createRenderer(options) {
  const { createElement:hostCreateElement, patchProp:hostPatchProp,  insert:hostInsert,remove:hostRemove,setElementText:hostSetElementText } = options
  function render(vnode, container) {
    // patch
    patch(null,vnode, container, null,null)
  }



  function patch(n1, n2, container, parentComponent,anchor) {
    // n1:老节点，n2：新节点
    const { shapeFlag, type } = n2;
    switch (type) {
      case Fragment:
        processFragment(n1,n2, container, parentComponent,anchor)
        break;
      case Text:
        processText(n1,n2, container)
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1,n2, container, parentComponent,anchor)
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1,n2, container, parentComponent,anchor)
        }
        break;
    }
  
  }
  function processText(n1,n2: any, container: any) {
    const { children } = n2;
    const textNode = n2.el = document.createTextNode(children);
    container.appendChild(textNode)
  }
  function processFragment(n1,n2: any, container: any, parentComponent,anchor) {
    mountChildren(n2.children, container, parentComponent,anchor)
  }

  function processElement(n1, n2: any, container: any, parentComponent,anchor) {
    if (!n1) {
      mountElement(n2, container, parentComponent,anchor)
    } else { 
      patchElement(n1, n2, container,parentComponent,anchor)
    }
  }

  function patchElement(n1, n2: any, container,parentComponent,anchor) { 
    // props
    // children
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    const el = (n2.el = n1.el);
    patchChildren(n1, n2,el,parentComponent,anchor);
    patchProps(el,oldProps, newProps)
  }
  function patchChildren(n1, n2,container,parentComponent,anchor) {
    const preShapeFlag = n1.shapeFlag;
    const c1 = n1.children;
    const { shapeFlag } = n2;
    const c2 = n2.children;
    // 新的是文本
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
      // 新的是数组
      if (preShapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 清空文本节点
        hostSetElementText(container, '');
        mountChildren(c2, container, parentComponent,anchor)
      } else { 
        // array diff array
        patchKeyedChildren(c1,c2,container, parentComponent,anchor)
      }
    }
  }


  function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) { 
    const l2 = c2.length
    // 双端对比，先左侧，后右侧，再中间
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    //  左侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVNodeType(n1,n2)) {
        patch(n1,n2,container, parentComponent,parentAnchor)
      } else {
        break
      }
      i++;
    }
    //  从右侧对比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, parentComponent,parentAnchor)
      } else { 
        break
      }
      e1--;
      e2--;
    }
     /**
     * 新的比老的多，创建
     *  （a b） 
     *  c（a b）     
     *   */
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : null;
        while (i <= e2) {
          patch(null, c2[i], container, parentComponent, anchor);
          i++
        }
      }
    } else if (i > e2) {
      // (a b) c---->(a b),新的比老的少，删除
      while (i <= e1) {
        hostRemove(c1[i].el);
        i++
      }
    } else { 
      // 中间对比
      let s1 = i;
      let s2 = i;
      const toBePatched = e2 - s2 + 1;
      let patched = 0;
      // 建立映射表
      const keyToNewIndexMap = new Map();
      const newIndexToOldIndexMap = new Array(toBePatched);
      let moved = false;
      let maxNewIndexSoFar = 0;
      for (let i = 0; i < toBePatched; i++){
        newIndexToOldIndexMap[i] = 0;
      }
      

      for (let i = s2; i <= e2; i++){
        const nextChild = c2[i]
        keyToNewIndexMap.set(nextChild.key, i)
      }
      for (let i = s1; i <= e1; i++){
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          hostRemove(prevChild.el);
          continue;
        }
        // 查找
        let newIndex;
        if (prevChild.key !== null) {
          newIndex = keyToNewIndexMap.get(prevChild.key)
        } else { 
          for (let j = s2; j <= e2; j++) {
            if (isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          } 
        }
        if (newIndex===undefined) { 
          hostRemove(prevChild.el);
        } else {
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          patch(prevChild, c2[newIndex], container, parentComponent, null);
          patched++;
        }
      }

      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
      let j = increasingNewIndexSequence.length - 1;
      for (let i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = i + s2;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, parentComponent, anchor)
        }else if (moved) {
          if (i !== increasingNewIndexSequence[j]) {
            console.log('移动位置');
            hostInsert(nextChild.el, container, anchor);
          } else {
            j--;
          }
        }
      }
    }
  }
  // 判断两个元素是否相等
  function isSameVNodeType(n1, n2) {
    return n1.type === n2.type&&n1.key===n2.key;
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
  
  function mountElement(vnode: any, container: any, parentComponent,anchor) {
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
      mountChildren(vnode.children, el, parentComponent,anchor)
    }
    // 处理props，循环遍历设置属性
    for (const key in props) {
      const val = props[key];
      hostPatchProp(el, key,null, val)
    }
    //canvas设置属性： el.x = 10;
    hostInsert(el, container,anchor)
  }

  function mountChildren(children, container, parentComponent,anchor) {
    children.forEach(child => {
      patch(null,child, container, parentComponent,anchor)
    })
  }
  function processComponent(n1,n2: any, container: any, parentComponent,anchor) {
    if (!n1) {
      mountComponent(n2, container, parentComponent, anchor)
    } else { 

      updateComponent(n1, n2);
    }
   
  }
  // 更新组件
  function updateComponent(n1, n2) {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2)) {
      instance.next = n2;
      instance.update()
    } else { 
      n2.el = n1.el;
      n2.vnode =n2
    }
  }
  

  function mountComponent(initialVnode: any, container: any, parentComponent,anchor) {
    const instance = (initialVnode.component =createComponentInstance(initialVnode, parentComponent))
    setupComponent(instance)
    setupRenderEffect(instance, initialVnode, container,anchor)
  }

  function setupRenderEffect(instance: any, initialVnode: any, container: any,anchor) {
   instance.update = effect(() => { 
      if (!instance.isMounted) {
        console.log('初始化');
        const { proxy } = instance
        const subTree = (instance.subTree = instance.render.call(proxy))
        // vnode->patch
        // vnode->element->mountElement
        patch(null,subTree, container, instance,anchor)
        // elements->mount
        initialVnode.el = subTree.el;
        instance.isMounted = true
      } else { 
        console.log('update');
        // next,下次要更新的虚拟节点，vnode：更新之前的虚拟节点
        const { next, vnode } = instance;
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance,next)
        }
        const { proxy } = instance
        const subTree = instance.render.call(proxy);
        const prevSubTree = instance.subTree;
        // 更新subtree
        instance.subTree = subTree
        patch(prevSubTree,subTree, container, instance,anchor)
      }
   }, {
     scheduler() { 
       console.log('updater-scheduler');
       queueJobs(instance.update)
     }
   })
  }
  return {
    createApp:createAppApi(render)
  }
}

function updateComponentPreRender(instance, nextVNode) {
  instance.vnode = nextVNode;
  instance.next = null;
  instance.props = nextVNode.props
}




