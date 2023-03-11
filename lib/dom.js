import { ELEMENT_TYPE } from './constants.js';
import { isProperty, isNew, isGone } from './tools.js';

// 创建文本对象
export const createTextElement = (text) => {
    return {
        type: ELEMENT_TYPE.TEXT_ELEMENT,
        props: {
            nodeValue: text,
            children: [] // 文本节点不存在子节点
        }
    };
}

// 创建对象
// ! 1. 解析DOM
export const createElement = (type, props, ...children) => {
    return {
        type,
        props: {
            ...props,
            children: children.map(child => (
                typeof child === 'object' ? child : createTextElement(child) // 区分是否是文本节点
            ))
        }
    };
}

// ! 2. 根据fiber信息渲染真实dom
export const createDom = (fiber) => {
    // render内容
    // 创建dom结点
    const dom = fiber.type === ELEMENT_TYPE.TEXT_ELEMENT
        ? document.createTextNode(fiber.props.nodeValue)
        : document.createElement(fiber.type); // 根据type创建
    // 挂载属性
    Object.keys(fiber.props).filter(isProperty).forEach(name => {
        dom[name] = fiber.props[name];
    });

    return dom;
}

export const updateDom = (dom, prevProps, nextProps) => {
    // 移除事件监听
    Object.keys(prevProps)
    .filter(isEvent)
    .filter(
        key =>
            !(key in nextProps) ||
            isNew(prevProps, nextProps)(key)
    ).forEach(name => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
    });

    // 移除不存在的属性
    Object.keys(prevProps)
        .filter(isProperty)
        .filter(isGone(prevProps, nextProps))
        .forEach(name => {
            dom[name] = '';
        });
    
    // 添加新的事件监听
    Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
        const eventType = name.toLowerCase().substring(2)
        dom.addEventListener(eventType, nextProps[name]);
    })

    // 设置新的属性
    Object.keys(nextProps)
        .filter(isProperty)
        .filter(isNew(prevProps, nextProps))
        .forEach(name => {
            dom[name] = nextProps[name];
        });
}