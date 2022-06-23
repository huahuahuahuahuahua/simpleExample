var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
/**
 * 生成水印
 * @param {String} className 水印类名
 * @param {Number} width 宽度
 * @param {Number} height 高度
 * @param {String} content 内容
 * @param {String} font 字体
 * @param {String} color 自定义样式: 如字体颜色(使用RGBA)
 * @param {Number} rotate 翻转角度
 * @param {String} position 水印定位方式
 * @param {Number} top 距离顶部位置
 * @param {Number} left 距离左部位置
 * @param {Number} zIndex 水印层级
 */
function genWaterMark(_a) {
    var _b = _a.className, className = _b === void 0 ? "watermarked" : _b, _c = _a.width, width = _c === void 0 ? 340 : _c, _d = _a.height, height = _d === void 0 ? 240 : _d, _e = _a.content, content = _e === void 0 ? "水印" : _e, _f = _a.font, font = _f === void 0 ? "14px PingFang SC, sans-serif" : _f, _g = _a.color, color = _g === void 0 ? "rgba(156, 162, 169, 0.3)" : _g, _h = _a.rotate, rotate = _h === void 0 ? -14 : _h, _j = _a.position, position = _j === void 0 ? "absolute" : _j, _k = _a.top, top = _k === void 0 ? 0 : _k, _l = _a.left, left = _l === void 0 ? 0 : _l, _m = _a.zIndex, zIndex = _m === void 0 ? 1000 : _m;
    var option = {
        width: width,
        height: height,
        content: content,
        font: font,
        color: color,
        rotateDegree: (rotate * Math.PI) / 180
    };
    // 为了实现交错水印的效果，此处生成两张位置不同的水印 固定相对位置
    var dataUri1 = createImgBase(__assign(__assign({}, option), { x: 40, y: 30 }));
    var dataUri2 = createImgBase(__assign(__assign({}, option), { x: 200, y: 240 }));
    var dataUri3 = createImgBase(__assign(__assign({}, option), { x: 400, y: 240 }));
    var defaultStyle = document.createElement("style");
    defaultStyle.innerHTML = "." + className + " {\n    content: '';\n    display: block;\n    width: 100%;\n    height: 100%;\n    " + (top || top === 0 ? "top: " + top + "px;" : "") + "\n    " + (left || left === 0 ? "left: " + left + "px;" : "") + "\n    background-repeat: repeat;\n    pointer-events: none;\n  }";
    var styleEl = document.createElement("style");
    styleEl.innerHTML = "." + className + "\n  {\n    " + (position ? "position: " + position : "") + ";\n    " + (zIndex ? "z-index:" + zIndex : "") + ";\n    background-image: url(" + dataUri1 + "), url(" + dataUri2 + "),url(" + dataUri3 + ");\n    background-size: " + option.width * 2 + "px " + option.height + "px;\n  }";
    document.head.appendChild(defaultStyle);
    document.head.appendChild(styleEl);
}
/**
 * @msg:
 * @param {imgOptions} options
 * @return {*}
 * @Descripttion:创建背景图
 */
function createImgBase(options) {
    var canvas = document.createElement("canvas");
    var text = options.content;
    canvas.width = options.width * 2;
    canvas.height = options.height;
    var ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowBlur = 2;
        ctx.font = options.font;
        ctx.fillStyle = options.color;
        ctx.rotate(options.rotateDegree);
        ctx.textAlign = "left";
        ctx.fillText(text, options.x, options.y, 50);
    }
    return canvas.toDataURL("image/png");
}
