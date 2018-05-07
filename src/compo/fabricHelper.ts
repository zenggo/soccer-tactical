/**
 * @author: zenggo 
 * @Date: 2018-04-26 16:56:51 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-02 16:12:46
 */

const fabric = require('fabric')
import { TObject, FabricObject, TType, TTypeSelectable, FabricCanvas, FabricCanvasObject, BgColor, Modes, TInfo } from './data'
import Ele_Image from './element/image'
import Ele_FreeDraw from './element/freeDraw'
import Ele_FreeLine from './element/freeLine'
import Ele_Text from './element/text'

const attrNeedExport = [
  'selectable',
  'hoverCursor',
  'excludeFromExport',
  '_tType',
  '_tOriLeft',
  '_tOriTop',
  '_tHasLeftArrow',
  '_tHasRightArrow'
]

export default class FabricHelper {
  
  static createCanvas(sizes): FabricCanvas {
    let canvas = new fabric.Canvas('canvas', {
      selectionColor: 'rgba(22,22,22,0.2)',
      selectionLineWidth: sizes.SELECTION_LINE_WIDTH
    })
    // 选择框颜色
    fabric.Object.prototype.borderColor = 'rgb(251,184,2)'
    fabric.Object.prototype.cornerColor = 'rgb(251,184,2)'
    // 选中元素时不提升到顶部
    canvas.preserveObjectStacking = true
    return canvas
  }

  static createTInfo(canvas: FabricCanvas, wrapWidth: number): TInfo {
    return {
      wrapWidth,
      tObjects: FabricHelper.fabricCanvas2Obj(canvas).objects
    }
  }

  private static fabricCanvas2Obj(canvas: FabricCanvas): FabricCanvasObject {
    return canvas.toObject(attrNeedExport)
  }

  static fabricObject2Obj(object: FabricObject): TObject {
    return object.toObject(attrNeedExport)
  }

  static createFabricCanvasObject(groundObjs: TObject[], objects?: TObject[]): FabricCanvasObject {
    return {
      background: BgColor,
      objects: groundObjs.concat(objects || [])
    }
  }

  static recreateTElements(objects: FabricObject[]) {
    let _objs = [].concat(objects) // 因为recreate会修改canvas._objects(objects)，所以循环不能用objects
    _objs.forEach(obj => {
      switch (obj._tType) {
        case TType.image: Ele_Image.recreate(obj); break;
        case TType.freeDraw: Ele_FreeDraw.recreate(obj); break;
        case TType.freeLine: Ele_FreeLine.recreate(obj); break;
        case TType.text: Ele_Text.recreate(obj); break;
      }
    })
  }

  static deselectAll(canvas: FabricCanvas) {
    canvas.discardActiveObject()
    canvas.renderAll()
  }

  static disableAllSelect(canvas: FabricCanvas) {
    canvas.selection = false
    canvas._objects.forEach((obj, idx) => {
      obj.selectable = false
      obj.hoverCursor = 'default'
    })
    canvas.renderAll()
  }
  static enableAllSelect(canvas: FabricCanvas) {
    canvas.selection = true
    canvas._objects.forEach((obj, idx) => {
      let { _tType } = obj
      if (TTypeSelectable[_tType]) {
        obj.selectable = true
        obj.hoverCursor = 'move'
      }
    })
    canvas.renderAll()
  }

  static bringUpSelected(canvas: FabricCanvas) {
    let selected = canvas.getActiveObject()
    canvas.bringForward(selected, true)
  }
  static sendBackwardSelected(canvas: FabricCanvas) {
    let selected = canvas.getActiveObject()
    let objs: FabricObject[] = selected.get('type') === 'activeSelection' ? selected._objects : [selected]
    let lowestIdx = Math.min(...objs.map(o => canvas._objects.indexOf(o)))
    if (canvas.item(lowestIdx - 1)._tType !== TType.ground) {
      canvas.sendBackwards(selected, true)
    }
  }
  static deleteSelected(canvas: FabricCanvas) {
    let selected = canvas.getActiveObject()
    let objs: FabricObject[] = selected.get('type') === 'activeSelection' ? selected._objects : [selected]
    canvas.discardActiveObject()
    objs.forEach(o => o._tElement.remove())
  }
  static copySelected(canvas: FabricCanvas, S: any): Promise<FabricObject> {
    let selected = canvas.getActiveObject()
    return new Promise(resolve => {
      selected.clone(cloned => {
        cloned.set({
          left: cloned.left + S.COPY_OFFSET,
          top: cloned.top + S.COPY_OFFSET,
          evented: true
        })
        if (cloned.get('type') === 'activeSelection') {
          cloned._objects.forEach((obj: FabricObject, idx) => {
            obj._tType = selected._objects[idx]._tType
            canvas.add(obj)
          })
          FabricHelper.recreateTElements(cloned._objects)
        } else {
          cloned._tType = selected._tType
          canvas.insertAt(cloned, canvas._objects.indexOf(selected))
          FabricHelper.recreateTElements([cloned])
        }
        canvas.setActiveObject(cloned)
        canvas.renderAll()
        resolve(cloned)
      })  
    })
  }

}