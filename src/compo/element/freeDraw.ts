/**
 * @author: zenggo 
 * @Date: 2018-04-27 10:37:41 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-02 18:16:08
 */

import { TElement, TType, FabricObject, FabricCanvas, LineStyle, LineWidth, Colors } from '../data'
const fabric = require('fabric')
import SizeManager from '../sizeManager'
import FabricHelper from '../fabricHelper'

export default class FreeDraw implements TElement {

  canvas: FabricCanvas
  host: FabricObject
  created: boolean

  constructor(canvas: FabricCanvas, target: FabricObject) {
    this.canvas = canvas
    this.host = target
    this.created = true
  }

  remove() {
    this.canvas.remove(this.host)
  }

  static recreate(target: FabricObject) {
    target._tElement = new FreeDraw(target.canvas, target)
  }

  static create(target: FabricObject) {
    target._tType = TType.freeDraw
    target._tElement = new FreeDraw(target.canvas, target)
    return target._tElement
  }

  static start(canvas: FabricCanvas, wrapWidth: number, color: Colors, width: LineWidth, style: LineStyle) {
    FabricHelper.disableAllSelect(canvas)
    canvas.isDrawingMode = true
    canvas.freeDrawingBrush.color = color
    canvas.freeDrawingBrush.width = SizeManager.getRealLineWidth(width, wrapWidth)
    canvas.freeDrawingBrush.strokeDashArray = (style == LineStyle.normal) ? null : SizeManager.getStrokeDashArray(width)
    canvas.on('object:added', FreeDraw.onAdded)
  }

  static end(canvas: FabricCanvas) {
    canvas.isDrawingMode = false
    canvas.off('object:added', FreeDraw.onAdded)
    FabricHelper.enableAllSelect(canvas)
  }

  private static onAdded(options) {
    let target: FabricObject = options.target
    if (!target._tType && target.type == 'path') { // 防止sink时、redo、undo时重复触发
      let element = FreeDraw.create(target)
      FreeDraw.sink(element)
      element.canvas._onFreeDrawAdded && element.canvas._onFreeDrawAdded()
    }
  }

  static setColor(canvas: FabricCanvas, color: Colors) {
    canvas.freeDrawingBrush.color = color
  }
  static changeColor(target: FabricObject, color: Colors) {
    target.set({ stroke: color })
    target.canvas.renderAll()
  }

  static setStyle(canvas: FabricCanvas, style: LineStyle, width: LineWidth) {
    canvas.freeDrawingBrush.strokeDashArray = style == LineStyle.normal ? null : SizeManager.getStrokeDashArray(width)
  }
  static changeStyle(target: FabricObject, style: LineStyle, wrapWidth: number) {
    let lineWidth = SizeManager.getLineWidth(target.strokeWidth, wrapWidth)
    target.set({
      strokeDashArray: style == LineStyle.normal ? null : SizeManager.getStrokeDashArray(lineWidth)
    })
    target.canvas.renderAll()
  }

  static setWidth(canvas: FabricCanvas, wrapWidth: number, width: LineWidth, style: LineStyle) {
    canvas.freeDrawingBrush.width = SizeManager.getRealLineWidth(width, wrapWidth)
    // 同时切lineStyle
    canvas.freeDrawingBrush.strokeDashArray = style == LineStyle.normal ? null : SizeManager.getStrokeDashArray(width)
  }
  static changeWidth(target: FabricObject, wrapWidth: number, width: LineWidth) {
    target.set({
      strokeWidth: SizeManager.getRealLineWidth(width, wrapWidth),
      strokeDashArray: target.strokeDashArray ? SizeManager.getStrokeDashArray(width) : null
    })
    target.canvas.renderAll()
  }

  static sink(target: FreeDraw) { // 沉到images,text下面
    let { canvas, host } = target
    let firstImgObjIdx = canvas._objects.findIndex(obj => {
      return obj._tType == TType.image || obj._tType == TType.text
    })
    canvas.remove(host)
    canvas.insertAt(host, firstImgObjIdx)
    canvas.renderAll()
  }

}