export function createComponentInstance(vnode) { 
  const component = {
    vnode,
    type: vnode.type,
  }
  return component
}

export function setupComponentInstance(instance) { 
  // initProps()
  // initSlots()
  setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
  const Component = instance.type;
  const { setup } = Component;
  if (setup) { 
    // 可能是个函数(将其当作render函数)，可能是object，就是数据
    const setupResult = setup()
    handlerSetupResult(instance,setupResult)
  }
}
function handlerSetupResult(instance,setupResult: any) {
  // 可能是个函数(将其当作render函数)，可能是object，就是数据
  if (typeof setupResult === "object") {
    instance.setupState = setupResult
  }
  finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
  const Component = instance.type;
  if (Component.render) { 
     instance.render = Component.render
  }
}

