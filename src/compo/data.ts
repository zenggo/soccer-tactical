
export enum Modes {
  'normal' = 1,
  'imageAdding' = 2,
  'imageSelected' = 3,
  'freeDrawing' = 4,
  'freeDrawSelected' = 5,
  'freeLining' = 6,
  'freeLineSelected' = 7,
  'adjustFreeLine' = 8,
  'groupSelected' = 9,
  'addText' = 10,
  'textSelected' = 11
}

export enum TType {
  ground = 0,
  image = 1, // image
  freeDraw = 2, // path
  freeLine = 3, // polyline
  freeLineArrow = 4, // triangle
  text = 5, // i-text
}

export const TTypeSelectable = {
  [TType.ground]: false,
  [TType.image]: true,
  [TType.freeDraw]: true,
  [TType.freeLine]: true,
  [TType.freeLineArrow]: false,
  [TType.text]: true
}

export interface TInfo {
  wrapWidth: number
  tObjects: TObject[]
}

interface THelpers {
  // 辅助属性
  _tType: TType
  // freeLine
  _tOriLeft?: number // 创建时的left与top
  _tOriTop?: number
  _tHasLeftArrow: boolean
  _tHasRightArrow: boolean
}

export interface TElement {
  host: FabricObject
  canvas: FabricCanvas
  created: boolean
  remove: () => void
}

// toObject():
// FabricObject => TObject
// FabricCanvas => FabricCanvasObject

export interface TObject extends THelpers { // fabric Object.toObject() 导出的对象，加了一些辅助属性
  // fabric原生属性
  type: string
  [attr: string]: any
}

export interface FabricObject extends THelpers { // fabric Object对象
  // fabric原生属性
  type: string
  toObject: (properties?: string[]) => TObject
  canvas: FabricCanvas
  [attr: string]: any
  // tElement
  _tElement?: TElement
}

export interface FabricCanvas { // fabric Canvas对象
  toObject: (properties?: string[]) => FabricCanvasObject
  _objects: FabricObject[]
  item: (number) => FabricObject
  [attr: string]: any
}

export interface FabricCanvasObject { // fabric Canvas.toObject() 导出的对象, 加上一些辅助属性
  [attr: string]: any
  background?: string
  objects: TObject[]
}

export const BgColor = '#279e3d'

export enum Colors {
  'black' = '#232526',
  'red' = '#cc1c23',
  'blue' = '#0d75c5',
  'yellow' = '#eebc12'
}

export enum LineStyle {
  'normal' = 1,
  'dash' = 2
}

export enum LineWidth {
  'sm' = 1,
  'md' = 3,
  'lg' = 5
}