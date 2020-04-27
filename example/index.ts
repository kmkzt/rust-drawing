const WIDTH = 500
const HEIGHT = 500
import('../pkg')
  .then(
    ({ renderDraw, SvgDrawing, SvgPath, Point, PointCommand }: any): void => {
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
      const wpath = SvgPath.new()
      const rect = el.getBoundingClientRect()
      let drawable = false
      el.addEventListener('mousedown', (ev) => {
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        wpath.add(Point.new(x, y, PointCommand.Move))
        drawable = true
        console.log('START: x', x, 'y', y)
      })

      el.addEventListener('mousemove', (ev) => {
        if (!drawable) return
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        wpath.add(Point.new(x, y, PointCommand.Cubic))
        console.log('MOVE: x', x, 'y', y)
      })

      el.addEventListener('mouseup', (ev) => {
        drawable = false
        const x = ev.clientX - rect.left
        const y = ev.clientY - rect.top
        wpath.add(Point.new(x, y, PointCommand.Cubic))
        drawApp.add(wpath)
        el.innerHTML = drawApp.to_string()
        wpath.clear()
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
    }
  )
  .catch(console.error)
