const ELEMENT_TYPE = {
    TEXT_ELEMENT: 'text_element'
}

// 判断是否是属性
const isProperty = propertyKey => propertyKey !== 'children';

// 创建文本对象
function createTextElement(text) {
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
function createElement(type, props, ...children) {
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

// ! 2. 渲染DOM
function render(elements, container) {
    // render内容
    // 创建dom结点
    const dom = elements.type === ELEMENT_TYPE.TEXT_ELEMENT
        ? document.createTextNode(elements.props.nodeValue)
        : document.createElement(elements.type); // 根据type创建
    // todo 挂载属性
    Object.keys(elements.props).filter(isProperty).forEach(name => {
        dom[name] = elements.props[name];
    });

    // 循环渲染子节点
    elements.props.children.forEach(child => {
        render(child, dom);
    });

    container.appendChild(dom);
}

// 总导出包
export default {
    createElement,
    render
}


