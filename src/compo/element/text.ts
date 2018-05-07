/**
 * @author: zenggo 
 * @Date: 2018-05-02 13:57:13 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-02 18:00:22
 */

import { TElement, FabricCanvas, TType, FabricObject, Colors } from '../data'
const fabric = require('fabric')
import FabricHelper from '../fabricHelper'

export default class Text implements TElement {
  
  canvas: FabricCanvas
  host: FabricObject
  created: boolean

  color: Colors

  constructor(canvas: FabricCanvas, color: Colors) {
    this.canvas = canvas
    this.color = color
    this.add = this.add.bind(this)
    this.endEdit = this.endEdit.bind(this)
    this.start()
  }

  static recreate(target: FabricObject) {
    let t = {
      canvas: target.canvas,
      host: target,
      created: true
    } as Text
    t.constructor = Text
    Object.setPrototypeOf(t, Text.prototype)
    t.add = t.add.bind(t)
    t.endEdit = t.endEdit.bind(t)
    target._tElement = t
  }

  remove() {
    this.canvas.remove(this.host)
  }

  start() {
    FabricHelper.disableAllSelect(this.canvas)
    this.canvas.on('mouse:down', this.add)
  }

  end() {
    if (this.created) return
    this.canvas.off('mouse:down', this.add)
    this.created = true
  }

  add(options) {
    let { canvas } = this
    let { offsetX, offsetY } = options.e
    let text: FabricObject = new fabric.IText("", {
      left: offsetX, top: offsetY,
      fontSize: 20, fill: this.color
    })
    canvas.add(text)
    text._tElement = this
    text._tType = TType.text
    this.host = text
    this.end()
    canvas.setActiveObject(text)
    text.enterEditing()
    FabricHelper.enableAllSelect(this.canvas)
    canvas.renderAll()
  }

  startEdit() {
    this.canvas.on('selection:cleared', this.endEdit)
    this.canvas.on('selection:updated', this.endEdit)
  }

  endEdit() {
    if (this.host && !this.host.text) {
      this.remove()
    }
    this.canvas.off('selection:cleared', this.endEdit)
    this.canvas.off('selection:updated', this.endEdit)
  }

  static setColor(target: Text, color: Colors) {
    if (target && target instanceof Text) {
      target.color = color
    }
  }

  static changeColor(target: FabricObject, color: Colors) {
    if (target && target._tType == TType.text) {
      let t = target._tElement as Text
      t.color = color
      t.host && t.host.set({ fill: color })
      target.canvas.renderAll()
    }
  }

}