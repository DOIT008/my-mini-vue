// 将组件转化为虚拟节点vnode
import { ShapeFlags } from "../shared/shapeFlags";
export function createVNode(type, props?, children?) {
  // 虚拟节点
  const vnode = {
    type,
    props,
    shapeFlag:getShapeFlags(type), // 判断当前节点vnode类型
    children,
    el:null
  }
  // 判断chlidren类型
  if (typeof children === 'string') {
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
  } else if (Array.isArray(children)) { 
    vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
  }
  return vnode
}

function getShapeFlags(type: any) {
  return typeof type === "string" ? ShapeFlags.ELEMENT:ShapeFlags.STATEFUL_COMPONENT
}
