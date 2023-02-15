// 将组件转化为虚拟节点vnode
export function createVNode(type, props?, children?) {
  // 虚拟节点
  const vnode = {
    type,
    props,
    children
  }
  return vnode
}