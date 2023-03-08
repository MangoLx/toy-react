import Mango from './toy-react';

const element = Mango.createElement(
    "div",
    { id: "foo" },
    Mango.createElement("a", { href: 'https://www.huohua.cn' }, "bar"),
    Mango.createElement("span")
);

const root = document.querySelector('#root');
Mango.render(element, root);