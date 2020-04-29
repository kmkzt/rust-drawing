import { throttle } from './throttle'

const WIDTH = 500
const HEIGHT = 500
const THROTTLE_DELAY = 150

let closePath = false
let circulPath = false

import('../pkg')
  .then(
    ({
      // renderDraw, // RustEventHandler
      SvgDrawing,
      SvgPath,
      Point,
    }: any): void => {
      // Rust EventHandler
      // const rustDrawing = (elementId: string): void => {
      //   const app = document.getElementById(elementId)
      //   app.setAttribute(
      //     'style',
      //     `width: ${WIDTH}; height: ${HEIGHT}; border: 1px solid orange;`
      //   )
      //   renderDraw(elementId)
      // }
      // rustDrawing('app')

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
        wpath = SvgPath.new(closePath, circulPath)
        wpath.add(Point.new(x, y))
        drawApp.add(wpath.copy())
        el.innerHTML = drawApp.to_string()
        drawable = true
        console.log('START: x', x, 'y', y)
      })

      el.addEventListener(
        'mousemove',
        throttle((ev: MouseEvent) => {
          if (!drawable) return
          const rect = el.getBoundingClientRect()
          const x = ev.clientX - rect.left
          const y = ev.clientY - rect.top
          wpath.add(Point.new(x, y))
          drawApp.update(wpath.copy())
          el.innerHTML = drawApp.to_string()
          console.log('MOVE: x', x, 'y', y, wpath.isClose())
        }, THROTTLE_DELAY)
      )

      el.addEventListener('mouseup', (ev) => {
        drawable = false
        const rect = el.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        wpath.add(Point.new(x, y))
        drawApp.update(wpath)
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
      /**
       * Toggle Path Close Button
       */
      const toggleCloseButton = document.createElement('button')
      toggleCloseButton.innerHTML = 'toggle close path'
      toggleCloseButton.addEventListener('click', () => {
        closePath = !closePath
      })
      document.body.appendChild(toggleCloseButton)
      /**
       * Toggle Path Circul Button
       */
      const togglCirculButton = document.createElement('button')
      togglCirculButton.innerHTML = 'toggle circul path'
      togglCirculButton.addEventListener('click', () => {
        circulPath = !circulPath
      })
      document.body.appendChild(togglCirculButton)
    }
  )
  .catch(console.error)
