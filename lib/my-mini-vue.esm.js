const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    // 虚拟节点
    const vnode = {
        type,
        props,
        shapeFlag: getShapeFlags(type),
        children,
        key: props && props.key,
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
const EMPTY_OBJ = {};
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

// 最长递增子序列
function getSequence(arr) {
  const p = [];
  const result = [0]; //  存储最长增长子序列的索引数组
  let i, j, start, end, mid;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1]; 
      if (arr[j] < arrI) { 
      //  如果arr[i] > arr[j], 当前值比最后一项还大，可以直接push到索引数组(result)中去
        p[i] = j; //  p记录的当前位置下，前一项的索引值
        result.push(i);
        continue
      }
      // 二分法查找和arrI值接近的数
      start = 0; 
      end = result.length - 1;
      while (start < end) {
        mid = ((start + end) / 2) | 0;
        if (arr[result[mid]] < arrI) {
          start = mid + 1;
        } else {
          end = mid;
        }
      }
      if (arrI < arr[result[start]]) {
        if (start > 0) {
          p[i] = result[start - 1];   // 记录当前位置下，替换位置的前一项的索引值
        }
        // 替换该值
        result[start] = i;                   
      }
    }
  }
  // 通过数组p，修正最长递增子序列对应的值
  start = result.length;
  end = result[start - 1];
  while (start-- > 0) {  
    result[start] = end;
    end = p[end];                        
  }
  return result
}

// 创建渲染器
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    function render(vnode, container) {
        // patch
        patch(null, vnode, container, null, null);
    }
    function patch(n1, n2, container, parentComponent, anchor) {
        // n1:老节点，n2：新节点
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = n2.el = document.createTextNode(children);
        container.appendChild(textNode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log("🪶 ~ file: renderer.ts:55 ~ patchElement ~ n2:", n2);
        console.log("🪶 ~ file: renderer.ts:55 ~ patchElement ~ n1:", n1);
        // props
        // children
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const preShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        // 新的是文本
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (preShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 1. 把老的 children 清空
                unMountChildren(n1.children);
            }
            if (c1 !== c2) {
                // 2. 设置text
                hostSetElementText(container, c2);
            }
        }
        else {
            // 新的是数组
            if (preShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 清空文本节点
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        // 双端对比，先左侧，后右侧，再中间
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        //  左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        //  从右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
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
                    i++;
                }
            }
        }
        else if (i > e2) {
            // (a b) c---->(a b),新的比老的少，删除
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
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
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 查找
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; j < e2; j++) {
                        if (isSameVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
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
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (i !== increasingNewIndexSequence[j]) {
                        console.log('移动位置');
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    // 判断两个元素是否相等
    function isSameVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    function unMountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const element = children[i].el;
            hostRemove(element);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                for (const key in oldProps) {
                    // 如果老的key在新的里面没有就删除
                    if (!(key in newProps)) {
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // 处理props，循环遍历设置属性
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        //canvas设置属性： el.x = 10;
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach(child => {
            patch(null, child, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor);
    }
    function mountComponent(initialVnode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVnode, parentComponent);
        setupComponent(instance);
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        effect(() => {
            if (!instance.isMounted) {
                console.log('初始化');
                const { proxy } = instance;
                const subTree = (instance.subTree = instance.render.call(proxy));
                // vnode->patch
                // vnode->element->mountElement
                patch(null, subTree, container, instance, anchor);
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
                patch(prevSubTree, subTree, container, instance, anchor);
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
// 删除元素
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(container, text) {
    container.textContent = text;
}
function patchProp(el, key, prevVal, nextVal) {
    //  on + Event name的形式，比如onClick，onMousemove，onMousedown...
    //     判断是否符合上述模式
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase(); // onClick->click
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, container, anchor) {
    container.insertBefore(el, anchor || null);
}
const renderer = createRenderer({ createElement, patchProp, insert, remove, setElementText });
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
