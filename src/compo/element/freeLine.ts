/**
 * @author: zenggo 
 * @Date: 2018-04-27 13:57:17 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-02 18:20:58
 */

import { TElement, TType, FabricObject, FabricCanvas, LineStyle, LineWidth, Colors } from '../data'
const fabric = require('fabric')
import SizeManager from '../sizeManager'
import FabricHelper from '../fabricHelper'
import { CLIENT_RENEG_LIMIT } from 'tls';

interface Coor {
  x: number
  y: number
}

export default class FreeLine implements TElement {

  canvas: FabricCanvas
  host: FabricObject
  created: boolean

  color: Colors
  lineWidth: number
  strokeDashArray: any

  _points: Coor[]
  _temp: any[]

  _leftArrow?: FabricObject
  _rightArrow?: FabricObject

  constructor(canvas: FabricCanvas, wrapWidth: number, color: Colors, lineStyle: LineStyle, lineWidth: LineWidth) {
    this.drawHandler = this.drawHandler.bind(this)
    this.onMoveAnchor = this.onMoveAnchor.bind(this)
    this.onMoveLine = this.onMoveLine.bind(this)
    this.canvas = canvas
    this.color = color
    this.lineWidth = SizeManager.getRealLineWidth(lineWidth, wrapWidth)
    this.strokeDashArray = lineStyle == LineStyle.dash ? SizeManager.getStrokeDashArray(lineWidth) : null
    this.start()
  }

  static recreate(target: FabricObject) {
    let t = {
      canvas: target.canvas,
      host: target,
      created: true,
      color: target.stroke,
      lineWidth: target.strokeWidth,
      strokeDashArray: target.strokeDashArray,
      _points: target.points.map(p => ({ x: p.x, y: p.y }))
    } as FreeLine
    t.constructor = FreeLine
    Object.setPrototypeOf(t, FreeLine.prototype)
    t.drawHandler = t.drawHandler.bind(t)
    t.onMoveAnchor = t.onMoveAnchor.bind(t)
    t.onMoveLine = t.onMoveLine.bind(t)
    target._tElement = t
    // 重建左右箭头
    target._tHasLeftArrow && t.addLeftArrow()
    target._tHasRightArrow && t.addRightArrow()
    // on move bind
    target.on('moving', t.onMoveLine)
  }

  remove() {
    let { canvas, host, _leftArrow, _rightArrow } = this
    canvas.remove(host)
    _leftArrow && canvas.remove(_leftArrow)
    _rightArrow && canvas.remove(_rightArrow)
  }

  start() {
    this._points = []
    this._temp = []
    FabricHelper.disableAllSelect(this.canvas)
    this.canvas.on('mouse:down', this.drawHandler)
  }

  end() {
    if (this.created) return
    this.canvas.off('mouse:down', this.drawHandler)
    this._points.length > 1 && this.drawLine()
    this.created = true
    this._temp.forEach(t => this.canvas.remove(t))
    this._temp = [] 
    FabricHelper.enableAllSelect(this.canvas)
  }

  drawHandler(options) {
    let { canvas, color, lineWidth, strokeDashArray, _points, _temp } = this
    let { layerX, layerY } = options.e
    let obj
    if (_points.length) {
      let lastPoint = _points[_points.length - 1]
      obj = new fabric.Line(
        [ lastPoint.x, lastPoint.y, layerX, layerY ],
        {
          stroke: color, strokeWidth: lineWidth, strokeDashArray,
          selectable: false, hoverCursor: 'default'
        }
      )
    } else { // 第一点
      obj = new fabric.Circle({
        left: layerX - lineWidth, top: layerY - lineWidth,
        radius: lineWidth, fill: color,
        selectable: false, hoverCursor: 'default'
      })
    }
    _temp.push(obj)
    canvas.add(obj)
    canvas.renderAll()
    _points.push({ x: layerX, y: layerY })
  }

  drawLine(insertIdx?: number) {
    let { canvas, color, lineWidth, strokeDashArray, _points } = this
    let line: FabricObject = new fabric.Polyline(_points, {
      fill: null,
      stroke: color, 
      strokeDashArray,
      strokeWidth: lineWidth
    })
    line._tType = TType.freeLine
    line._tOriLeft = line.left
    line._tOriTop = line.top
    line._tElement = this
    this.host = line
    // render
    insertIdx = insertIdx || canvas._objects.findIndex(obj => {
      return obj._tType == TType.image || obj._tType == TType.text
    }) // 没有insertIdx就sink在图片的下面
    canvas.insertAt(line, insertIdx)
    canvas.renderAll()
    line.on('moving', this.onMoveLine)
  }

  startAdjust() {
    this.created = false
    let _temp = this._temp = []
    let line = this.host
    let { scaleX, scaleY } = line
    let { canvas, _points, lineWidth, strokeDashArray } = this
    FabricHelper.disableAllSelect(canvas)
    // 移除原来的polyline
    line._idx = canvas._objects.indexOf(line) // 记录原来的_objects位置
    canvas.remove(line)
    // 移除左右箭头
    this._leftArrow && canvas.remove(this._leftArrow)
    this._rightArrow && canvas.remove(this._rightArrow)
    // 原始节点经过scale与move映射为当前的节点
    let newPoints = _points.map(p => FreeLine.getRealCoorOfPoint(p, line))
    // 把polyline线变为圆锚点与线段
    for (let i = 0; i < newPoints.length; i++) {
      let p = newPoints[i]
      let _anchor = new fabric.Circle({
        left: p.x - 8, top: p.y - 8,
        radius: 8, fill: this.color,
        hasControls: false
      })
      _temp.push(_anchor)
      if (i < newPoints.length - 1) {
        let _line = new fabric.Line(
          [ newPoints[i].x, newPoints[i].y, newPoints[i+1].x, newPoints[i+1].y ],
          { 
            stroke: this.color, strokeWidth: lineWidth, strokeDashArray,
            selectable: false, hoverCursor: 'default'
          }
        )
        _temp.push(_line)
      }
    }
    let _anchors = _temp.filter(obj => obj.get('type') == 'circle'),
      _lines = _temp.filter(obj => obj.get('type') == 'line')
    canvas.add(..._lines, ..._anchors)
    canvas.renderAll()
    canvas.on('object:moving', this.onMoveAnchor)
  }

  onMoveAnchor(e) {
    let { _temp, canvas } = this
    let target = e.target
    let anchorIdx = _temp.findIndex(t => t === target)
    _temp[anchorIdx - 1] && _temp[anchorIdx - 1].set({ x2: target.left + 8, y2: target.top + 8 })
    _temp[anchorIdx + 1] && _temp[anchorIdx + 1].set({ x1: target.left + 8, y1: target.top + 8 })
    canvas.renderAll()
  }

  endAdjust() {
    if (this.created) return
    let { canvas, _temp } = this
    let anchors = _temp.filter(t => t.get('type') == 'circle')
    let originLine = this.host
    canvas.off('mouse:down', this.onMoveAnchor)
    let points = this._points = []
    for (let anchor of anchors) {
      points.push({
        x: anchor.left + 8,
        y: anchor.top + 8
      })
    }
    _temp.forEach(t => canvas.remove(t))
    this.drawLine(originLine._idx)
    this._temp = []
    this.created = true
    // 左右箭头
    this._leftArrow && this.addLeftArrow()
    this._rightArrow && this.addRightArrow()
    FabricHelper.enableAllSelect(canvas)
  }

  addLeftArrow() {
    let line = this.host
    let firstPoint = FreeLine.getRealCoorOfPoint(line.points[0], line),
      secondPoint = FreeLine.getRealCoorOfPoint(line.points[1], line)
    this._leftArrow = FreeLine.createArrow(this.canvas, line, firstPoint, secondPoint)
    line._tHasLeftArrow = true
  }
  removeLeftArrow() {
    if (!this._leftArrow) return
    this.canvas.remove(this._leftArrow)
    this._leftArrow = null
    this.host._tHasLeftArrow = false
    this.canvas.renderAll()
  }
  addRightArrow() {
    let line = this.host
    let lastPoint = FreeLine.getRealCoorOfPoint(line.points[line.points.length - 1], line),
      last2Point = FreeLine.getRealCoorOfPoint(line.points[line.points.length - 2], line)
    this._rightArrow = FreeLine.createArrow(this.canvas, line, lastPoint, last2Point)
    line._tHasRightArrow = true
  }
  removeRightArrow() {
    if (!this._rightArrow) return
    this.canvas.remove(this._rightArrow)
    this._rightArrow = null
    this.host._tHasRightArrow = false
    this.canvas.renderAll()
  }

  onMoveLine() {
    let { canvas, _leftArrow, _rightArrow } = this
    if (_leftArrow) {
      canvas.remove(_leftArrow)
      this.addLeftArrow()
    }
    if (_rightArrow) {
      canvas.remove(_rightArrow)
      this.addRightArrow()
    }
  }

  private static createArrow(canvas: FabricCanvas, line: FabricObject, point1: Coor, point2: Coor) {
    let idx = canvas._objects.indexOf(line)
    let a = point1.x - point2.x, b = point2.y - point1.y, angle
    // 分象限 计算与垂直方向的夹角
    if (a >=0 && b > 0) {
      angle = Math.atan(a / b) / Math.PI * 180
    } else if (a > 0 && b <=0 ) {
      angle = 90 + Math.atan(-b / a) / Math.PI * 180
    } else if (a <= 0 && b < 0) {
      angle = 180 + Math.atan(-a / -b) / Math.PI * 180
    } else {
      angle = 360 - Math.atan(-a / b) / Math.PI * 180
    }
    // 等腰三角形大小
    let size = Math.max(10, line.strokeWidth * 10 / 2)
    // 三角形中心与point1的偏移量，将中心向左上方移动至点上，要把lineWidth考虑在内
    let offset = size / 2 - (line.strokeWidth * Math.cos((+angle % 90) / 180 * Math.PI)) / 2
    let arrow: FabricObject = new fabric.Triangle({
      left: point1.x - offset,
      top: point1.y - offset,
      width: size, height: size,
      fill: line.stroke,
      selectable: false, hoverCursor: 'default', excludeFromExport: true
    })
    arrow.rotate(angle)
    arrow._tType = TType.freeLineArrow
    canvas.insertAt(arrow, idx)
    canvas.renderAll()
    return arrow
  }

  private static getRealCoorOfPoint(point: Coor, line: FabricObject): Coor {
    // 原始坐标按当前缩放比例缩放
    let movementX = line.left - line._tOriLeft * line.scaleX
    let movementY = line.top - line._tOriTop * line.scaleY
    return {
      x: point.x * line.scaleX + movementX,
      y: point.y * line.scaleY + movementY
    }
  }

  static changeColor(target: FabricObject, color: Colors) {
    if (target._tType == TType.freeLine && target._tElement && target._tElement.created) {
      let tElement = target._tElement as FreeLine
      tElement.color = color
      target.set({ stroke: color })
      tElement._leftArrow && tElement._leftArrow.set({ fill: color })
      tElement._rightArrow && tElement._rightArrow.set({ fill: color })
      tElement.canvas.renderAll()
    }
  }
  static changeStyle(target: FabricObject, style: LineStyle, wrapWidth: number) {
    if (target._tType == TType.freeLine && target._tElement && target._tElement.created) {
      let tElement = target._tElement as FreeLine
      let lineWidth = SizeManager.getLineWidth(target.strokeWidth, wrapWidth)
      tElement.strokeDashArray =  style == LineStyle.dash ? SizeManager.getStrokeDashArray(lineWidth) : null
      target.set({ strokeDashArray: tElement.strokeDashArray })
      tElement.canvas.renderAll()
    }
  }
  static changeWidth(target: FabricObject, wrapWidth: number, width: LineWidth) {
    if (target._tType == TType.freeLine && target._tElement && target._tElement.created) {
      let tElement = target._tElement as FreeLine
      tElement.strokeDashArray = tElement.strokeDashArray ? SizeManager.getStrokeDashArray(width) : null
      tElement.lineWidth = SizeManager.getRealLineWidth(width, wrapWidth)
      target.set({
        strokeWidth: tElement.lineWidth,
        strokeDashArray: tElement.strokeDashArray
      })
      if (tElement._leftArrow) {
        tElement.canvas.remove(tElement._leftArrow)
        tElement.addLeftArrow()
      }
      if (tElement._rightArrow) {
        tElement.canvas.remove(tElement._rightArrow)
        tElement.addRightArrow()
      }
      tElement.canvas.renderAll()
    }
  }

}