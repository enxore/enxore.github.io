'use-strict';


let images = new Map();
let imagesAppendix = new Map();
let painted = new Map();
let backgroundElements = [];

let averageColor = new class {
  constructor() {
    this.cnt = 0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.calculated = false;
  }

  /**
   * 
   * @param {p5.Image} img 
   */
  append(img) {
    img.loadPixels();
    for (let i = 0; i < img.pixels.length; i += 4) {
      let r = img.pixels[i + 0];
      let g = img.pixels[i + 1];
      let b = img.pixels[i + 2];
      let a = img.pixels[i + 3];
      if (a > 0) {
        ++this.cnt;
        this.r += r;
        this.g += g;
        this.b += b;
        this.a += a;
      }
    }
  }

  calcAverageColor() {
    if (this.calculated) throw 'calcAverageColor: Already Calculated.';
    this.r /= this.cnt;
    this.g /= this.cnt;
    this.b /= this.cnt;
    this.a /= this.cnt;
    this.calculated = true;
  }

  processColorSaturation() {
    if (!this.calculated) throw 'processColorSaturation: The Color Has not calculated yet.';
    this.r > this.g ?
      this.r > this.b ?
        this.g > this.b ?
          (this.r = 220, this.b = 0)
          : (this.r = 220, this.g = 0)
        : (this.b = 220, this.g = 0)
      : this.g > this.b ?
        this.b > this.r ?
          (this.g = 220, this.r = 0)
          : (this.g = 220, this.b = 0)
        : (this.b = 220, this.r = 0)

  }

  processColorBrightness(factor = 1.2) {
    if (!this.calculated) throw 'processColorBrightness: The Color Has not calculated yet.';
    this.r = this.r * factor > 255 ? 255 : this.r;
    this.g = this.g * factor > 255 ? 255 : this.g;
    this.b = this.b * factor > 255 ? 255 : this.b;
  }

  color() {
    if (!this.calculated) throw 'color: The Color Has not calculated yet.';
    return color(this.r, this.g, this.b, this.a);
  }

  isEmpty() {
    return cnt > 0;
  }

  clear() {
    this.cnt = 0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.a = 0;
    this.calculated = false;
  }
}();

let backgroundElementsModifier = new class {
  constructor() {
    this.modified = false;
    this.modifyList = [];
    this.undoList = [];
  }

  modify() {
    if (this.modified) throw 'modify: Already Modified.';
    let pickNum = 2;
    this.modifyList = getRandomElements(
      backgroundElements,
      Math.floor(backgroundElements.length / 2) > pickNum ?
        pickNum : Math.floor(backgroundElements.length / 2)
    );
    this.undoList = new Array(this.modifyList.length);
    for (let i = 0; i != this.modifyList.length; ++i) {
      let timg = createImage(this.modifyList[i].width, this.modifyList[i].height);

      timg.copy(this.modifyList[i],
        0, 0, this.modifyList[i].width, this.modifyList[i].height,
        0, 0, timg.width, timg.height);
      timg.loadPixels();
      this.undoList[i] = timg;
      this.modifyList[i].loadPixels();
      for (let j = 0; j < this.modifyList[i].pixels.length; j += 4) {
        if (this.modifyList[i].pixels[j + 3]) {
          this.modifyList[i].pixels[j + 0] = averageColor.r;
          this.modifyList[i].pixels[j + 1] = averageColor.g;
          this.modifyList[i].pixels[j + 2] = averageColor.b;
          this.modifyList[i].pixels[j + 3] = averageColor.a;
        }
      }
      this.modifyList[i].updatePixels();
    }
    this.modified = true;
  }

  undo() {
    if (!this.modified) console.warn('undo: Do Not Need To Undo.');
    else {
      for (let i = 0; i != this.modifyList.length; ++i) {
        this.modifyList[i].copy(this.undoList[i],
          0, 0, this.modifyList[i].width, this.modifyList[i].height,
          0, 0, this.modifyList[i].width, this.modifyList[i].height)
      }
      this.modified = false;
    }
  }

  clear() {
    this.modified = false;
    this.modifyList = [];
    this.undoList = [];
  }
}();


let poemInput;
let saveButton;

let stage = 0;

let instructionImage;

let operatingArea;
let operatingAreaWidth = 841;
let operatingAreaHeight = 1189;

let addArea;
let addAreaWidth = operatingAreaWidth;
let addAreaHeight = operatingAreaHeight;
let addAreaDefined = false;

let codeDisplayer = new class {
  constructor() {
    this.graphics = undefined;
    this.position = undefined;
    this.texts = [];
    this.lineNum = 6;
  }

  initialize() {
    this.graphics = createGraphics(800, 400);
    this.position = createVector(operatingAreaWidth * 2.1, operatingAreaHeight - this.graphics.height);
    this.graphics.textSize(30);
    this.graphics.fill(0);
  }

  add(str) {
    if (this.texts.length >= this.lineNum) { this.texts.shift(); }
    this.texts.push(str);
    this.graphics.background(255);
    this.randomShuffle();
    for (let i = this.texts.length - 1; i >= 0; --i) {
      this.graphics.text(this.texts[i], 0, this.graphics.height / this.lineNum * i + this.graphics.textSize() / 2 + 10);
    }
  }

  randomShuffle() {
    for (let i = this.texts.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.texts[i], this.texts[j]] = [this.texts[j], this.texts[i]];
    }
  }

}();


/**
 * 
 * @property {Vector} vp0 - The top left corner of the rectangle.
 * @property {Vector} size - The size of the rectangle.
 * @property {number} size.x - The width of the rectangle.
 * @property {number} size.y - The height of the rectangle.  
 */
class MyRect {
  /**
   * 
   * @param {Vector} point1 
   * @param {Vector} point2 
   */
  constructor(point1, point2) {
    let twidth = (point2.x - point1.x);
    let theight = (point2.y - point1.y);
    let tx = point1.x, ty = point1.y;
    if (twidth < 0) tx += twidth;
    if (theight < 0) ty += theight;
    this.vp0 = createVector(tx, ty);
    this.size = createVector(abs(twidth), abs(theight));
  }

  add() {
    operatingArea.rect(this.vp0.x, this.vp0.y, this.size.x, this.size.y);
  }
}

class MyTriad {
  constructor(first, second, third) {
    this.first = first;
    this.second = second;
    this.third = third;
  }
}

let setProbRectsFinished = false;
let probRects = [];
let vp1;
let vp1Defined = false;

function setProbRects() {
  push();
  codeDisplayer.add('operatingArea.background(220);');
  operatingArea.background(220);
  for (let i = 0; i != probRects.length; ++i) {
    codeDisplayer.add('probRects[i].add();');
    probRects[i].add();
  }
  if (!mouseIsPressed) {
    if (vp1Defined) {
      vp1Defined = false;
      if (vp1.x != mouseX && vp1.y != mouseY) {
        codeDisplayer.add('probRects.push(new MyRect(vp1, createVector(mouseX, mouseY)));');
        probRects.push(new MyRect(vp1, createVector(mouseX, mouseY)));
      }
    }
    vp1 = createVector(mouseX, mouseY);
  } else {
    vp1Defined = true;
    codeDisplayer.add('operatingArea.rect(vp1.x, vp1.y, mouseX - vp1.x, mouseY - vp1.y);');
    operatingArea.rect(vp1.x, vp1.y, mouseX - vp1.x, mouseY - vp1.y);
    codeDisplayer.add('operatingArea.line(vp1.x, vp1.y, mouseX, mouseY);');
    operatingArea.line(vp1.x, vp1.y, mouseX, mouseY);
    codeDisplayer.add('operatingArea.circle(vp1.x, vp1.y, 10);');
    operatingArea.circle(vp1.x, vp1.y, 10);
  }
  codeDisplayer.add('operatingArea.circle(mouseX, mouseY, 10);');
  operatingArea.circle(mouseX, mouseY, 10);
  pop();
}


function preload() {
  let imgsize = 10;
  let bgElemSize = 80;
  instructionImage = loadImage('data/instruction.png');
  let imageNames = loadStrings('data/images/config.txt', () => {
    while (imageNames[imageNames.length - 1] == '') { imageNames.pop(); }
    for (let i = 0; i != imageNames.length; ++i) {
      let img = loadImage('data/images/' + imageNames[i], () => {
        img.resize(imgsize, imgsize);
      });
      let indexname = imageNames[i].slice(0, imageNames[i].lastIndexOf('.'));
      // images[indexname] = img;
      images.set(indexname, img);
      painted.set(indexname, false);
    }
  });
  let backgroundElementsNames = loadStrings('data/backgrounds/config.txt', () => {
    while (backgroundElementsNames[backgroundElementsNames.length - 1] == '') { backgroundElementsNames.pop(); }
    backgroundElements.length = backgroundElementsNames.length;
    for (let i = 0; i != backgroundElementsNames.length; ++i) {
      let img = loadImage('data/backgrounds/' + backgroundElementsNames[i], () => {
        img.resize(bgElemSize, bgElemSize);
      });
      backgroundElements[i] = img;
    }
  });
}

function setImagesAppendix(pixelNum) {
  for (let [key, value] of images.entries()) {
    let timg = createImage(value.width, value.height);
    timg.copy(value, 0, 0, value.width, value.height, 0, 0, timg.width, timg.height);
    timg.resize(pixelNum, pixelNum);
    imagesAppendix.set(key, timg);
  }
}

let pageWidth;
let pageHeight;

function setup() {
  pageWidth = document.documentElement.scrollWidth;
  pageHeight = document.documentElement.scrollHeight;

  createCanvas(operatingAreaWidth * 3, operatingAreaHeight);
  // const canvas = document.querySelector('canvas');
  // let ctx = canvas.getContext("2d", {willReadFrequently: true});

  frameRate(60);
  // canvas.parent('sketch-container');

  operatingArea = createGraphics(operatingAreaWidth, operatingAreaHeight);
  addArea = createGraphics(addAreaWidth, addAreaHeight);

  background(255);

  setImagesAppendix(5);

  poemInput = createInput();
  poemInput.position(0, operatingAreaHeight);
  poemInput.size(operatingAreaWidth, operatingAreaHeight / 6);
  poemInput.input(poemInputEvent);

  saveButton = createButton('save');
  saveButton.size(200, 100);
  saveButton.position(operatingAreaWidth + addAreaWidth / 2 - 100, operatingAreaHeight + 40);
  saveButton.mousePressed(savePaint);
  saveButton.style('add', 'none');

  codeDisplayer.initialize();
  setProbRectsFinished = false;
  vp1Defined = false;
  stage = 0;
  // iconPainter = new MyPainter();
}

function draw() {
  codeDisplayer.add('clear();');
  clear();
  if (stage == 0) {
    codeDisplayer.add('setProbRects();');
    setProbRects();
    if (setProbRectsFinished) {
      codeDisplayer.add('operatingArea.clear();');
      operatingArea.clear();
      codeDisplayer.add('clear();');
      clear();
      codeDisplayer.add('++stage;');
      ++stage;
      codeDisplayer.add('frameRate(45);');
      frameRate(45);
    }
    // image(operatingArea, 0, 0);
  } else if (stage == 1) {
    if (elementPainter.initiallized && !elementPainter.paintFinished) {
      codeDisplayer.add('elementPainter.paintNext();');
      elementPainter.paintNext();
    }

  }

  codeDisplayer.add('image(operatingArea, 0, 0);');
  image(operatingArea, 0, 0);
  if (elementPainter.paintFinished && !addAreaDefined) {
    codeDisplayer.add('addArea.clear();');
    addArea.clear();
    codeDisplayer.add('addArea.image(operatingArea, 0, 0);');
    addArea.image(operatingArea, 0, 0);
    addAreaDefined = true;
    codeDisplayer.add("saveButton.style('add', 'block');");
    saveButton.style('add', 'block');
  }
  if (addAreaDefined) {
    codeDisplayer.add('image(addArea, operatingAreaWidth, 0);');
    image(addArea, operatingAreaWidth, 0);
  }
  image(instructionImage, operatingAreaWidth * 2, 0, operatingAreaWidth, operatingAreaHeight);
  image(codeDisplayer.graphics, codeDisplayer.position.x, codeDisplayer.position.y);
}

let elementPainter = new class {
  constructor() {
    this.paintList = [];
    this.paintFinished = false;
    this.paintIndex = 0;
    this.initiallized = false;
  }

  initiallize() {
    this.paintList.length = bgPainter.paintList.length + iconPainter.paintList.length;
    for (let i = 0; i != bgPainter.paintList.length; ++i) {
      this.paintList[i] = 0;
    }
    for (let i = bgPainter.paintList.length; i != this.paintList.length; ++i) {
      this.paintList[i] = 1;
    }
    for (let i = bgPainter.paintList.length + Math.floor(iconPainter.paintList.length / 2) - 1; i > 0; --i) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.paintList[i], this.paintList[j]] = [this.paintList[j], this.paintList[i]];
    }
    this.initiallized = true;
  }

  paintNext() {
    if (!this.initiallized) { throw 'paintNext: The Painter Object Has not initiallized.'; }
    if (this.paintFinished) { throw 'paintNext: The Painting Has Already Finished'; }
    if (!this.paintList[this.paintIndex]) bgPainter.paintNextImage();
    else iconPainter.paintNext();
    ++this.paintIndex;
    if (this.paintIndex == this.paintList.length) this.paintFinished = true;
  }

  clear() {
    this.paintList = [];
    this.paintFinished = false;
    this.paintIndex = 0;
    this.initiallized = false;
  }
}();


class MyPainter {
  constructor() {
    this.paintIndex = 0;
    this.paintFinished = false;
    this.paintList = [];
    this.paintType = [];
  }

  /**
   * Add icons to paint list with probability restrictions.
   * @param {p5.Image} img  The icon.
   * @param {number} pixelSize  The size of every pixel of img.
   */
  addIconToList(img, pixelSize) {
    let num = 20;
    let posArr = [];
    posArr.length = num;
    for (let i = 0; i != posArr.length; ++i) {
      if (probRects.length && Math.random() < 0.8) {
        let rin = parseInt(random(0, probRects.length));
        posArr[i] = createVector(
          probRects[rin].vp0.x + random(probRects[rin].size.x),
          probRects[rin].vp0.y + random(probRects[rin].size.y)
        );
      } else posArr[i] = createVector(
        random(operatingAreaWidth - img.width * pixelSize),
        random(operatingAreaHeight - img.height * pixelSize)
      );
    }
    for (let i = 0; i != posArr.length; ++i) {
      this.paintList.push(new MyTriad(img, posArr[i], pixelSize));
    }
  }

  /**
   * Add icons to paint list without probability restrictions.
   * @param {p5.Image} img  The icon.
   * @param {number} pixelSize  The size of every pixel of img.
   */
  addIconToList0(img, pixelSize) {
    let num = 25;
    let posArr = [];
    posArr.length = num;
    for (let i = 0; i != posArr.length; ++i) {
      posArr[i] = createVector(
        random(operatingAreaWidth - img.width * pixelSize),
        random(operatingAreaHeight - img.height * pixelSize)
      );
    }
    for (let i = 0; i != posArr.length; ++i) {
      this.paintList.push(new MyTriad(img, posArr[i], pixelSize));
    }
  }

  addImageToList(img) {
    let num = 35;
    let posArr = [];
    posArr.length = num;
    for (let i = 0; i != posArr.length; ++i) {
      posArr[i] = createVector(
        random(operatingAreaWidth - img.width),
        random(operatingAreaHeight - img.height)
      );
    }
    for (let i = 0; i != posArr.length; ++i) {
      this.paintList.push(new MyTriad(img, posArr[i]));
    }
  }

  addIconToList2(img1, img2, pixelSize1, pixelSize2) {
    let num = 25;
    let posArr = [];
    posArr.length = num;
    for (let i = 0; i != posArr.length; ++i) {
      if (probRects.length && Math.random() < 0.8) {
        let rin = parseInt(random(0, probRects.length));
        posArr[i] = createVector(
          probRects[rin].vp0.x + random(probRects[rin].size.x),
          probRects[rin].vp0.y + random(probRects[rin].size.y)
        );
      } else posArr[i] = createVector(
        random(operatingAreaWidth),
        random(operatingAreaHeight)
      );
    }
    for (let i = 0; i != posArr.length; ++i) {
      let ri = parseInt(Math.random() * 2);
      let img = [img1, img2][ri];
      let pixelSize = [pixelSize1, pixelSize2][ri];
      posArr[i].x -= img.width * pixelSize / 2;
      posArr[i].y -= img.width * pixelSize / 2;
      this.paintList.push(new MyTriad(img, posArr[i], pixelSize));
    }
  }

  randomShuffle() {
    if (this.paintIndex) throw 'randomShuffle : Cannot Shuffle After Initialization.';
    for (let i = this.paintList.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      [this.paintList[i], this.paintList[j]] = [this.paintList[j], this.paintList[i]];
    }
  }

  clear() {
    this.paintIndex = 0;
    this.paintFinished = false;
    this.paintList = [];
  }

  paintNext() {
    if (this.paintFinished) { throw 'paintNext : The Painting Has Already Finished'; }
    operatingArea.push();
    this.paintList[this.paintIndex].first.loadPixels();
    operatingArea.noStroke();
    for (let i = 0; i < this.paintList[this.paintIndex].first.width; ++i) {
      for (let j = 0; j < this.paintList[this.paintIndex].first.height; ++j) {
        let index = (i + j * this.paintList[this.paintIndex].first.width) * 4;
        let r = this.paintList[this.paintIndex].first.pixels[index + 0];
        let g = this.paintList[this.paintIndex].first.pixels[index + 1];
        let b = this.paintList[this.paintIndex].first.pixels[index + 2];
        let a = this.paintList[this.paintIndex].first.pixels[index + 3];
        operatingArea.fill(r, g, b, a);
        if (a > 0) operatingArea.rect(
          this.paintList[this.paintIndex].second.x + i * this.paintList[this.paintIndex].third,
          this.paintList[this.paintIndex].second.y + j * this.paintList[this.paintIndex].third,
          this.paintList[this.paintIndex].third,
          this.paintList[this.paintIndex].third
        );
      }
    }
    operatingArea.pop();
    ++this.paintIndex;
    if (this.paintIndex == this.paintList.length) this.paintFinished = true;
  }

  paintNextImage() {
    if (this.paintFinished) { throw 'paintNextImage : The Painting Has Already Finished'; }
    operatingArea.image(this.paintList[this.paintIndex].first,
      this.paintList[this.paintIndex].second.x,
      this.paintList[this.paintIndex].second.y);
    ++this.paintIndex;
    if (this.paintIndex == this.paintList.length) this.paintFinished = true;
  }

  paintAll() {
    operatingArea.push();
    operatingArea.noStroke();
    for (let k = 0; k != this.paintList.length; ++k) {
      this.paintList[k].first.loadPixels();
      for (let i = 0; i < this.paintList[k].first.width; ++i) {
        for (let j = 0; j < this.paintList[k].first.height; ++j) {
          let index = (i + j * this.paintList[k].first.width) * 4;
          let r = this.paintList[k].first.pixels[index + 0];
          let g = this.paintList[k].first.pixels[index + 1];
          let b = this.paintList[k].first.pixels[index + 2];
          let a = this.paintList[k].first.pixels[index + 3];
          operatingArea.fill(r, g, b, a);
          if (a > 0) operatingArea.rect(
            this.paintList[k].second.x + i * this.paintList[k].third,
            this.paintList[k].second.y + j * this.paintList[k].third,
            this.paintList[k].third,
            this.paintList[k].third
          );
        }
      }
    }
    operatingArea.pop();
    this.paintFinished = true;
  }

  paintAllImages() {
    for (let i = 0; i != this.paintList.length; ++i) {
      operatingArea.image(this.paintList[i].first,
        this.paintList[i].second.x,
        this.paintList[i].second.y);
    }
    this.paintFinished = true;
  }
}
let iconPainter = new MyPainter();
let bgPainter = new MyPainter();


/**
 * Pick up n element(s) form an array.
 * 
 * @param {Array} arr The given array.
 * @param {number} n The number of element(s) to pick up.
 * @returns {Array} The picked-up array.
 */
function getRandomElements(arr, n) {
  const result = new Array(n);
  let len = arr.length;
  const taken = new Array(len);

  if (n > len)
    throw new RangeError("getRandomElements: more elements taken than available");

  while (n--) {
    const rand = Math.floor(Math.random() * len);
    result[n] = arr[rand in taken ? taken[rand] : rand];
    taken[rand] = --len in taken ? taken[len] : len;
  }

  return result;
}

function poemInputEvent() {
  return false;
}

function keyPressed() {
  let reset = () => {
    codeDisplayer.add("clear(); // 清空画布");
    clear(); // 清空画布
    codeDisplayer.add("operatingArea.clear();");
    operatingArea.clear();
    codeDisplayer.add("iconPainter.clear();");
    iconPainter.clear();
    codeDisplayer.add("for (let key of painted.keys()) {\n painted.set(key, false);\n}");
    for (let key of painted.keys()) {
      painted.set(key, false);
    }
    codeDisplayer.add("backgroundElementsModifier.undo();");
    backgroundElementsModifier.undo();
    codeDisplayer.add("bgPainter.clear();");
    bgPainter.clear();
    codeDisplayer.add("elementPainter.clear();");
    elementPainter.clear();
    codeDisplayer.add("averageColor.clear();");
    averageColor.clear();
  }

  let generate2 = () => {
    codeDisplayer.add("let poemtext = poemInput.value();");
    let poemtext = poemInput.value();
    codeDisplayer.add("for (let i = 0; i != poemtext.length; ++i) {\n let wch = poemtext[i];\n if (images.has(wch) && !painted.get(wch)) {\n painted.set(wch, true);\n let img1, img2;\n img1 = images.get(wch);\n img2 = imagesAppendix.get(wch);\n iconPainter.addIconToList2(img1, img2, 10, 20);\n averageColor.append(img1);\n }\n}");
    for (let i = 0; i != poemtext.length; ++i) {
      let wch = poemtext[i];
      if (images.has(wch) && !painted.get(wch)) {
        painted.set(wch, true);
        let img1, img2;
        img1 = images.get(wch);
        img2 = imagesAppendix.get(wch);
        iconPainter.addIconToList2(img1, img2, 10, 20);
        averageColor.append(img1);
      }
    }
    codeDisplayer.add("averageColor.calcAverageColor();");
    averageColor.calcAverageColor();
    codeDisplayer.add("averageColor.processColorBrightness();");
    averageColor.processColorBrightness();
    codeDisplayer.add("backgroundElementsModifier.modify();");
    backgroundElementsModifier.modify();
    codeDisplayer.add("iconPainter.randomShuffle();");
    iconPainter.randomShuffle();
    codeDisplayer.add("elementPainter.initiallize();");
    elementPainter.initiallize();
  }

  let generateBg = () => {
    codeDisplayer.add("let enforcementTime = 40;");
    let enforcementTime = 40;
    do {
      codeDisplayer.add("let rin = parseInt(random(backgroundElements.length));");
      let rin = parseInt(random(backgroundElements.length));
      codeDisplayer.add("bgPainter.addImageToList(backgroundElements[rin]);");
      bgPainter.addImageToList(backgroundElements[rin]);
    } while (enforcementTime-- > 0);
    codeDisplayer.add("bgPainter.randomShuffle();");
    bgPainter.randomShuffle();
  }

  if (stage == 0) {
    if (keyCode == ENTER) {
      setProbRectsFinished = true;
    } else if (keyCode === BACKSPACE) {
      if (probRects.length) probRects.pop();
    }
  } else if (stage == 1) {
    if ((keyCode === DELETE || keyCode == BACKSPACE)) {
      if (poemInput.value().length == 0) {
        stage = 0;
        frameRate(60);
        reset();
        clear();
        operatingArea.push();
        operatingArea.fill(255);
        operatingArea.stroke(0);
        for (let i = 0; i != probRects.length; ++i) {
          probRects[i].add();
        }
        operatingArea.pop();
        setProbRectsFinished = false;
      } else {
        reset();
      }
    } else if (keyCode == ENTER) {
      addArea.clear();
      addAreaDefined = false;
      saveButton.style('add', 'none');
      generateBg();
      generate2();
    } else if (keyCode == TAB) {
      addArea.clear();
      addAreaDefined = false;
      saveButton.style('add', 'none');
      reset();
      generateBg();
      generate2();
    }
  }
}


function savePaint() {
  if (!addAreaDefined) throw 'savePaint: Cannot save graphics before painting finished';
  save(addArea, Date.now() + '.png');
}