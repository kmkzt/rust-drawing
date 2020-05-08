import { throttle } from './throttle'
import { downloadBlob } from './download'

const getPassiveOption = (passive = true): boolean | { passive: boolean } => {
  try {
    const check = () => null
    window.addEventListener('testPassive', check, { passive })
    window.removeEventListener('testPassive', check)
    return { passive }
  } catch (e) {
    return false
  }
}

interface Point {
  x: number
  y: number
}

interface PathData {
  fill: string
  stroke: string
  strokeWidth: number
  data: Point[]
}
interface DrawingOption {
  pathClose?: boolean
  pathCirculer?: boolean
  fill?: string
  stroke?: string
  strokeWidth?: number
}

/**
 * TODO: Add Edit Mode
 */
export const enum DrawingMode {
  Pencil,
  Pen,
}

/**
 * TODO: add Wasm instance types
 */
export class Drawing {
  public pathClose = false

  public pathCirculer = false

  public fill: string

  public stroke: string

  public strokeWidth: number

  public pencilThrottle: number

  private el: HTMLElement

  private app?: any

  private stopPencil?: () => void

  private stopPen?: () => void

  private redoList: any[] = []

  private mode: DrawingMode = DrawingMode.Pencil

  // Wasm instance
  private static Mod: any = null

  constructor(
    el: HTMLElement,
    { pathClose, pathCirculer, fill, stroke, strokeWidth }: DrawingOption
  ) {
    // set parameter
    this.el = el
    this.pathClose = pathClose ?? false
    this.pathCirculer = pathCirculer ?? true
    this.fill = fill ?? 'none'
    this.stroke = stroke ?? '#000'
    this.strokeWidth = strokeWidth ?? 1
    this.pencilThrottle = 20

    // Load Drawing WASM Module
    if (!Drawing.Mod) {
      import('../pkg')
        .then((mod: any): void => {
          Drawing.Mod = mod
          this.init()
        })
        .catch(console.error)
    } else {
      this.init()
    }
  }

  public clear() {
    this.app.clear()
    this.redoList = []
    this.render()
  }

  public undo() {
    this.redoList.push(this.app.undo())
    this.render()
  }

  public redo() {
    const path = this.redoList.pop()
    if (!path) return
    this.app.add(path)
    this.render()
  }

  public download(ext: 'svg' | 'jpg' | 'png' = 'svg'): void {
    const svgResource = `data:image/svg+xml;base64,${btoa(
      this.app.to_string()
    )}`
    if (ext === 'svg') {
      downloadBlob(svgResource, 'svg')
    }
    const img: any = new Image()
    const drawImage = () => {
      const canvas = document.createElement('canvas')
      const { width, height } = this.el.getBoundingClientRect()
      canvas.setAttribute('width', String(width))
      canvas.setAttribute('height', String(height))
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0)
      if (ext === 'jpg') {
        downloadBlob(canvas.toDataURL('image/jpeg'), 'jpg')
      } else {
        downloadBlob(canvas.toDataURL('image/png'), 'png')
      }
    }
    img.addEventListener('load', drawImage, false)
    img.src = svgResource
  }

  private createPath(): any {
    const pa = Drawing.Mod.SvgPath.new(this.pathClose, this.pathCirculer)
    pa.setFill(this.fill)
    pa.setStroke(this.stroke)
    pa.setStrokeWidth(this.strokeWidth)
    return pa
  }

  private static createPoint(x: number, y: number): any {
    return Drawing.Mod.Point.new(x, y)
  }

  public updatePencil(ms?: number): void {
    if (ms) {
      this.pencilThrottle = ms
    }
    this.initPencil()
  }

  public changeMode(mode: DrawingMode) {
    this.mode = mode
    this.init()
  }

  private init() {
    if (!this.app) {
      const { width, height } = this.el.getBoundingClientRect()
      this.app = Drawing.Mod.SvgDrawing.new(width, height)
    }

    this.initPencil()
    this.initPen()
    this.initResizeElement()
  }

  private initPen(): void {
    let wpath: any | null = null
    if (this.stopPen) {
      this.stopPen()
      this.stopPen = undefined
    }
    if (this.mode !== DrawingMode.Pen) return
    const clickListener = () => {
      const handleClick = (ev: MouseEvent): void => {
        if (!this.el.contains(ev.target as any)) {
          wpath = null
          return
        }
        const { clientX, clientY } = ev
        const { left, top } = this.el.getBoundingClientRect()
        const x = clientX - left
        const y = clientY - top
        if (!wpath) {
          wpath = this.createPath()
          wpath.add(Drawing.createPoint(x, y))
          this.app.add(wpath.copy())
        } else {
          wpath.add(Drawing.createPoint(x, y))
          this.app.update(wpath.copy())
        }
        this.render()
      }
      window.addEventListener('click', handleClick)
      return () => {
        wpath = null
        window.removeEventListener('click', handleClick)
      }
    }
    this.stopPen = clickListener()
  }

  /**
   * TODO: optimize move listener.
   */
  private initPencil(): void {
    let drawable = false
    let wpath: any | null = null
    if (this.stopPencil) {
      this.stopPencil()
      this.stopPencil = undefined
    }
    if (this.mode !== DrawingMode.Pencil) return
    const drawStart = ({ x, y }: Point) => {
      // console.log('START: x', x, 'y', y)
      wpath = this.createPath()
      wpath.add(Drawing.createPoint(x, y))
      this.app.add(wpath.copy())
      this.render()
      drawable = true
    }

    const drawMove = ({ x, y }: Point) => {
      // console.log('MOVE: x', x, 'y', y)
      if (!drawable) return
      wpath.add(Drawing.createPoint(x, y))
      this.app.update(wpath.copy())
      this.render()
    }

    const drawEnd = ({ x, y }: Point) => {
      // console.log('END: x', x, 'y', y)
      if (!drawable) return
      drawable = false
      wpath.add(Drawing.createPoint(x, y))
      this.app.update(wpath)
      this.render()
    }

    if (navigator.userAgent.includes('Mobile')) {
      const handleTouch = (cb: (po: Point) => void) => (
        ev: TouchEvent
      ): void => {
        ev.preventDefault()
        const touch = ev.changedTouches[0]
        const rect = this.el.getBoundingClientRect()
        cb({ x: touch.clientX - rect.left, y: touch.clientY - rect.top })
      }
      const touchListener = () => {
        const start = handleTouch(drawStart)
        const handleMove = handleTouch(drawMove)
        const move = throttle(handleMove, this.pencilThrottle)
        const end = handleTouch(drawEnd)
        const opt = getPassiveOption(false)

        this.el.addEventListener('touchstart', start, opt)
        this.el.addEventListener('touchmove', move, opt)
        this.el.addEventListener('touchend', end, opt)
        // this.el.addEventListener('touchcancel', end, opt)

        return (): void => {
          this.el.removeEventListener('touchstart', start)
          this.el.removeEventListener('touchmove', move)
          this.el.removeEventListener('touchend', end)
          // this.el.removeEventListener('touchcancel', end)
        }
      }

      this.stopPencil = touchListener()
    }

    const mouseListener = () => {
      const handleMouse = (cb: (po: Point) => void) => (
        ev: MouseEvent
      ): void => {
        ev.preventDefault()
        const rect = this.el.getBoundingClientRect()
        cb({ x: ev.clientX - rect.left, y: ev.clientY - rect.top })
      }

      const start = handleMouse(drawStart)
      const move = throttle(handleMouse(drawMove), this.pencilThrottle)
      const end = handleMouse(drawEnd)
      const opt = getPassiveOption(false)
      this.el.addEventListener('mousedown', start, opt)
      this.el.addEventListener('mousemove', move, opt)
      this.el.addEventListener('mouseup', end, opt)
      this.el.addEventListener('mouseleave', end, opt)

      return (): void => {
        this.el.removeEventListener('mousedown', start)
        this.el.removeEventListener('mousemove', move)
        this.el.removeEventListener('mouseup', end)
        this.el.removeEventListener('mouseleave', end)
      }
    }
    this.stopPencil = mouseListener()
  }

  private initResizeElement() {
    if ((window as any).ResizeObserver) {
      const resizeObserver: any = new (window as any).ResizeObserver(
        (entries: any[]) => {
          const { width, height }: any = entries[0].contentRect
          this.app.changeSize(width, height)
          this.render()
        }
      )
      resizeObserver.observe(this.el)
    }
  }

  /**
   * generate Wasm Instance Data
   */
  private getSvgData(): PathData[] {
    const svgData: PathData[] = []
    for (let i = 0; i < this.app.getPathLength(); i += 1) {
      const path = this.app.getPath(i)
      const data: Point[] = []
      for (let u = 0; u < path.getPointLength(); u += 1) {
        const point = path.getPoint(u)
        data.push({
          x: point.getX(),
          y: point.getY(),
        })
      }
      svgData.push({
        data,
        fill: path.getFill(),
        stroke: path.getStroke(),
        strokeWidth: path.getStrokeWidth(),
      })
    }
    return svgData
  }

  /**
   * TODO: optimize render
   */
  private render() {
    if (process.env.NODE_ENV === 'development') {
      console.log(this.getSvgData())
    }
    this.el.innerHTML = this.app.to_string()
  }
}
