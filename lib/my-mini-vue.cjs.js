'use strict';

const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
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
    // 判断children是不是slot children
    // 组件类型+ children 必须是object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function getShapeFlags(type) {
    return typeof type === "string" ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}
// 处理文本节点
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === "function") {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

const extend = Object.assign;
// 判断是否是对象
function isObject(value) {
    return value !== null && typeof value === "object";
}
// 判断两个值是否相等
function hasChanged(newValue, oldValue) {
    return !Object.is(newValue, oldValue);
}
// 判断一个对象obj,是否有属性key
function hasOwn(obj, key) {
    return Object.prototype.hasOwnProperty.call(obj, key);
}
// add->Add
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
// add->onAdd
function toHandleKey(str) {
    return str ? 'on' + capitalize(str) : '';
}
// add-foo--->addFoo
function calmlize(str) {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
}

// 声明一个变量，以便拿到 _effect
let activeEffect;
// 要不要进行依赖收集
let shouldTrack = false;
class ReactiveEffect {
    // 为啥加public，为了在实例上能拿到该参数
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.active = true; // 是否清空，清空后是false
        this.deps = []; // 存储所有的dep
        this._fn = fn;
    }
    run() {
        if (!this.active) {
            return this._fn();
        }
        // 当执行run的时候，这里的this就是ReactiveEffect实例，说白了就是下面的_effect
        activeEffect = this;
        shouldTrack = true;
        const result = this._fn();
        // reset
        shouldTrack = false;
        return result;
    }
    stop() {
        // 未清空时再执行清空操作，防止重复清空
        if (this.active) {
            // 遍历所有的dep，找到当前的activeEffectye（也就是dep），删除即可
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
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
    if (!activeEffect)
        return;
    if (!shouldTrack)
        return;
    trackEffects(dep);
}
function trackEffects(dep) {
    // 如果曾经搜集过当前的依赖就不用重新收集了
    if (dep.has(activeEffect))
        return;
    // 收集的是activeEffect实例
    dep.add(activeEffect);
    // 收集一下所有的dep
    activeEffect.deps.push(dep);
}
// 副作用,当effect执行的时候，其内部的函数fn也会执行
function effect(fn, option = {}) {
    // activeEffect没有的时候就不收集依赖
    if (isTracking())
        return;
    const scheduler = option.scheduler;
    // 被收集的对象,为啥是它呢，是因为它上面有run方法，可以修改数据？
    const _effect = new ReactiveEffect(fn, scheduler);
    // 将传入的onStop，传给effect实例
    // _effect.onStop = option.onStop
    extend(_effect, option);
    // 调用这个的时候已经返回foo
    _effect.run();
    // 其实返回的就是run方法，为啥要这么写，是为了处理run内部的this指向
    const runner = _effect.run.bind(_effect);
    // 以便在外面的函数访问当前的_effect实例,runner.effect变成了_effect实例
    runner.effect = _effect;
    return runner;
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
//  ？？
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
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

// ref，接收的一般都是基础类型的数据，为啥要包裹成对象，是为了搜集和触发依赖的需要，get—>track，set->trigger
class RwfImpl {
    constructor(value) {
        this._v_isRef = true;
        this._rawValue = value;
        // 如果value是对象->reactive(value)，否则就直接取value
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        // 收集依赖,如果有activeEffect的时候才收集
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 如果 新旧值相等就不用触发依赖了，也就不用触发fn了，不相等才进行触发依赖
        // 如果传的是对象，那么对比的新旧对比的时候也都应该是普通对象
        if (hasChanged(newValue, this._rawValue)) {
            // 修改数据
            this._rawValue = newValue;
            this._value = convert(newValue);
            // 触发依赖
            triggerEffects(this.dep);
        }
    }
}
// 转换数据
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
function ref(value) {
    // const data = ref(1), data.value ,所以返回的应该是一个对象，那么我们就创建一个对象
    let dataObj = new RwfImpl(value);
    return dataObj;
}
// isRef，判断数据是不是ref()类型的数据
function isRef(ref) {
    return !!ref._v_isRef;
}
// 返回数据的值（value）
function unRef(ref) {
    // 如果是ref数据，返回ref.value,否则返回本身
    return isRef(ref) ? ref.value : ref;
}
// proxyRefs
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // get->ref(age)->返回.value即可，如果不是直接返回值本身即可
            return unRef(Reflect.get(target, key));
        },
        set(target, key, newValue) {
            // set->ref->修改.value，如果不是ref数据
            if (isRef(target[key]) && !isRef(newValue)) {
                return target[key].value = newValue;
            }
            else {
                return Reflect.set(target, key, newValue);
            }
        }
    });
}

function emit(instance, eventName, ...args) {
    // return 
    // console.log(eventName);
    const { props } = instance;
    console.log('emit', eventName);
    // TPP
    // 先写一个特定的行为==>再重构成通用行为
    const handleName = toHandleKey(calmlize(eventName));
    const handler = props[handleName];
    handler && handler(...args);
}

function initProps(intstance, props) {
    intstance.props = props || {};
}

const PublicPropertiesMap = {
    "$el": (i) => i.vnode.el,
    "$slots": (i) => i.slots
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

function initSlots(instance, children) {
    // instance.slots = Array.isArray(children) ? children : [children];
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(instance.slots, children);
    }
}
function normalizeObjectSlots(slots, children) {
    for (const key in children) {
        const val = children[key];
        slots[key] = (props) => normalizeSlotValue(val(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        el: null,
        props: {},
        isMounted: false,
        slots: {},
        subTree: {},
        parent,
        provides: parent ? parent.provides : {},
        emit: () => { }
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
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
        // 赋值
        setCurrentInstance(instance);
        // 可能是个函数(将其当作render函数)，可能是object，就是数据
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        // 清空
        setCurrentInstance(null);
        handlerSetupResult(instance, setupResult);
    }
}
function handlerSetupResult(instance, setupResult) {
    // 可能是个函数(将其当作render函数)，可能是object，就是数据
    if (typeof setupResult === "object") {
        instance.setupState = proxyRefs(setupResult);
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    instance.render = Component.render;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, val) {
    // 存
    const instance = getCurrentInstance();
    if (instance) {
        let { provides } = instance;
        const parentProvides = instance.parent.provides;
        // 初始化
        if (provides === parentProvides) {
            provides = instance.provides = Object.create(parentProvides);
        }
        provides[key] = val;
    }
}
function inject(key, defaultValue) {
    // 取
    const instance = getCurrentInstance();
    if (instance) {
        // providers[key] = val
        const parentProvides = instance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppApi(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 1. component->vnode,所有的一切操作都是基于vnode的
                const vnode = createVNode(rootComponent);
                render(vnode, rootContainer);
            },
        };
    };
}

// 创建渲染器
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert } = options;
    function render(vnode, container) {
        // patch
        patch(null, vnode, container, null);
    }
    function patch(n1, n2, container, parentComponent) {
        // n1:老节点，n2：新节点
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = n2.el = document.createTextNode(children);
        container.appendChild(textNode);
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2, container, parentComponent);
    }
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2);
        }
    }
    function patchElement(n1, n2, container) {
        console.log("🪶 ~ file: renderer.ts:55 ~ patchElement ~ n2:", n2);
        console.log("🪶 ~ file: renderer.ts:55 ~ patchElement ~ n1:", n1);
        // props
        // children
    }
    function mountElement(vnode, container, parentComponent) {
        // vnode->element->div
        const { props, children, type, shapeFlag } = vnode;
        // canvas
        // new Element()
        const el = (vnode.el = hostCreateElement(type));
        // children有两种形态，一种是string，一种是array
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // text_children
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // array_children
            // 递归
            mountChildren(vnode, el, parentComponent);
        }
        // 处理props，循环遍历设置属性
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, val);
        }
        //canvas设置属性： el.x = 10;
        hostInsert(el, container);
    }
    function mountChildren(vnode, container, parentComponent) {
        vnode.children.forEach(child => {
            patch(null, child, container, parentComponent);
        });
    }
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    function mountComponent(initialVnode, container, parentComponent) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container);
    }
    function setupRenderEffect(instance, initialVnode, container) {
        effect(() => {
            if (!instance.isMounted) {
                console.log('初始化');
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode->patch
                // vnode->element->mountElement
                patch(null, subTree, container, instance);
                // elements->mount
                initialVnode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                console.log('update');
                const { proxy } = instance;
                const subTree = instance.render.call(proxy);
                const prevSubTree = instance.subTree;
                // 更新subtree
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppApi(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, val) {
    //  on + Event name的形式，比如onClick，onMousemove，onMousedown...
    //     判断是否符合上述模式
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase(); // onClick->click
        el.addEventListener(event, val);
    }
    else {
        el.setAttribute(key, val);
    }
}
function insert(el, container) {
    container.append(el);
}
const renderer = createRenderer({ createElement, patchProp, insert });
function createApp(...args) {
    return renderer.createApp(...args);
}

exports.createApp = createApp;
exports.createRenderer = createRenderer;
exports.createTextVNode = createTextVNode;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.ref = ref;
exports.renderSlots = renderSlots;
