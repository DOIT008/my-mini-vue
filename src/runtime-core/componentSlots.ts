import { ShapeFlags } from '@/shared/shapeFlags';
export function initSlots(instance, children) {
  // instance.slots = Array.isArray(children) ? children : [children];
  const {vnode} = instance;
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(instance.slots, children);
  }
}

function normalizeObjectSlots(slots,children) {
  for (const key in children) {
    const val = children[key];
    slots[key] = (props)=> normalizeSlotValue(val(props));
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value];
}
