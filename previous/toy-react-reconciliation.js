import { createElement, createDom, updateDom } from '../lib/dom.js';
import { EFFECT_TAG } from '../lib/constants.js';

let nextUnitOfWork = null; // 下个单元任务
let currentRoot = null; // 当前在使用的树
let wipRoot = null; // 保存之前的root，确保之后的渲染
let deletions = null; // 需要删除的结点

requestIdleCallback(workLoop);

// ! 4. Render and Commit Phases
function render(element, container) {
    wipRoot = {
        dom: container,
        props: {
            children: [element]
        },
        alternate: currentRoot
    };
    deletions = [];
    nextUnitOfWork = wipRoot;
}

function commitRoot() {
    // 完成fiber树的构建，提交fiber到dom
    deletions.forEach(commitWork); // 提交删除项目
    commitWork(wipRoot.child);
    currentRoot = wipRoot; // 设定当前使用的树
    wipRoot = null;
}

function commitWork(fiber) {
    if (!fiber) return;
    console.log(fiber);
    const domParent = fiber.parent.dom;
    if (fiber.effectTag === EFFECT_TAG.PLACEMENT && fiber.dom !== null) {
        // 需要重新生成的再挂载
        domParent.appendChild(fiber.dom);
    } else if (fiber.effectTag === EFFECT_TAG.DELETION) {
        // 需要删除的直接删除
        domParent.removeChild(fiber.dom);
    } else if (fiber.effectTag === EFFECT_TAG.UPDATE) {
        // 更新，更新数据
        updateDom(
            fiber.dom,
            fiber.alternate.props,
            fiber.props
        );
    }
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

function workLoop(deadline) {
    // didTimeout 属性用来判断当前的回调函数是否被执行因为回调函数存在过期时间
    // 还剩余多少闲置时间可以用来执行耗时任务timeRemaining()
    let shouldYield = false; // 应该暂停
    while(nextUnitOfWork && !shouldYield) { // 如果下个任务有，且不用暂停，既线程限制
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
        shouldYield = deadline.timeRemaining() < 1; // 设定限制时间小于50ms就表示有任务在执行
    }

    if (!nextUnitOfWork && wipRoot) {
        // 完成fiber树的构建，提交fiber到dom
        commitRoot();
    }

    requestIdleCallback(workLoop); // 继续在闲置下执行
}

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

    // 2. 创建构建fiber的子fiber树
    const elements = fiber.props.children;
    reconcileChildren(fiber, elements); // 构建子fiber树
    
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
    // 进行到此，表示整个树构建完成，下有一个任务为null
    return null;
}

function reconcileChildren(wipFiber, elements) {
    let index = 0;
    let prevSibling = null;
    // 获取之前的fiber node用于对比
    let oldFiber = wipFiber.alternate && wipFiber.alternate.child;
    while (index < elements.length || oldFiber !== null) {
        // 创建子节点fiber
        const element = elements[index];
        let newFiber = null;

        // TODO compare oldFiber to element
        // 整体对比逻辑
        // 1. 如果type也就是结点一样，只更新其中的内容
        // 2. 如果type不同，则需要创建一个新的dom结点
        // 3. 如果没有node但是有旧的fiber，则需要删除就fiber
        // 这里React也使用 key 进行比较。例如，它检测到子元素在元素数组中的位置发生了变化。
        const isSameType = oldFiber && element && element.type === oldFiber.type; // 对比子child

        if (isSameType) {
            // 1. 如果type也就是结点一样，只更新其中的内容
            // 更新属性
            newFiber = {
                type: oldFiber.type, // 类型不变，用以前的
                props: element.props, // 更新属性用最新的
                dom: oldFiber.dom, // 类型不变，用以前的
                parent: wipFiber, // 当前更新的父fiber
                alternate: oldFiber,
                effectTag: EFFECT_TAG.UPDATE, // 打上更新标记
            };
        } else if (element && !isSameType) {
            // 2. 如果type不同，则需要创建一个新的dom结点
            newFiber = {
                type: element.type, // 类型不变，用以前的
                props: element.props, // 更新属性用最新的
                dom: null, // 新的，后续创建
                parent: wipFiber, // 当前更新的父fiber
                alternate: null,
                effectTag: EFFECT_TAG.PLACEMENT, // 打上更新标记
            }
        } else if (oldFiber && !isSameType) {
            // 3. 如果没有node但是有旧的fiber，则需要删除就fiber
            oldFiber.effectTag = EFFECT_TAG.DELETION;
            deletions.push(oldFiber);
        }

        if (oldFiber) {
            oldFiber = oldFiber.sibling;
        }

        // 第一个父节点child指向当前newFiber
        if (index === 0) {
            wipFiber.child = newFiber;
        } else if (element) {
            // 不是第一个，前面的fiber sibling指向newFiber
            prevSibling.sibling = newFiber;
        }
        prevSibling = newFiber;
        index++;
    }
}

// 总导出包
export default {
    createElement,
    render
}


