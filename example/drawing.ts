import { throttle } from './throttle'
import { downloadBlob } from './download'

interface Point {
  x: number
  y: number
}
interface DrawingOption {
  pathClose?: boolean
  pathCirculer?: boolean
  delay?: number
}

export class Drawing {
  public pathClose = false

  public pathCirculer = false

  public fill = 'none'

  public stroke = 'black'

  public strokeWidth = 1.0

  public delay: number

  private el: HTMLElement

  private drawable = false

  private stopListener: any

  private wpath: any

  private app: any

  private redoList: any[] = []

  // Wasm instance
  private static Mod: any = null

  constructor(
    el: HTMLElement,
    { pathClose, pathCirculer, delay }: DrawingOption
  ) {
    // set parameter
    this.el = el
    this.pathClose = pathClose ?? false
    this.pathCirculer = pathCirculer ?? false
    this.delay = delay ?? 20

    // bind methods
    this.init = this.init.bind(this)
    this.handleMouse = this.handleMouse.bind(this)
    this.drawStart = this.drawStart.bind(this)
    this.drawMove = this.drawMove.bind(this)
    this.drawEnd = this.drawEnd.bind(this)
    this.startListener = this.startListener.bind(this)

    this.toBase64 = this.toBase64.bind(this)
    this.download = this.download.bind(this)
    this.downloadBlob = this.downloadBlob.bind(this)
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

  public init() {
    const { width, height } = this.el.getBoundingClientRect()
    this.app = Drawing.Mod.SvgDrawing.new(width, height)
    this.stopListener = this.startListener()
  }

  public changeThrottle(ms: number) {
    this.delay = ms
    if (this.stopListener) {
      this.stopListener()
    }
    this.stopListener = this.startListener()
  }

  public clear() {
    this.app.clear()
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

  public toBase64(): string {
    return `data:image/svg+xml;base64,${btoa(this.app.to_string())}`
  }

  public download(): void {
    downloadBlob(this.toBase64(), 'svg')
  }

  public downloadBlob(ext: 'jpg' | 'png'): void {
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
    img.src = this.toBase64()
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

  private handleMouse(cb: (po: Point) => void) {
    return (ev: MouseEvent): void => {
      ev.preventDefault()
      const rect = this.el.getBoundingClientRect()
      cb({ x: ev.clientX - rect.left, y: ev.clientY - rect.top })
    }
  }

  // private handleTouch(cb: (po: Point) => void) {
  //   return (ev: TouchEvent): void => {
  //     const touch = ev.changedTouches[0]
  //     const rect = this.el.getBoundingClientRect()
  //     cb({ x: touch.clientX - rect.left, y: touch.clientY - rect.top })
  //   }
  // }

  private drawStart({ x, y }: Point) {
    this.wpath = this.createPath()
    this.wpath.add(Drawing.createPoint(x, y))
    this.app.add(this.wpath.copy())
    this.render()
    this.drawable = true
    console.log('START: x', x, 'y', y)
  }

  private drawMove({ x, y }: Point) {
    if (!this.drawable) return
    this.wpath.add(Drawing.createPoint(x, y))
    this.app.update(this.wpath.copy())
    this.render()
    console.log('MOVE: x', x, 'y', y, this.wpath.isClose())
  }

  private drawEnd({ x, y }: Point) {
    if (!this.drawable) return
    this.drawable = false
    this.wpath.add(Drawing.createPoint(x, y))
    this.app.update(this.wpath)
    this.render()
    console.log('END: x', x, 'y', y)
  }

  /**
   * TODO: add Pointer or Touch Listener
   */
  private startListener(): () => void {
    // if (navigator.userAgent.includes('Mobile')) {
    //   const stopListener = this.touchListener()
    //   return () => stopListener()
    // }
    const stopListener = this.mouseListener()
    return () => stopListener()
  }

  // private touchListener() {
  //   const start = this.handleTouch(this.drawStart)
  //   const move = throttle(this.handleTouch(this.drawMove), this.delay)
  //   const end = this.handleTouch(this.drawEnd)
  //   this.el.addEventListener('touchstart', start)
  //   this.el.addEventListener('touchmove', move)
  //   this.el.addEventListener('touchend', end)

  //   return (): void => {
  //     this.el.removeEventListener('touchstart', start)
  //     this.el.removeEventListener('touchmove', move)
  //     this.el.removeEventListener('touchend', end)
  //   }
  // }

  private mouseListener() {
    const start = this.handleMouse(this.drawStart)
    const move = throttle(this.handleMouse(this.drawMove), this.delay)
    const end = this.handleMouse(this.drawEnd)
    this.el.addEventListener('mousedown', start)
    this.el.addEventListener('mousemove', move)
    this.el.addEventListener('mouseup', end)
    this.el.addEventListener('mouseleave', end)

    return (): void => {
      this.el.removeEventListener('mousedown', start)
      this.el.removeEventListener('mousemove', move)
      this.el.removeEventListener('mouseup', end)
      this.el.removeEventListener('mouseleave', end)
    }
  }

  private render() {
    this.el.innerHTML = this.app.to_string()
  }
}
