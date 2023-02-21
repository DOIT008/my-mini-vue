// 将组件转化为虚拟节点vnode
import { ShapeFlags } from "../shared/shapeFlags";
export const Fragment = Symbol("Fragment");
export const Text = Symbol("Text");
export function createVNode(type, props?, children?) {
  // 虚拟节点
  const vnode = {
    type,
    props,
    shapeFlag:getShapeFlags(type), // 判断当前节点vnode类型
    children,
    key:props&&props.key,
    el:null
  }
  // 判断chlidren类型
  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) { 
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
  }


// 判断children是不是slot children
// 组件类型+ children 必须是object
  if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
    if (typeof children === 'object') {
      vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN
    }
  }  

  return vnode
}

function getShapeFlags(type: any) {
  return typeof type === "string" ? ShapeFlags.ELEMENT:ShapeFlags.STATEFUL_COMPONENT
}
// 处理文本节点
export function createTextVNode(text) {
  return createVNode(Text, {},text)
}
