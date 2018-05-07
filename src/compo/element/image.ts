/**
 * @author: zenggo 
 * @Date: 2018-04-26 20:29:43 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-04-28 16:11:06
 */

import { TElement, FabricCanvas, TType, FabricObject } from '../data'
const fabric = require('fabric')

export default class Image implements TElement {
  
  canvas: FabricCanvas
  host: FabricObject
  created: boolean

  _element: any

  constructor(canvas, e) {
    this.canvas = canvas
    this.start(e)
  }

  static recreate(target: FabricObject) {
    let t = {
      canvas: target.canvas,
      host: target,
      created: true
    } as Image
    t.constructor = Image
    Object.setPrototypeOf(t, Image.prototype)
    target._tElement = t
  }

  remove() {
    this.canvas.remove(this.host)
  }

  start(e) {
    if (this.created) return
    this._element = {
      offsetX: e.offsetX,
      offsetY: e.offsetY,
      node: e.target
    }
  }

  end(options, cb?) {
    if (this.created) return
    let { _element, canvas } = this
    let { layerX, layerY } = options.e
    let left = layerX - (_element.offsetX || 0),
      top = layerY - (_element.offsetY || 0)
    fabric.Image.fromURL(_element.node.src, (img: FabricObject) => {
      img.set({ left, top })
      img.scaleToWidth(_element.node.width)
      img.scaleToHeight(_element.node.height)
      canvas.add(img)
      canvas.renderAll()
      img._tType = TType.image
      img._tElement = this
      this.host = img
      this.created = true
      cb && cb(this)
    })
  }

}