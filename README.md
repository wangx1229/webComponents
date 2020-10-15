# webComponents

# web Components

### 一、概念和作用

webComponents是一套不同的技术，允许您创建可重用的定制元素（它们的功能封装在您的代码之外）并且在您的web应用中使用它们。它由三项主要技术组成，它们可以一起使用来创建封装功能的定制元素，可以在你喜欢的任何地方重用，不必担心代码冲突。

*   Custom elements（自定义元素）：一组JavaScript API，允许您定义custom elements及其行为，然后可以在您的用户界面中按照需要使用它们。
*   Shadow DOM（影子DOM）：一组JavaScript API，用于将封装的“影子”DOM树附加到元素（与主文档DOM分开呈现）并控制其关联的功能。通过这种方式，您可以保持元素的功能私有，这样它们就可以被脚本化和样式化，而不用担心与文档的其他部分发生冲突。
*   HTML templates（HTML模板）： &lt;template> 和 &lt;slot> 元素使您可以编写不在呈现页面中显示的标记模板。然后它们可以作为自定义元素结构的基础被多次重用。   

### 二、用法

1. custom elements分为：

>* Autonomous custom elements ——独立的元素
>* Customized built-in elements ——基本的HTML元素

        class WordCount extends HTMLParagraphElement {
          constructor() {
            // 必须首先调用 super 方法
            super();

            // 元素的功能代码写在这里 此时this会指向实例，可以接受实例上的属性 可以理解为props
            ...
          }

          connectedCallback() {
            console.log('元素插入的回调');
          }

          disconnectedCallback() {
            console.log('元素删除的回调');
          }

          adoptedCallback() {
            console.log('元素插入的回调');
          }

          attributeChangedCallback(name, oldValue, newValue) {
            console.log('元素属性增删改的回调，类似于props修改');
          }

          static get observedAttributes() {
            console.log('你需要监听的props')
            return ['attr1'];
           }
        }

        // 使用cutom element
        customElements.define('word-count', WordCount);
        <word-count attrA="A">

        // 也可以使用built-in elements
        customElements.define('word-count', WordCount, { extends: "ul" });
        <ul is="word-count"></ul>

2. **shadow dom**

> 上面讲了如何创建一个自定义组件，但是创建的自定义组件并没有内容。如何向组件中添加内容，这就需要用到shadow dom，他是一个独立的dom树，也是一座桥梁，从shadow dom通往外部dom树的桥梁。他会将组件内的代码与组件外的代码很好的隔离，最重要的一点是他内部的样式，只会存在于组件内部，而不会与外部的样式冲突、覆盖。 
 
>  const shadow = elementRef.attachShadow({mode: 'open'}); 将dom与shadow dom连接起来，此时shadow root就是elementRef。'open'和'close'表示是否可以使用elementRef.shadowRoot来读取元素内部的shadow dom

3. templates and slots

        <template id="my-paragraph">
          <style>
            p {
              color: white;
              background-color: #666;
              padding: 5px;
            }
          </style>

          <p>My paragraph</p>
          <p><slot name="my-text">My default text</slot></p>
        </template>

        customElements.define('my-paragraph',
          class extends HTMLElement {
            constructor() {
              super();
              let template = document.getElementById('my-paragraph');
              let templateContent = template.content;

              const shadowRoot = this.attachShadow({mode: 'open'})
                .appendChild(templateContent.cloneNode(true));
          }
        })

        <my-paragraph>
          <span slot="my-text">Let's have some different text!</span>
        </my-paragraph>

> 通过这例子剖析，有三关键点：
1. style标签的用法。他只能在template标签中使用，在普通dom标签中无法使用；他只会作用域当前的shadow dom，不会影响我们自定义元素意外的dom元素的样式，同时也不会被外界的样式所影响，这一点也被看作webComponent最有用功能之一。
2. slot占位符。 使用&lt;slot>+name属性在&lt;templat>中进行定义，在使用自定义元素时，可以在标签中添加slot属性对应模版中的slot内容。
3. Node.cloneNode。使用cloneNode而不是直接使用templateContent，是为了防止节点被修改。

### 三、对比React组件

webComponents和react出发点不一样。webComponents为可复用组件提供了强大的封装，而React则提供了声明式的解决方案，目的是使DOM与数据保持同步。当然react也可以分装服用组件，但是与webComponents还是有很多差异的。

react设计思路是使用virtual-dom和fibers，实现数据驱动视图的更新。先修改virtual-dom，通过diffs算法然后再更新dom元素，所以react的优点:

1. 数据驱动视图的设计。我们所做的，只需要关心数据，react只受到prop和status的影响。

2. 更完整的生命周期。constructor()、static getDerivedStateFromProps()、render()、componentDidMount()、componentDidUpdate()等等。

webComponents的优点：

1. 受浏览器直接支持，而jsx需要有babel-loader才能用。

2. 更好的样式封装行为，不会存在冲突的问题。

### 四、使用web Components和使用其他框架（V A R）

想象一下你在维护不同框架写的代码，大概率会使用到不同的ui库。未来某个时候，为了更加方便维护和性能的优化，你需要升级的你库和使用的框架，那么你的改动很可能会很大。这个时候假如你使用的是webComponent UI库，你完全无需修改，就保持原来的样子就好了。所以使用webComponentUI库时:

1. 跨框架使用——你的 webComponent 可以嵌套入任何框架中使用。

2. 无需升级——当框架或者UI库升级时 webComponent无需修改升级。


### 五、遇到的问题

1. 使用custom-element需要预先定义，customElements.define()方法会在全局进行定义，比较容易发生冲突而覆盖。

2. 使用define()定义时，如果你全部写在class中，需要频繁的操作dom元素，这我们熟悉的当前流行的框架比起来还是很麻烦的，修改数据要比操作dom方便多了

3. 你一定会想到刚才提到的template和slot模版。这种看起来确实是好用。想象你的例子有大量的dom元素，你写好模版，然后使用简单的几句dom方法引入要比你在class中一遍遍的创建dom元素方便多了。可是这就需要你在你的html文件里面预先定义这个temlate模版 通过独特的id或者类名查找到才行，而你的自定义组件定义是需要放在js中的，你可能想到创建一个html文件使用template模版，然后使用script标签，这样一来，每个html文件创建一个你自定义的元素，引入这个html文件就可以使用你的自定义组件了。w3c确实也考虑过这个问题，如何引入html文件[HTML Imports](https://w3c.github.io/webcomponents/spec/imports/),不过目前貌似还在草稿阶段，有兴趣可以自己看。

4. 生命周期。自定组件的生命周期比较少，没有react，vue那么多。用起来只能自行去定义生命周期的某个时间点去做什么事情。

5. 他的shadowdom的渲染和虚拟dom的比较。肯定不如虚拟dom效率高。

6. 属性只能传字符串，没办法传方法。你在dom树中有时还得操作shadow-dom。

7. 社区不完善，现在使用webComponent的人相比三个前端框架比起来很少很少，说明即便他是w3c推出来的，离流行还有很长的距离要走，有什么问题，基本靠你自己查阅文档了。


### 六、相关库

1.[polymer](https://github.com/Polymer/polymer)

2.[stencil](https://github.com/ionic-team/stencil) - A Compiler for Web Components and High Performance Web Apps
* Virtual DOM
* Async rendering (inspired by React Fiber)
* Reactive data-binding
* TypeScript
* JSX
* Static Site Generation (SSG)


* 问题SSG SSR SPA 差别

3.[Ionic UI库](https://ionicframework.com/getting-started)

### 七、参考

mdn文档 <https://developer.mozilla.org/zh-CN/docs/Web/Web_Components>
