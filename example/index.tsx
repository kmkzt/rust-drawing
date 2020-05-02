import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
} from 'react'
import { render } from 'react-dom'
import styled from 'styled-components'
import { Drawing } from './drawing'

const DrawArea = styled.div`
  width: 500;
  height: 500;
  border: 1px solid #000;
`
const App = () => {
  const targetRef = useRef<any>()
  const [close, setClose] = useState(false)
  const [circuler, setCirculer] = useState(false)
  const [delay, setDelay] = useState(20)
  const [strokeWidth, setStrokeWidth] = useState(1)
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [loaded, setLoaded] = useState(false)

  const handleClear = useCallback(() => {
    if (!drawing) return
    drawing.clear()
  }, [drawing])

  const toggleClose = useCallback(() => {
    if (!drawing) return
    drawing.pathClose = !drawing.pathClose
    setClose(drawing.pathClose)
  }, [drawing])

  const toggleCirculer = useCallback(() => {
    if (!drawing) return
    drawing.pathCirculer = !drawing.pathCirculer
    setCirculer(drawing.pathCirculer)
  }, [drawing])
  const handleChangeThrottle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!drawing) return
      drawing.changeThrottle(Number(e.target.value))
      setDelay(Number(e.target.value))
    },
    [drawing]
  )
  const handleFillColor = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!drawing) return
      drawing.fill = e.target.value
    },
    [drawing]
  )

  const handleStrokeColor = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!drawing) return
      drawing.stroke = e.target.value
    },
    [drawing]
  )

  const handleStrokeWidth = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!drawing) return
      const num = Number(e.target.value)
      if (Number.isNaN(num)) return
      drawing.strokeWidth = num
      setStrokeWidth(num)
    },
    [drawing]
  )

  useEffect(() => {
    if (loaded) return
    if (!targetRef.current) return
    setLoaded(true)
    setDrawing(new Drawing(targetRef.current, {}))
  }, [loaded])

  return (
    <>
      <div>
        <div>
          CLOSE:
          <input type="checkbox" checked={close} onChange={toggleClose} />
        </div>
        <div>
          CIRCULER:
          <input type="checkbox" checked={circuler} onChange={toggleCirculer} />
        </div>
        <div>
          THROTTLE:
          {String(delay)}
          <input
            type="range"
            min="0"
            max="300"
            step="5"
            value={delay}
            onChange={handleChangeThrottle}
          />
        </div>
      </div>
      <div>
        FILL:
        <input
          type="text"
          placeholder="#000 or black or rgba(0,0,0,1)"
          onChange={handleFillColor}
        />
      </div>
      <div>
        STROKE:
        <input
          type="text"
          placeholder="#000 or black or rgba(0,0,0,1)"
          onChange={handleStrokeColor}
        />
      </div>
      <div>
        STROKE WIDTH: {String(strokeWidth)}
        <input
          type="range"
          min="1"
          max="20"
          step="1"
          value={strokeWidth}
          onChange={handleStrokeWidth}
        />
      </div>
      <DrawArea ref={targetRef} />
      <button type="button" onClick={handleClear}>
        CLEAR
      </button>
    </>
  )
}
const main = () => {
  const el = document.getElementById('app')
  if (!el) return

  render(<App />, el)
}

main()