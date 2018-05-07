const fabric = require('fabric')
import FabricHelper from './fabricHelper'
import { TObject, FabricObject, TType } from './data'

export default class GroundManager {

  // 绘制球场
static getGroundObjects(sizes: any): TObject[] {
    let objs: FabricObject[] = []
    let S = sizes
    let common = {
      _tType: TType.ground,
      selectable: false, hoverCursor: 'default', excludeFromExport: true
    }
    // 明暗分界
    for (let i = 0, wid = S.GROUND_WIDTH / 20; i < 10; i++) {
      objs.push(
        new fabric.Rect({ 
          top: S.GROUND_OFFSET, left: S.GROUND_OFFSET + i * 2 * wid,
          width: wid, height: S.GROUND_HEIGHT,
          fill: '#32ac40',
          ...common
        })
      ) 
    }
    // 四边线
    objs.push(
      new fabric.Rect({ 
        top: S.GROUND_OFFSET, left: S.GROUND_OFFSET, 
        width: S.GROUND_WIDTH, height: S.GROUND_HEIGHT, 
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID,
        fill: null, 
        ...common
      })
    )
    // 中线
    objs.push(
      new fabric.Line([
        S.GROUND_OFFSET + S.GROUND_WIDTH / 2, S.GROUND_OFFSET, 
        S.GROUND_OFFSET + S.GROUND_WIDTH / 2, S.GROUND_OFFSET + S.GROUND_HEIGHT
      ], { stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, ...common })
    )
    // 中圈
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_WIDTH / 2 - S.GROUND_CEN_RADIUS,
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_CEN_RADIUS,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_CEN_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_WIDTH / 2 - S.GROUND_CEN_DOT_RADIUS,
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_CEN_DOT_RADIUS,
        radius: S.GROUND_CEN_DOT_RADIUS,
        fill: '#fff',
        ...common
      })
    )
    // 大禁区
    objs.push(
      new fabric.Rect({
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_BIG_BOX_HEI / 2, left: S.GROUND_OFFSET,
        width: S.GROUND_BIG_BOX_WID, height: S.GROUND_BIG_BOX_HEI,
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, fill: null,
        ...common
      })
    )
    objs.push(
      new fabric.Rect({
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_BIG_BOX_HEI / 2, left: S.GROUND_OFFSET + S.GROUND_WIDTH - S.GROUND_BIG_BOX_WID,
        width: S.GROUND_BIG_BOX_WID, height: S.GROUND_BIG_BOX_HEI,
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, fill: null,
        ...common
      })
    )
    // 小禁区
    objs.push(
      new fabric.Rect({
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_SM_BOX_HEI / 2, left: S.GROUND_OFFSET,
        width: S.GROUND_SM_BOX_WID, height: S.GROUND_SM_BOX_HEI,
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, fill: null,
        ...common
      })
    )
    objs.push(
      new fabric.Rect({
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_SM_BOX_HEI / 2, left: S.GROUND_OFFSET + S.GROUND_WIDTH - S.GROUND_SM_BOX_WID,
        width: S.GROUND_SM_BOX_WID, height: S.GROUND_SM_BOX_HEI,
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, fill: null,
        ...common
      })
    )
    // 点球点
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_PENALTY_LEN - S.GROUND_PENALTY_RADIUS,
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_PENALTY_RADIUS,
        radius: S.GROUND_PENALTY_RADIUS,
        fill: '#fff',
        ...common
      })
    )
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_WIDTH - S.GROUND_PENALTY_LEN - S.GROUND_PENALTY_RADIUS,
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_PENALTY_RADIUS,
        radius: S.GROUND_PENALTY_RADIUS,
        fill: '#fff',
        ...common
      })
    )
    // 弧顶
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_BIG_BOX_WID - S.GROUND_BOX_ARC_RADIUS - (S.GROUND_BOX_ARC_RADIUS - S.GROUND_BOX_ARC_RADIUS * Math.cos(Math.PI / 3)),
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_BOX_ARC_RADIUS,
        startAngle: - Math.PI / 3, endAngle: Math.PI / 3,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_BOX_ARC_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_WIDTH - S.GROUND_BIG_BOX_WID - (S.GROUND_BOX_ARC_RADIUS - S.GROUND_BOX_ARC_RADIUS * Math.cos(Math.PI / 3)),
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_BOX_ARC_RADIUS,
        startAngle: 2 * Math.PI / 3, endAngle: - 2 * Math.PI / 3,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_BOX_ARC_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
    // 球门
    objs.push(
      new fabric.Rect({
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_GOAL_HEI / 2, left: S.GROUND_OFFSET - S.GROUND_GOAL_WID,
        width: S.GROUND_GOAL_WID, height: S.GROUND_GOAL_HEI,
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, fill: null,
        ...common
      })
    )
    objs.push(
      new fabric.Rect({
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT / 2 - S.GROUND_GOAL_HEI / 2, left: S.GROUND_OFFSET + S.GROUND_WIDTH,
        width: S.GROUND_GOAL_WID, height: S.GROUND_GOAL_HEI,
        stroke: '#fff', strokeWidth: S.GROUND_LINE_WID, fill: null,
        ...common
      })
    )
    // 角旗区
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET - S.GROUND_CORNER_RADIUS,
        top: S.GROUND_OFFSET - S.GROUND_CORNER_RADIUS,
        startAngle: 0, endAngle: Math.PI / 2,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_CORNER_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_WIDTH - S.GROUND_CORNER_RADIUS,
        top: S.GROUND_OFFSET - S.GROUND_CORNER_RADIUS,
        startAngle: Math.PI / 2, endAngle: Math.PI,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_CORNER_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET + S.GROUND_WIDTH - S.GROUND_CORNER_RADIUS,
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT - S.GROUND_CORNER_RADIUS,
        startAngle: Math.PI, endAngle: Math.PI * 3 / 2,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_CORNER_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
    objs.push(
      new fabric.Circle({
        left: S.GROUND_OFFSET - S.GROUND_CORNER_RADIUS,
        top: S.GROUND_OFFSET + S.GROUND_HEIGHT - S.GROUND_CORNER_RADIUS,
        startAngle: Math.PI * 3 / 2, endAngle: 0,
        strokeWidth: S.GROUND_LINE_WID,
        radius: S.GROUND_CORNER_RADIUS,
        fill: null,
        stroke: '#fff',
        ...common
      })
    )
  
    return objs.map(o => FabricHelper.fabricObject2Obj(o))
  }
}