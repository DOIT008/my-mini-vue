export function initSlots(instance, children) {
  // instance.slots = Array.isArray(children) ? children : [children];
  normalizeObjectSlots(instance.slots, children);
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
