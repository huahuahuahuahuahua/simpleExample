type imgOptions = {
  width: number;
  height: number;
  content: string;
  font: string;
  color: string;
  rotateDegree: number;
  x: number;
  y: number;
};

// 配置类型
type watermarkOptions = {
  // 自定义类名
  className?: string;
  // 宽度
  width?: number;
  // 高度
  height?: number;
  // 文案内容
  content?: string;
  // 字体
  font?: string;
  // 颜色
  color?: string;
  // 偏转角度
  rotate?: number;
  // 定位方式
  position?: string;
  // 顶部距离
  top?: number;
  // 左侧距离
  left?: number;
  // 层级
  zIndex?: number;
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
function genWaterMark({
  className = "watermarked",
  width = 340,
  height = 240,
  content = "水印",
  font = "14px PingFang SC, sans-serif",
  color = "rgba(156, 162, 169, 0.3)",
  rotate = -14,
  position = "absolute",
  top = 0,
  left = 0,
  zIndex = 1000,
}: watermarkOptions): void {
  const option = {
    width,
    height,
    content,
    font,
    color,
    rotateDegree: (rotate * Math.PI) / 180,
  };

  // 为了实现交错水印的效果，此处生成两张位置不同的水印 固定相对位置
  const dataUri1 = createImgBase({
    ...option,
    x: 40,
    y: 30,
  });
  const dataUri2 = createImgBase({
    ...option,
    x: 200,
    y: 240,
  });
  const dataUri3 = createImgBase({
    ...option,
    x: 400,
    y: 240,
  });

  let defaultStyle = document.createElement("style");
  defaultStyle.innerHTML = `.${className} {
    content: '';
    display: block;
    width: 100%;
    height: 100%;
    ${top || top === 0 ? `top: ${top}px;` : ""}
    ${left || left === 0 ? `left: ${left}px;` : ""}
    background-repeat: repeat;
    pointer-events: none;
  }`;

  let styleEl = document.createElement("style");
  styleEl.innerHTML = `.${className}
  {
    ${position ? `position: ${position}` : ""};
    ${zIndex ? `z-index:${zIndex}` : ""};
    background-image: url(${dataUri1}), url(${dataUri2}),url(${dataUri3});
    background-size: ${option.width * 2}px ${option.height}px;
  }`;
  document.head.appendChild(defaultStyle);
  document.head.appendChild(styleEl);
}

/**
 * @msg:
 * @param {imgOptions} options
 * @return {*}
 * @Descripttion:创建背景图
 */
function createImgBase(options: imgOptions): string {
  const canvas = document.createElement("canvas");
  const text = options.content;
  canvas.width = options.width * 2;
  canvas.height = options.height;
  const ctx = canvas.getContext("2d");
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
