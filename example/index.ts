import { throttle, debounce } from 'throttle-debounce'

const WIDTH = 500
const HEIGHT = 500
const THROTTLE_DELAY = 20

import('../pkg')
  .then(({ renderDraw, SvgDrawing, SvgPath, Point }: any): void => {
    renderDraw('app')
    console.log(SvgPath)

    /**
     * Draw app
     */
    const el = document.createElement('div')
    el.setAttribute(
      'style',
      `width: ${WIDTH}; height: ${HEIGHT}; border: 1px solid #000;`
    )
    const drawApp: any = SvgDrawing.new(WIDTH, HEIGHT)
    let wpath: any = null
    let drawable = false
    el.addEventListener('mousedown', (ev) => {
      const rect = el.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      wpath = SvgPath.new()
      wpath.add(Point.new(x, y))
      drawable = true
      console.log('START: x', x, 'y', y)
    })

    el.addEventListener(
      'mousemove',
      throttle(THROTTLE_DELAY, (ev: MouseEvent) => {
        if (!drawable) return
        const rect = el.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        wpath.add(Point.new(x, y))
        console.log('MOVE: x', x, 'y', y)
      })
    )

    el.addEventListener('mouseup', (ev) => {
      drawable = false
      const rect = el.getBoundingClientRect()
      const x = ev.clientX - rect.left
      const y = ev.clientY - rect.top
      wpath.add(Point.new(x, y))
      drawApp.add(wpath)
      el.innerHTML = drawApp.to_string()
      console.log('END: x', x, 'y', y)
    })
    document.body.appendChild(el)
    /**
     * ClearButton
     */
    const clearBtn = document.createElement('button')
    clearBtn.innerHTML = 'clear'
    clearBtn.addEventListener('click', () => {
      drawApp.clear()
      el.innerHTML = drawApp.to_string()
    })
    document.body.appendChild(clearBtn)
  })
  .catch(console.error)
