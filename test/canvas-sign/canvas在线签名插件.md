![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6b45ac21a3a84e88917e5b031e787377~tplv-k3u1fbpfcp-zoom-in-crop-mark:1956:0:0:0.image)

关于
==

插件地址github：[github.com/javascript-…](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fjavascript-wei%2Fcanvas-sign "https://github.com/javascript-wei/canvas-sign")  
体验预览：[canvas-sign](https://link.juejin.cn/?target=https%3A%2F%2Fjavascript-wei.github.io%2Fcanvas-sign%2F "https://javascript-wei.github.io/canvas-sign/")

背景
==

最近临时接到一个需求，需要客户方在线签字然后保存到服务器，功能大致有撤销（也就是笔画的每一笔都需要支持撤销）、更改签字颜色、移动端和pc端都支持。因为紧急需求，有现成的插件当然是最好的，毕竟学会偷懒也是一门技巧（滑稽），临时找了一个jSignature第三方的签名插件，仔细研究了一下发现该插件依赖复杂，使用该插件还需要引入jQuery，因为整个项目都能没有引入jquery，插件源码也是ES5，甚至还是ES3，当时我就犹豫了，不能因为一个签名引入这么复杂的插件吧。  
因为本次需求最终就只需要一张图片保存到后台，也不需数字证书验证部分之类的，对于喜欢动手（完全是被逼）的我来说，这完全可以自己写啊。因为需求是周五出的，然后下周二就要，看来周末又是一个悄悄加班的日子。

分析
==

签名是若干操作的集合，起于用户手写姓名，终止于签名图片上传，中间还包含图片的处理，比如说减少锯齿、撤销、预览等，除了canvas绝无二选。

手撕
==

从整个交互上看，开始绘制时候需要定义起始点touchstart(移动端开始)、mousedown(pc鼠标按下)，为了完成绘制，还需要处理手指移动或鼠标移动，监听处理两个事件touchmove(移动端)、mousemove(PC端)。

```
       const handleMove = (e) => {
            this.creat({ x: e.clientX - left + 0.5, y: e.clientY - top + 0.5 });
        }
        const handleDown = (e) => {
            this.creat({ x: e.clientX - left + 0.5, y: e.clientY - top + 0.5 });
        }
        constf fn = {
            mousedown: handleDown,
            mousemove: handleMove,
            //移动端
            touchmove: handleMove,
            touchstart:handleDown,
        }


```

画线
--

接下来划线部分，canvas原生有以下api提供画线：

1.  开始路径（beginPath）
2.  定位起点（moveTo）
3.  移动画笔（lineTo）
4.  绘制路径（stroke）

**注意**：canvas中的绘制方法（如stroke,fill），都会以“上一次beginPath”之后的所有路径为基础进行绘制。我比如下面的代码里面我第二次beginPath注释掉，会发现stroke之后就第一条线段会绘制三次，因为第一次stroke和中间两次stroke()以第一次beginPath后的所有路径为基础画的。也就是说第一条路径我们stroke了三次，第一下是red的，第二下和第三下是green的，所以最终也是看到是green重叠上red上的。最后一条线段因为重新beginPath，过后就是新的路径了和上面两条都没有关系了。

```
    var c=document.getElementById("myCanvas");
    var context=c.getContext("2d");
	//第一次beginPath
    context.beginPath();
    context.moveTo(100,100);
    context.lineTo(200,100);
    context.strokeStyle = "red";
    context.stroke();
    //第二次beginPath
    //context.beginPath();
    context.moveTo(100,130);
    context.lineTo(200,130);
    context.strokeStyle = "green";//此时第一条线段包括red、和green两条线段重合，改为white效果更明显
    context.stroke();
    context.stroke();
	//第三次beginPath
    context.beginPath();
    context.moveTo(100,160);
    context.lineTo(200,160);
    context.strokeStyle = "black";
    context.stroke();//多stroke几次，上一次beginPath和下一次beginPath之间之后的直线颜色会加深
    context.stroke();
    context.stroke();
    context.stroke();

```

效果如图：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/20e0285959fe4a5b88a2dd9c9a9d7b3e~tplv-k3u1fbpfcp-zoom-in-crop-mark:1956:0:0:0.image)

1.  不管你用moveTo把画笔移动到哪里，只要不beginPath，那你一直都是在画一条路.
2.  fillRect与strokeRect这种直接画出独立区域的函数，也不会打断当前的path.

具体可以参考：[canvas MDN](https://link.juejin.cn/?target=https%3A%2F%2Fdeveloper.mozilla.org%2Fzh-CN%2Fdocs%2FWeb%2FAPI%2FCanvas_API%2FTutorial%2FDrawing_shapes "https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Drawing_shapes")，如果你画出的图像和你预期的不一样，记得查看是否有合理的beginPath.  
说到beginPath，就顺便提一下closePath，**两者没有一点关系！** closePath的意思不是结束路径，而是关闭路径，它会试图从当前路径的终点连一条路径到起点，让整个路径闭合起来。**如下：**

```
    const c=document.getElementById("myCanvas");
    const context=c.getContext("2d");
    context.beginPath();
    context.moveTo(100,100);//定位七点
    context.lineTo(200,100);//移动画笔
    context.lineTo(230,120);//移动画笔
    context.strokeStyle = "red";

```

此时效果：

```
  //context.closePath();
    context.stroke();

```

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/85aa03164c274d888b25bbea4f00762a~tplv-k3u1fbpfcp-zoom-in-crop-mark:1956:0:0:0.image)

去掉注释过后，此时效果只是开始点到结束点产生闭合路径：

```
    context.closePath();
    context.stroke();

```

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/47d1110cae544715945c3078897df80f~tplv-k3u1fbpfcp-zoom-in-crop-mark:1956:0:0:0.image)  
上面简单说一下beginPath和closePath的作用和基本关系（毫无关系）。  
**不知不觉多说了些，接下来进入正题：**  
有了start和move事件，画线的思路就明确了很多，按下按钮时候我们需要重置画笔beginPath，并且移动画笔moveTo，因为按下即便不移动也算是一个完整的绘制过程：

```
    const handleDown = (e) => {
        //按下键时候重置画笔
        this.ctx.beginPath();
        //isMouseDown 判断是否按下按键已经就绪绘制
        this.isMouseDown = true;
        const position = { x: e.clientX - left + 0.5, y: e.clientY - top + 0.5 };
        this.ctx.moveTo(position.x,position.y)
        this.creat({ x: position.x, y: position.y });
    }

```

移动处理：

```
  const handleMove = (e) => {
        //判断pc端是否鼠标左键按下，移动端不需要做判断
        if ((!this.isMouseDown || e.which != 1) && !mobile) return;
        e = mobile ? e.touches[0] : e;
        this.creat({ x: e.clientX - left + 0.5, y: e.clientY - top + 0.5 });
    }
   const creat = (position = { x, y })=> {
         ctx.lineTo(position.x, position.y);
         ctx.stroke();
    }

```

以上代码中的left和top并非内置变量，它们分别表示着画布距屏幕左边和顶部的像素距离，主要用于将屏幕坐标点转换为画布坐标点。以下是一种获取方法：

```
const { left, top } = this.canvas.getBoundingClientRect();

```

设置
--

接下来是更改画笔设置，需要支持原生canvas画笔属性：

```
    // 提供一个条件是否更改保存当前样式，用于导入json时避免和已有的ctx样式冲突
    setLineStyle(style = {},isSaveLineStyle = true) {
        const ctx = this.ctx;
        const lineStyle =  isObject(style)? { ...this.lineStyle, ...style } : this.lineStyle;
        if(isSaveLineStyle){
            this.lineStyle = lineStyle;
        }
        Object.keys(lineStyle).forEach(key => {
            ctx[key] = lineStyle[key];
        });
        ctx.beginPath();
        return this;
    }

```

导出json
------

画线需要路径和画笔的配置，路径则一系列坐标的集合，而画笔配置则是setLineStyle时传入的各个属性。由此可以得到json数据结构：

```
    const json = [{
        lineStyle:{},
        position:[]
    }]


```

什么时候保存，从开始绘制到结束绘制处理json的情况有三种：开始绘制，绘制中，结束绘制。  
**开始绘制**：鼠标按下时，也就是一个点，此时往json数组中psuh当前值。  
**绘制中**：往数组的最后一条数据中的position添加移动点的信息。  
**结束绘制**：不在往数组添加数据，此时保存当前的lineStyle的信息。

```
    setJson(value, type) {                                           
        const dataJson = this.dataJson;              
        const jsonLength = dataJson.length - 1;    
        switch (type) {                            
            case 'moving':                             
                dataJson[jsonLength].position.push(value); 
                break;                                     
            case 'end':                                
                dataJson[jsonLength].lineStyle = value;    
                break;                                    
            case "start":                              
                dataJson.push(value);                      
                break;                                     
            }                                          
     }

```

优化
--

为了让move更加流畅，可以考虑requestAnimationFrame优化：

```
   const raf = window.requestAnimationFrame;
   const move = raf?(e)=>{
        raf(() => {
            handleEvent.handleMove(e);
          });
    }:handleEvent.handleMove;

```

写到最后
====

本文介绍了在线签字实现的主要过程，核心代码可以在这里找到：[canvas-sign](https://link.juejin.cn/?target=https%3A%2F%2Fgithub.com%2Fjavascript-wei%2Fcanvas-sign "https://github.com/javascript-wei/canvas-sign")。  
喜欢的同学不妨轻点star，不吝赐教，感谢。  
本文就讨论这么多内容,有什么问题和意见欢迎提出！

  

本文转自 [https://juejin.cn/post/6989985162599596063](https://juejin.cn/post/6989985162599596063)，如有侵权，请联系删除。