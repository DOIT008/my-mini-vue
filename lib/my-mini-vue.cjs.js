'use strict';

// 判断是否是对象
function isObject(value) {
    return value !== null && typeof value === "object";
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
    };
    return component;
}
function setupComponentInstance(instance) {
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const Component = instance.type;
    const { setup } = Component;
    if (setup) {
        // 可能是个函数(将其当作render函数)，可能是object，就是数据
        const setupResult = setup();
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
    // 判断vnode是否是element，如果是element就处理element，如果是component就处理component
    // 处理组件
    console.log(vnode.type);
    if (typeof vnode.type === 'string') {
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { props, children, type } = vnode;
    const el = document.createElement(type);
    // children有两种形态，一种是string，一种是array
    if (typeof children === 'string') {
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // 递归
        mountChildren(vnode, el);
    }
    function mountChildren(vnode, container) {
        vnode.children.forEach(child => {
            patch(child, container);
        });
    }
    // 处理props，循环遍历设置属性
    for (const key in props) {
        el.setAttribute(key, props[key]);
    }
    container.appendChild(el);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode);
    setupComponentInstance(instance);
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const subTree = instance.render();
    // vnode->patch
    // vnode->element->mountElement
    patch(subTree, container);
}

// 将组件转化为虚拟节点vnode
function createVNode(type, props, children) {
    // 虚拟节点
    const vnode = {
        type,
        props,
        children
    };
    return vnode;
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

exports.createApp = createApp;
exports.h = h;
