/**
 * @author: zenggo 
 * @Date: 2018-04-26 16:18:05 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-07 13:45:56
 */

const styles = require('./style.less')
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import Canvas2Image from './lib/canvas2Img'
import { Modes, Colors, LineStyle, LineWidth, TInfo, TObject, FabricObject, FabricCanvas, TElement, TType } from './data'
import SizeManager from './sizeManager'
import GroundManager from './groundManager'
import StateManager from './stateManager'
import FabricHelper from './fabricHelper'
import Ele_Image from './element/image'
import Ele_FreeDraw from './element/freeDraw'
import Ele_FreeLine from './element/freeLine'
import Ele_Text from './element/text'

export default class Tactical extends React.PureComponent
  <
    {
      width: number // wrapper width px
    }, {
      mode: Modes
      sizes: any
      groundObjects: any[]
      // state management
      undoAble: boolean
      redoAble: boolean
      // draw
      lineColor: Colors
      lineStyle: LineStyle
      lineWidth: LineWidth
      // line status
      withLeftArrow: boolean
      withRightArrow: boolean
    }
  >
{

  canvas: FabricCanvas
  tempHooker: TElement
  stateManager: StateManager

  constructor(p) {
    super(p)
    let sizes = SizeManager.getSize(p.width)
    this.state = {
      mode: Modes.normal,
      sizes,
      groundObjects: GroundManager.getGroundObjects(sizes), // 球场元素
      undoAble: false,
      redoAble: false,
      lineColor: Colors.black,
      lineStyle: LineStyle.normal,
      lineWidth: LineWidth.sm,
      withLeftArrow: false,
      withRightArrow: false
    }
  }

  async componentDidMount() {
    let data = localStorage.getItem('canvasData')
    if (data) {
      let formal: TInfo = JSON.parse(data)
      await this.initCanvas(formal)
    } else {
      await this.initCanvas()
    }
    this.stateManager = new StateManager(this.canvas, this.props.width)
  }
  componentWillReceiveProps(nextp) {
    if (nextp.width !== this.props.width) {
      this.resize(nextp.width, this.props.width)
    }
  }
  async initCanvas(tInfo?: TInfo) {
    this.canvas && this.canvas.dispose() // 删掉旧的canvas对象
    this.canvas = FabricHelper.createCanvas(this.state.sizes)
    await this.createTactical(tInfo) // 渲染
    // 更新stateManager
    if (this.stateManager) {
      this.stateManager.updateWrapWidth(this.props.width)
      this.stateManager.updateCanvas(this.canvas)
    }
    this.bind() // 绑定canvas事件
    window['_canvas'] = this.canvas // TODO:
  }
  createTactical(tInfo?: TInfo): Promise<void> {
    let nowWrapWidth = this.props.width, objects
    if (tInfo) {
      objects = (tInfo.wrapWidth == nowWrapWidth) ? tInfo.tObjects : SizeManager.scaleObjects(tInfo, nowWrapWidth)
    }
    let canvasData = FabricHelper.createFabricCanvasObject(this.state.groundObjects, objects)
    return new Promise(resolve => {
      // 重绘canvas
      this.canvas.loadFromJSON(canvasData, () => {
        // 给objects挂上tElement
        tInfo && FabricHelper.recreateTElements(this.canvas._objects)
        resolve()
      })
    })
  }
  resize(newWrapWidth: number, oldWrapWidth: number) {
    let newSizes = SizeManager.getSize(newWrapWidth)
    let newGroundObjects = GroundManager.getGroundObjects(newSizes)
    let tInfo = this.stateManager.getNow()
    this.setState({
      mode: Modes.normal,
      sizes: newSizes,
      groundObjects: newGroundObjects
    }, () => {
      this.initCanvas(tInfo) // 重新加载canvas
    })
  }

  componentWillUpdate(nextp, nexts) {
    let { mode } = this.state
    // 防止在以下三种状态时，未从各自结束按钮结束，就切换mode，导致未结束的问题
    if (mode === Modes.freeDrawing && nexts.mode !== Modes.freeDrawing) {
      this.canvas && this.endFreeDrawing()
    }
    if (mode === Modes.freeLining && nexts.mode !== Modes.freeLining) {
      this.canvas && this.endFreeLining()
    }
    if (mode === Modes.adjustFreeLine && nexts.mode !== Modes.adjustFreeLine) {
      this.canvas && this.endFreeLineAdjust()
    }
    if (mode === Modes.addText && nexts.mode !== Modes.addText) {
      this.canvas && this.endAddText()
    }
  }
  
  // state management
  updateState() {
    this.stateManager.update()
    this.setState({
      redoAble: this.stateManager.redoAble(),
      undoAble: this.stateManager.undoAble()
    })
  }
  undo = () => {
    if (!this.state.undoAble) return
    let tInfo = this.stateManager.back()
    this.createTactical(tInfo)
    this.setState({
      redoAble: this.stateManager.redoAble(),
      undoAble: this.stateManager.undoAble()
    })
    if (this.state.mode !== Modes.freeDrawing) {
      this.setState({ mode: Modes.normal })
    }
  }
  redo = () => {
    if (!this.state.redoAble) return
    let tInfo = this.stateManager.forward()
    this.createTactical(tInfo)
    this.setState({
      redoAble: this.stateManager.redoAble(),
      undoAble: this.stateManager.undoAble()
    })
    if (this.state.mode !== Modes.freeDrawing) {
      this.setState({ mode: Modes.normal })
    }
  }

  // canvas binds and handlers
  bind() {
    let canvas = this.canvas
    canvas.on('drop', this.onDropImgElement)
    canvas.on('selection:created', this.onSelect)
    canvas.on('selection:updated', this.onSelect)
    canvas.on('selection:cleared', this.onUnselect)
    canvas.on('object:modified', this.onModified)
  }
  onModified = options => {
    console.log(options)
    let { mode } = this.state
    if (mode == Modes.adjustFreeLine) return
    this.updateState()
  }
  onSelect = options => {
    let target: FabricObject = options.target    
    switch (target._tType) {
      case TType.freeDraw: this.onFreeDrawSelected(options); break;
      case TType.image: this.onImageSelected(options); break;
      case TType.freeLine: this.onFreeLineSelected(options); break;
      case TType.text: this.onTextSelected(options); break;
      default: target.type == 'activeSelection' && this.onGroupSelected(options); break;
    }
  }
  onUnselect = () => {
    if (this.state.mode !== Modes.adjustFreeLine) {
      this.setState({ mode: Modes.normal })
    }
  }
  onGroupSelected = options => { // 多选时，把freeLine去掉，它不能被control
    let { selected, target } = options
    selected.forEach((obj: FabricObject) => {
      if (obj._tType == TType.freeLine || obj._tType == TType.freeLineArrow) {
        target.removeWithUpdate(obj)
      }
    })
    this.setState({ mode: Modes.groupSelected })
  }
  onFreeDrawSelected = options => {
    this.setState({ mode: Modes.freeDrawSelected })
  }
  onImageSelected = options => {
    this.setState({ mode: Modes.imageSelected })
  }
  onTextSelected = options => {
    this.setState({ mode: Modes.textSelected })
    let { target } = options
    target._tElement.startEdit()
  }
  onFreeLineSelected = options => {
    let { target } = options
    target.set({ hasControls: false })
    this.setState({ 
      mode: Modes.freeLineSelected,
      withLeftArrow: !!target._tHasLeftArrow,
      withRightArrow: !!target._tHasRightArrow
    })
  }
  onDropImgElement = options => {
    if (this.state.mode !== Modes.imageAdding) return
    this.setState({ mode: Modes.normal }, () => {
      this.endAddImg(options)
    })
  }

  // left menu handlers
  onDragImgElementStart = e => {
    let { mode } = this.state
    if ([Modes.normal, Modes.imageSelected, Modes.freeDrawSelected, Modes.freeLineSelected, Modes.groupSelected].indexOf(mode) < 0) return
    this.startAddImg(e.nativeEvent)
    this.setState({ mode: Modes.imageAdding })
  }
  onChangeColor(color) {
    let { mode, lineColor } = this.state
    let { canvas, tempHooker } = this
    if (mode === Modes.freeLining || mode === Modes.adjustFreeLine) return false
    if (mode == Modes.freeDrawing) {
      Ele_FreeDraw.setColor(canvas, color)
    } else if (mode == Modes.freeDrawSelected) {
      Ele_FreeDraw.changeColor(canvas.getActiveObject(), color)
      this.updateState()
    } else if (mode == Modes.addText) {
      Ele_Text.setColor(tempHooker as Ele_Text, color)
    } else if (mode == Modes.textSelected) {
      let text = canvas.getActiveObject()
      Ele_Text.changeColor(text, color)
      text.text && this.updateState()
    } else if (mode == Modes.freeLineSelected) {
      Ele_FreeLine.changeColor(canvas.getActiveObject(), color)
      this.updateState()
    }
    this.setState({ lineColor: color })
  }
  onChangeLineStyle(style) {
    let { mode, lineStyle, lineWidth } = this.state
    let { canvas, tempHooker } = this
    if (mode === Modes.freeLining || mode === Modes.adjustFreeLine) return
    if (mode == Modes.freeDrawing) {
      Ele_FreeDraw.setStyle(canvas, style, lineWidth)
    } else if (mode == Modes.freeDrawSelected) {
      Ele_FreeDraw.changeStyle(canvas.getActiveObject(), style, this.props.width)
      this.updateState()
    } else if (mode == Modes.freeLineSelected) {
      Ele_FreeLine.changeStyle(canvas.getActiveObject(), style, this.props.width)
      this.updateState()
    }
    this.setState({ lineStyle: style })
  }   
  onChangeLineWidth(width) {
    let { mode, lineWidth, lineStyle } = this.state
    let { canvas, tempHooker } = this
    if (mode === Modes.freeLining || mode === Modes.adjustFreeLine) return
    if (mode == Modes.freeDrawing) {
      Ele_FreeDraw.setWidth(canvas, this.props.width, width, lineStyle)
    } else if (mode == Modes.freeDrawSelected) {
      Ele_FreeDraw.changeWidth(canvas.getActiveObject(), this.props.width, width)
      this.updateState()
    } else if (mode == Modes.freeLineSelected) {
      Ele_FreeLine.changeWidth(canvas.getActiveObject(), this.props.width, width)
      this.updateState()
    }
    this.setState({ lineWidth: width })
  }
  onSwitchFreeDraw = () => {
    FabricHelper.deselectAll(this.canvas)
    if (this.state.mode === Modes.freeDrawing) {
      this.setState({ mode: Modes.normal }, () => {
        this.endFreeDrawing()
      })
    } else {
      this.setState({ mode: Modes.freeDrawing }, () => {
        this.startFreeDrawing()
      })
    }
  }
  onSwitchFreeLine = () => {
    FabricHelper.deselectAll(this.canvas)
    if (this.state.mode === Modes.freeLining) {
      this.setState({ mode: Modes.normal }, () => {
        this.endFreeLining()
      })
    } else {
      this.setState({ mode: Modes.freeLining }, () => {
        this.startFreeLining()  
      })
    }
  }

  // toolbar handlers
  onUp = () => {
    FabricHelper.bringUpSelected(this.canvas)
    this.updateState()
  }
  onDown = () => {
    FabricHelper.sendBackwardSelected(this.canvas)
    this.updateState()
  }
  onDel = () => {
    FabricHelper.deleteSelected(this.canvas)
    this.updateState()
  }
  onCopy = async () => {
    let clone = await FabricHelper.copySelected(this.canvas, this.state.sizes)
    this.updateState()
  }
  onSave = () => {
    let { mode } = this.state
    if (mode == Modes.imageAdding || mode == Modes.freeLining || mode == Modes.adjustFreeLine) return
    let tInfo = this.stateManager.getNow()
    localStorage.setItem('canvasData', JSON.stringify(tInfo))
    alert('saved')
  }
  onExport = () => {
    Canvas2Image.saveAsPNG(document.getElementById('canvas'))
  }
  onOk = () => {
    let { mode } = this.state
    if (mode === Modes.freeDrawing) {
      this.onSwitchFreeDraw()
    } else if (mode === Modes.freeLining) {
      this.onSwitchFreeLine()
    } else if (mode === Modes.adjustFreeLine) {
      this.onSwitchFreeLineAdjust()
    }
  }
  onSwitchFreeLineAdjust = () => {
    if (this.state.mode === Modes.adjustFreeLine) {
      this.setState({ mode: Modes.normal }, () => {
        this.endFreeLineAdjust()
      })
    } else {
      this.setState({ mode: Modes.adjustFreeLine }, () => {
        this.startFreeLineAdjust()
      })
    }
  }
  onSwitchLeftArrow = () => {
    let { withLeftArrow } = this.state
    this.setState({ withLeftArrow: !withLeftArrow })
    let target: FabricObject = this.canvas.getActiveObject()
    if (withLeftArrow) {
      (target._tElement as Ele_FreeLine).removeLeftArrow()
    } else {
      (target._tElement as Ele_FreeLine).addLeftArrow()
    }
    this.updateState()
  }
  onSwitchRightArrow = () => {
    let { withRightArrow } = this.state
    this.setState({ withRightArrow: !withRightArrow })
    let target = this.canvas.getActiveObject()
    if (withRightArrow) {
      (target._tElement as Ele_FreeLine).removeRightArrow()
    } else {
      (target._tElement as Ele_FreeLine).addRightArrow()
    }
    this.updateState()
  }

  // actions
  startAddImg = e => {
    this.tempHooker = new Ele_Image(this.canvas, e)
  }
  endAddImg = options => {
    let tempHooker = this.tempHooker
    if (tempHooker && tempHooker instanceof Ele_Image) {
      tempHooker.end(options, image => {
        this.canvas.setActiveObject(image.host)
        this.canvas.renderAll()
        this.updateState()
      })
      this.tempHooker = null
    }
  }
  startFreeDrawing() {
    let { lineColor, lineWidth, lineStyle } = this.state
    Ele_FreeDraw.start(this.canvas, this.props.width, lineColor, lineWidth, lineStyle)
    this.canvas._onFreeDrawAdded = this.updateState.bind(this)
  }
  endFreeDrawing() {
    Ele_FreeDraw.end(this.canvas)
    this.canvas._onFreeDrawAdded = null
  }
  startFreeLining() {
    let { lineColor, lineStyle, lineWidth } = this.state
    this.tempHooker = new Ele_FreeLine(this.canvas, this.props.width, lineColor, lineStyle, lineWidth)
  }
  endFreeLining() {
    let tempHooker = this.tempHooker
    if (tempHooker && tempHooker instanceof Ele_FreeLine) {
      tempHooker.end()
      this.tempHooker = null
      this.updateState()
    }
  }
  startFreeLineAdjust = () => {
    let selected: FabricObject = this.canvas.getActiveObject()
    if (selected && selected._tType == TType.freeLine) {
      FabricHelper.deselectAll(this.canvas)
      this.setState({ mode: Modes.adjustFreeLine }) // 这里得写在discard后面，因为discard会触发selection:cleared的回调，mode 回到normal
      let freeLine = selected._tElement as Ele_FreeLine
      freeLine.startAdjust()
      this.tempHooker = freeLine
    }
  }
  endFreeLineAdjust = () => {
    let tempHooker = this.tempHooker
    if (tempHooker && tempHooker instanceof Ele_FreeLine) {
      tempHooker.endAdjust()
      this.tempHooker = null
      this.updateState()
    }
  }
  startAddText = () => {
    FabricHelper.deselectAll(this.canvas)
    this.setState({ mode: Modes.addText }, () => {
      this.tempHooker = new Ele_Text(this.canvas, this.state.lineColor)
    })
  }
  endAddText = () => {
    let tempHooker = this.tempHooker
    if (tempHooker && tempHooker instanceof Ele_Text) {
      tempHooker.end()
      this.tempHooker = null
    }
  }


  // view
  render() {
    let { sizes: S, mode, lineColor, lineStyle, lineWidth, withLeftArrow, withRightArrow, redoAble, undoAble } = this.state

    return <div style={{display: 'flex'}}>

      <div className={styles["panel"]} style={{
        width: S.panelWidth,
        height: S.panelHeight
      }}>
        <div className={styles['draw-block']}>
          <div className={styles['line-color-block']}>
            <div onClick={this.onChangeColor.bind(this, Colors.black)} className={ lineColor == Colors.black ? styles['selected'] : '' } style={{background: Colors.black}}></div>
            <div onClick={this.onChangeColor.bind(this, Colors.red)} className={ lineColor == Colors.red ? styles['selected'] : '' } style={{background: Colors.red}}></div>
            <div onClick={this.onChangeColor.bind(this, Colors.yellow)} className={ lineColor == Colors.yellow ? styles['selected'] : '' } style={{background: Colors.yellow}}></div>
            <div onClick={this.onChangeColor.bind(this, Colors.blue)} className={ lineColor == Colors.blue ? styles['selected'] : '' } style={{background: Colors.blue}}></div>
          </div>
          <div className={styles['line-style-block']}>
            <div onClick={this.onChangeLineStyle.bind(this, LineStyle.normal)} className={`${styles['line-style-btn']} ${lineStyle == LineStyle.normal ? styles['selected'] : ''}`}><div className={styles['line-normal']}></div></div>
            <div onClick={this.onChangeLineStyle.bind(this, LineStyle.dash)} className={`${styles['line-style-btn']} ${lineStyle == LineStyle.dash ? styles['selected'] : ''}`}><div className={styles['line-dash']}></div></div>
          </div>
          <div className={styles['line-width-block']}>
            <div onClick={this.onChangeLineWidth.bind(this, LineWidth.sm)} className={styles['line-width-btn']}><div className={ lineWidth == LineWidth.sm ? styles['selected'] : '' } style={{width:10, height:10}}></div></div>
            <div onClick={this.onChangeLineWidth.bind(this, LineWidth.md)} className={styles['line-width-btn']}><div className={ lineWidth == LineWidth.md ? styles['selected'] : '' } style={{width:15, height:15}}></div></div>
            <div onClick={this.onChangeLineWidth.bind(this, LineWidth.lg)} className={styles['line-width-btn']}><div className={ lineWidth == LineWidth.lg ? styles['selected'] : '' } style={{width:20, height:20}}></div></div>
          </div>
          <div
            onClick={this.onSwitchFreeDraw}
            className={`${styles["draw-btn"]} ${ mode === Modes.freeDrawing ? styles['checked'] : '' }`}
          >Free Draw</div>
          <div onClick={this.onSwitchFreeLine}
            className={`${styles["draw-btn"]} ${ mode === Modes.freeLining ? styles['checked'] : '' }`}
          >Free Line</div>
          <div onClick={this.startAddText}
            className={`${styles["draw-btn"]} ${ mode === Modes.addText ? styles['checked'] : '' }`}
          >Text</div>
        </div>
        <div className={styles["ele-block"]}>
          <this.ImgElement src="./imgs/red1.png" />
          <this.ImgElement src="./imgs/red2.png" />
          <this.ImgElement src="./imgs/red3.png" />
          <this.ImgElement src="./imgs/red4.png" />
          <this.ImgElement src="./imgs/red5.png" />
          <this.ImgElement src="./imgs/red6.png" />
          <this.ImgElement src="./imgs/yellow1.png" />
          <this.ImgElement src="./imgs/yellow2.png" />
          <this.ImgElement src="./imgs/yellow3.png" />
          <this.ImgElement src="./imgs/yellow4.png" />
          <this.ImgElement src="./imgs/yellow5.png" />
          <this.ImgElement src="./imgs/yellow6.png" />
          <this.ImgElement src="./imgs/blue1.png" />
          <this.ImgElement src="./imgs/blue2.png" />
          <this.ImgElement src="./imgs/blue3.png" />
          <this.ImgElement src="./imgs/blue4.png" />
          <this.ImgElement src="./imgs/blue5.png" />
          <this.ImgElement src="./imgs/blue6.png" />
        </div>
        <div className={styles["ele-block"]}>
          <this.ImgElement src="./imgs/football.png" />
          <this.ImgElement src="./imgs/medicine_ball.png" />
          <this.ImgElement src="./imgs/opponent.png" />
          <this.ImgElement src="./imgs/obstacle.png" />
          <this.ImgElement src="./imgs/goal1.png" />
          <this.ImgElement src="./imgs/goal2.png" />
          <this.ImgElement src="./imgs/goal3.png" />
          <this.ImgElement src="./imgs/flag.png" />
          <this.ImgElement src="./imgs/coordination_ladder2.png" />
          <this.ImgElement src="./imgs/cone_red_big.png" />
          <this.ImgElement src="./imgs/cone_blue_big.png" />
          <this.ImgElement src="./imgs/cone_yellow_big.png" />
          <this.ImgElement src="./imgs/cone_grey_big.png" />
          <this.ImgElement src="./imgs/cross.png" />
        </div>
      </div>

      <div style={{position: 'relative'}}>
        <canvas width={S.canvasWidth} height={S.canvasHeight} id="canvas"></canvas>

        <div className={styles["tool-bar"]}>
          <div className={styles["tool-box-left"]}>
            {/* common tools */}
            { this.renderLeftToolBox() }
            {/* 4 freeLine arrow */}
            { mode == Modes.freeLineSelected ?
              [ <div onClick={this.onSwitchLeftArrow} key="lt" className={`${styles['tool-item']} ${withLeftArrow ? styles['arrow-active'] : ''}`}>&lt;</div>,
              <div onClick={this.onSwitchRightArrow} key="gt" className={`${styles['tool-item']} ${withRightArrow ? styles['arrow-active'] : ''}`}>&gt;</div> ]
            : null }
          </div>
          {/* globl tools */}
          <div className={styles["tool-box-right"]}>
            <div className={`${styles["tool-item"]} ${undoAble ? '' : styles['disabled']}`} style={{color:"#419adf"}} onClick={this.undo}>◀</div>
            <div className={`${styles["tool-item"]} ${redoAble ? '' : styles['disabled']}`} style={{color:"#419adf"}} onClick={this.redo}>▶</div>
            <div className={styles["tool-item"]} style={{color:"#419adf"}} onClick={this.onSave}>Save</div>
            <div className={styles["tool-item"]} style={{color:"#59a94e"}} onClick={this.onExport}>Img</div>
          </div>
        </div>
        {/* ok button (middle) */}
        { (mode === Modes.freeDrawing || mode === Modes.freeLining || mode === Modes.adjustFreeLine) ? 
          <div onClick={this.onOk} className={styles['ok-btn']}>✔</div> 
        : null }
      </div>

    </div>
  }
  ImgElement = (props) => {
    return <div
      style={{height:this.state.sizes.playerSize}}
      draggable={this.state.mode === Modes.normal}
      className={styles["player-element"]}
    >
      <img src={props.src} onMouseDown={this.onDragImgElementStart} />
    </div>
  }
  renderLeftToolBox() {
    let mode = this.state.mode
    const upper = <div key="upper" className={styles["tool-item"]} onClick={this.onUp}>↑</div>
    const downer = <div key="downer" className={styles["tool-item"]} onClick={this.onDown}>↓</div>
    const deleter = <div key="deleter" className={styles["tool-item"]} onClick={this.onDel} style={{color:"red"}}>×</div>
    const copyer = <div key="copyer" className={styles["tool-item"]} onClick={this.onCopy} style={{color:"#419adf"}}>||</div>
    const freeLineEditor = <div key="freeLineEditor" className={styles["tool-item"]} onClick={this.onSwitchFreeLineAdjust}>✎</div>
    switch (mode) {
      case Modes.freeDrawSelected:
      case Modes.imageSelected: return [ upper, downer, deleter, copyer ];
      case Modes.freeLineSelected: return [ upper, downer, deleter, freeLineEditor ];
      case Modes.groupSelected: return [ upper, downer, deleter, copyer ];
      case Modes.textSelected: return [ upper, downer, deleter, copyer ];
      default: return null;
    }
  }

}