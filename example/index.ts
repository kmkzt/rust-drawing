import { Drawing } from './drawing'

const WIDTH = 500
const HEIGHT = 500
const main = () => {
  const el = document.getElementById('app')
  if (!el) return

  const drawing = new Drawing(el, {})
  el.setAttribute(
    'style',
    `width: ${WIDTH}; height: ${HEIGHT}; border: 1px solid #000;`
  )

  /**
   * ClearButton
   */
  const clearBtn = document.createElement('button')
  clearBtn.innerHTML = 'clear'
  clearBtn.addEventListener('click', () => {
    drawing.clear()
  })
  document.body.appendChild(clearBtn)
  /**
   * Toggle Path Close Button
   */
  const toggleCloseButton = document.createElement('button')
  toggleCloseButton.innerHTML = 'toggle close path'
  toggleCloseButton.addEventListener('click', () => {
    drawing.pathClose = !drawing.pathClose
  })
  document.body.appendChild(toggleCloseButton)
  /**
   * Toggle Path Circul Button
   */
  const togglCirculButton = document.createElement('button')
  togglCirculButton.innerHTML = 'toggle circul path'
  togglCirculButton.addEventListener('click', () => {
    drawing.pathCirculer = !drawing.pathCirculer
  })
  document.body.appendChild(togglCirculButton)
  /**
   * Toggle Path Circul Button
   */
  const displayThrottle = document.createElement('span')
  displayThrottle.innerHTML = `throttle: ${String(drawing.delay)}`
  const changeThrottle = document.createElement('input')
  changeThrottle.setAttribute('type', 'range')
  changeThrottle.setAttribute('min', '0')
  changeThrottle.setAttribute('max', '300')
  changeThrottle.setAttribute('step', '5')
  changeThrottle.addEventListener('change', (e: any) => {
    drawing.changeThrottle(Number(e.target.value))
    displayThrottle.innerHTML = `throttle: ${String(drawing.delay)}`
  })
  document.body.appendChild(changeThrottle)
  document.body.appendChild(displayThrottle)
}

main()
