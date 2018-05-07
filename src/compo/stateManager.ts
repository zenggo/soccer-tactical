/**
 * @author: zenggo 
 * @Date: 2018-04-28 15:59:31 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-02 16:32:15
 */

import { FabricObject, FabricCanvas, TInfo } from './data'
import FabricHelper from './fabricHelper'

const MAXDEPTH = 50

export default class StateManager {

  canvas: FabricCanvas
  wrapWidth: number
  states: TInfo[]
  cursor: number

  constructor(canvas: FabricCanvas, wrapWidth: number) {
    this.canvas = canvas
    this.wrapWidth = wrapWidth
    this.states = [ FabricHelper.createTInfo(canvas, wrapWidth) ]
    this.cursor = 0
    window['_state'] = this // TODO:
  }

  updateCanvas(newCanvas: FabricCanvas) {
    this.canvas = newCanvas
  }
  updateWrapWidth(newWidth: number) {
    this.wrapWidth = newWidth
  }

  undoAble() {
    return this.cursor > 0
  }
  redoAble() {
    return this.cursor < (this.states.length - 1)
  }

  back(): TInfo {
    if (this.undoAble()) {
      this.cursor --
      return this.states[this.cursor]
    }
  }

  forward(): TInfo {
    if (this.redoAble()) {
      this.cursor ++
      return this.states[this.cursor]
    }
  }

  update(): TInfo {
    let newTInfo = FabricHelper.createTInfo(this.canvas, this.wrapWidth)
    if (this.cursor === (this.states.length - 1)) {
      this.states.push(newTInfo)
    } else {
      this.states = [ ...this.states.slice(0, this.cursor + 1), newTInfo ]
    }
    let len = this.states.length
    if (len > MAXDEPTH) {
      this.states = this.states.slice(len - MAXDEPTH, MAXDEPTH)
    }
    this.cursor = this.states.length - 1
    return newTInfo
  }

  getNow(): TInfo {
    return this.states[this.cursor]
  }

}