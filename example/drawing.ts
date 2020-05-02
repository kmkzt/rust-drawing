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

  public toBase64(): string {
    return `data:image/svg+xml;base64,${btoa(this.app.to_string())}`
  }

  public download(): void {
    downloadBlob(this.toBase64(), 'svg')
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

  private handleMouse(cb: (arg: Point) => void) {
    return (ev: MouseEvent): void => {
      const rect = this.el.getBoundingClientRect()
      cb({ x: ev.clientX - rect.left, y: ev.clientY - rect.top })
    }
  }

  private drawStart({ x, y }: Point) {
    this.wpath = this.createPath()
    this.wpath.add(Drawing.createPoint(x, y))
    this.app.add(this.wpath.copy())
    this.el.innerHTML = this.app.to_string()
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
    this.drawable = false
    this.wpath.add(Drawing.createPoint(x, y))
    this.app.update(this.wpath)
    this.render()
    console.log('END: x', x, 'y', y)
  }

  /**
   * TODO: add Pointer or Touch Listener
   */
  private startListener() {
    const handleMouseDown = this.handleMouse(this.drawStart)
    const handleMouseMove = throttle(
      this.handleMouse(this.drawMove),
      this.delay
    )
    const handleMouseUp = this.handleMouse(this.drawEnd)
    this.el.addEventListener('mousedown', handleMouseDown)
    this.el.addEventListener('mousemove', handleMouseMove)
    this.el.addEventListener('mouseup', handleMouseUp)

    return (): void => {
      this.el.removeEventListener('mousedown', handleMouseDown)
      this.el.removeEventListener('mousemove', handleMouseMove)
      this.el.removeEventListener('mouseup', handleMouseUp)
    }
  }

  private render() {
    this.el.innerHTML = this.app.to_string()
  }
}
