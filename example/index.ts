import { throttle } from './throttle'

const WIDTH = 500
const HEIGHT = 500

let throttleDelay = 150
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
      const handlePoint = (cb: (arg: { x: number; y: number }) => void) => (
        ev: MouseEvent
      ): void => {
        const rect = el.getBoundingClientRect()
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        cb({ x, y })
      }
      const setupDrawing = (): (() => void) => {
        const handleMouseDown = handlePoint(({ x, y }) => {
          wpath = SvgPath.new(closePath, circulPath)
          wpath.add(Point.new(x, y))
          drawApp.add(wpath.copy())
          el.innerHTML = drawApp.to_string()
          drawable = true
          console.log('START: x', x, 'y', y)
        })

        const handleMouseMove = throttle(
          handlePoint(({ x, y }) => {
            if (!drawable) return
            wpath.add(Point.new(x, y))
            drawApp.update(wpath.copy())
            el.innerHTML = drawApp.to_string()
            console.log('MOVE: x', x, 'y', y, wpath.isClose())
          }),
          throttleDelay
        )

        const handleMouseUp = handlePoint(({ x, y }) => {
          drawable = false
          wpath.add(Point.new(x, y))
          drawApp.update(wpath)
          el.innerHTML = drawApp.to_string()
          console.log('END: x', x, 'y', y)
        })
        el.addEventListener('mousedown', handleMouseDown)
        el.addEventListener('mousemove', handleMouseMove)
        el.addEventListener('mouseup', handleMouseUp)

        return (): void => {
          el.removeEventListener('mousedown', handleMouseDown)
          el.removeEventListener('mousemove', handleMouseMove)
          el.removeEventListener('mouseup', handleMouseUp)
        }
      }
      let resetDawing = setupDrawing()

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
      /**
       * Toggle Path Circul Button
       */
      const displayThrottle = document.createElement('span')
      displayThrottle.innerHTML = `throttle: ${String(throttleDelay)}`
      const changeThrottle = document.createElement('input')
      changeThrottle.setAttribute('type', 'range')
      changeThrottle.setAttribute('min', '0')
      changeThrottle.setAttribute('max', '300')
      changeThrottle.setAttribute('step', '5')
      changeThrottle.addEventListener('change', (e: any) => {
        throttleDelay = Number(e.target.value)
        displayThrottle.innerHTML = `throttle: ${String(throttleDelay)}`
        resetDawing()
        resetDawing = setupDrawing()
      })
      document.body.appendChild(changeThrottle)
      document.body.appendChild(displayThrottle)
    }
  )
  .catch(console.error)
