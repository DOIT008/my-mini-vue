// 判断是否是对象
function isObject(value) {
    return value !== null && typeof value === "object";
}
// 判断一个对象obj,是否有属性key
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * 收集依赖的函数
 * target：数据对象
 * key：对象属性
 *  */
// 为啥要有两个参数呢，是因为每个属性就是一个数据，每个数据都对应着一个依赖，不然就没办法做响应式了
const targetMap = new Map();
function track(target, key) {
    // 不能重复，所以选择Set,也就是target->key->dep
    // 这里的depsMap应该装的是该对象target中所有key的依赖
    let depsMap = targetMap.get(target);
    // 初始化时没有dep，需要创建一个
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    // 没有dep就创建一个
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    return;
}
// 遍历所有的dep中所有的依赖并执行
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
// 封装get
function createGetter(isReadonly = false, shallow = false) {
    return function (target, key) {
        if (key === "_is_reactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_is_readonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        // 这里的target就是数据对象，key就是属性key
        let res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        //依赖收集
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
// 封装set
function createSetter() {
    return function (target, key, value) {
        let res = Reflect.set(target, key, value);
        // 触发依赖,遍历之前收集到的依赖，执行每一个fn
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`${key} set失败，因为target是readonly`, target);
        return true;
    },
};
const shallowReadonlyHandlers = {
    get: shallowReadonlyGet,
    set(target, key, value) {
        console.warn(`${key} set失败，因为target是readonly`, target);
        return true;
    },
};

function reactive(dataObj) {
    return createActiveObject(dataObj, mutableHandlers);
}
function readonly(target) {
    return createActiveObject(target, readonlyHandlers);
}
function shallowReadonly(target) {
    return createActiveObject(target, shallowReadonlyHandlers);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        return console.log(`target,${target}必须是一个对象`);
    }
    return new Proxy(target, baseHandlers);
}

function initProps(intstance, props) {
    intstance.props = props || {};
}

const PublicPropertiesMap = {
    "$el": (i) => i.vnode.el
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // key->$el
        const publicGetter = PublicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null,
        props: {}
    };
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 设置代理数据
    instance.proxy = new Proxy({
        _: instance
    }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // 可能是个函数(将其当作render函数)，可能是object，就是数据
        const setupResult = setup(shallowReadonly(instance.props));
        handlerSetupResult(instance, setupResult);
    }
}
function handlerSetupResult(instance, setupResult) {
    // 可能是个函数(将其当作render函数)，可能是object，就是数据
    if (typeof setupResult === "object") {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}

function render(vnode, container) {
    // patch
    patch(vnode, container);
}
function patch(vnode, container) {
    // shapeFlags，标识当前虚拟节点的类型，element？component？。。。
    // 处理组件
    // 判断vnode是否是element，如果是element就处理element，如果是component就处理component
    console.log(vnode.type);
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // vnode->element->div
    const { props, children, type, shapeFlag } = vnode;
    const el = (vnode.el = document.createElement(type));
    // children有两种形态，一种是string，一种是array
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // text_children
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        // array_children
        // 递归
        mountChildren(vnode, el);
    }
    // 处理props，循环遍历设置属性
    for (const key in props) {
        const val = props[key];
        console.log(key);
        // on + Event name的形式，比如onClick，onMousemove，onMousedown...
        // 判断是否符合上述模式
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase(); // onClick->click
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.appendChild(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach(child => {
        patch(child, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode->patch
    // vnode->element->mountElement
    patch(subTree, container);
    // elements->mount
    initialVnode.el = subTree.el;
}

function createVNode(type, props, children) {
    // 虚拟节点
    const vnode = {
        type,
        props,
        shapeFlag: getShapeFlags(type),
        children,
        el: null
    };
    // 判断chlidren类型
    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
function getShapeFlags(type) {
    return typeof type === "string" ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 1. component->vnode,所有的一切操作都是基于vnode的
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
