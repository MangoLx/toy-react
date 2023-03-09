/*
 * @Author: liangxu liangxu@sparkedu.com
 * @Date: 2023-03-09 17:47:39
 * @LastEditors: liangxu liangxu@sparkedu.com
 * @LastEditTime: 2023-03-09 17:47:41
 * @FilePath: /toy-react/toy-react copy.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { createElement, createDom } from './lib/dom.js';

// ! 3. fiber渲染
function render(element, container) {
    nextUnitOfWork = {
        dom: container,
        props: {
            children: [element]
        }
    };
}

// ! 3. 添加requestIdleCallback拆分执行，react放弃了requestIdleCallback，自己实现了一个requestIdleCallback
let nextUnitOfWork = null; // 下个单元任务

requestIdleCallback(workLoop);

/**
 * @description: 一个处理单元任务，创建当前的真实dom结点，创建同一层的fiber node，返回child或者sibling
 * @param {*} fiber
 * @return {*}
 */
function performUnitOfWork(fiber) {
    // 1. 创建真实dom
    if (!fiber.dom) {
        // 不存在真实dom，创建一个
        fiber.dom = createDom(fiber);
    }
    if (fiber.parent) {
        // 父节点存在，父节点dom加入当前fiber的真实dom
        fiber.parent.dom.appendChild(fiber.dom);
    }
    // 2. 创建构建fiber的子fiber树
    const elements = fiber.props.children;
    let index = 0;
    let prevSibling = null;
    while (index < elements.length) {
        // 创建子节点fiber
        const element = elements[index];

        const newFiber = {
            type: element.type,
            props: element.props,
            dom: null,
            parent: fiber
        };
        // 第一个父节点child指向当前newFiber
        if (index === 0) {
            fiber.child = newFiber;
        } else {
            // 不是第一个，前面的fiber sibling指向newFiber
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }
    // 返回下一个单元任务
    // 如果存在子节点，直接返回子节点
    if (fiber.child) return fiber.child;
    // 不存在子节点找兄弟节点
    let nextFiber = fiber;
    while(nextFiber) {
        // 有兄弟返回兄弟
        if (nextFiber.sibling) return nextFiber.sibling;
        nextFiber = nextFiber.parent; // 没兄弟一直往上回，回到有下个兄弟的fiber
    }
    
}

function workLoop(deadline) {
    // didTimeout 属性用来判断当前的回调函数是否被执行因为回调函数存在过期时间
    // 还剩余多少闲置时间可以用来执行耗时任务timeRemaining()
    let shouldYield = false; // 应该暂停
    while(nextUnitOfWork && !shouldYield) { // 如果下个任务有，且不用暂停，既线程限制
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1; // 设定限制时间小于50ms就表示有任务在执行
    }

    requestIdleCallback(workLoop); // 继续在闲置下执行
}

// 总导出包
export default {
    createElement,
    render
}


