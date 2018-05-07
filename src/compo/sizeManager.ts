/**
 * @author: zenggo 
 * @Date: 2018-04-23 15:44:29 
 * @Last Modified by: zenggo
 * @Last Modified time: 2018-05-02 17:12:58
 */

import { TInfo, TObject, LineWidth } from './data'

const DEFAULT_WRAP_WIDTH = 1500
const S = { // 单位 m
  SELECTION_LINE_WIDTH: 0.2,
  // 球场
  GROUND_WIDTH: 110,
  GROUND_HEIGHT: 68,
  GROUND_OFFSET: 5,
  GROUND_LINE_WID: 0.3,
  GROUND_CEN_RADIUS: 9.15,
  GROUND_CEN_DOT_RADIUS: 0.8,
  GROUND_BIG_BOX_WID: 16.5,
  GROUND_BIG_BOX_HEI: 40.3,
  GROUND_SM_BOX_WID: 5.5,
  GROUND_SM_BOX_HEI: 15.1,
  GROUND_PENALTY_LEN: 11,
  GROUND_PENALTY_RADIUS: 0.5,
  GROUND_BOX_ARC_RADIUS: 9.15,
  GROUND_CORNER_RADIUS: 2,
  GROUND_GOAL_WID: 2,
  GROUND_GOAL_HEI: 7.3,
  // canvas
  COPY_OFFSET: 1
}

export default class SizeManager {
  
  static getSize(WRAPWIDTH: number) {
    const SCALE = WRAPWIDTH / DEFAULT_WRAP_WIDTH * 10
    let sizes: any = {}
    sizes.WRAPWIDTH = WRAPWIDTH
    for (let key in S) {
      sizes[key] = Math.ceil(S[key] * SCALE)
    }
    // 球场画布
    sizes.canvasWidth = sizes.GROUND_WIDTH + 2 * sizes.GROUND_OFFSET
    sizes.canvasHeight = sizes.GROUND_HEIGHT + 2 * sizes.GROUND_OFFSET
    // 底部功能条
    const toolBarHeight = 30
    // 左侧面板
    sizes.panelWidth = WRAPWIDTH - sizes.canvasWidth
    sizes.panelHeight = sizes.GROUND_HEIGHT + 2 * sizes.GROUND_OFFSET
    // 球员图标
    sizes.playerSize = WRAPWIDTH / DEFAULT_WRAP_WIDTH * 50
    return sizes
  }

  // 按之前保存的wrap宽度与现在的宽度缩放
  static scaleObjects(formalInfo: TInfo, newWrapWidth: number): TObject[] {
    let { wrapWidth, tObjects } = formalInfo
    let scale = newWrapWidth / wrapWidth
    return tObjects.map(obj => {
      return Object.assign({}, obj, {
        left: Math.ceil(obj.left * scale),
        top: Math.ceil(obj.top * scale),
        scaleX: obj.scaleX * scale,
        scaleY: obj.scaleY * scale
      })
    })
  }

  // 获取笔刷大小
  static getRealLineWidth(width: LineWidth, wrapWidth: number): number {
    return wrapWidth / DEFAULT_WRAP_WIDTH * width
  }
  static getLineWidth(width: number, wrapWidth: number): LineWidth {
    let w = width * DEFAULT_WRAP_WIDTH / wrapWidth
    let offset = [ LineWidth.lg - w, LineWidth.md - w, LineWidth.sm - w ]
    offset = offset.map(o => Math.abs(o))
    let idx = offset.indexOf(Math.min(...offset))
    if (idx == 0) return LineWidth.lg
    if (idx == 1) return LineWidth.md
    if (idx == 2) return LineWidth.sm
  }
  static getStrokeDashArray(lineWidth: LineWidth) {
    if (lineWidth == LineWidth.sm) return [ 5, 5 ]
    if (lineWidth == LineWidth.md) return [ 15, 15 ]
    if (lineWidth == LineWidth.lg) return [ 25, 25 ]
  }

}