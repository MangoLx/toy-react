import Mango from './toy-react.js';

const element = Mango.createElement(
    "div",
    { id: "foo" },
    Mango.createElement("a", { href: 'https://www.huohua.cn' }, "test"),
    Mango.createElement("div", { id: 'second' }, Mango.createElement("h1", {}, "一个h1"))
);

const root = document.querySelector('#root');
Mango.render(element, root);