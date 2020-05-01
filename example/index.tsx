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

  useEffect(() => {
    if (loaded) return
    if (!targetRef.current) return
    setLoaded(true)
    setDrawing(new Drawing(targetRef.current, {}))
  }, [loaded])

  return (
    <>
      <DrawArea ref={targetRef} />
      <div>
        <div>
          CLOSE PATH:
          {close ? 'CLOSE' : 'NOT CLOSE'}
        </div>
        <div>
          CIRCULER PATH:
          {circuler ? 'CIRCULER' : 'POLYGON'}
        </div>
        <div>
          THROTTLE:
          {String(delay)}
        </div>
      </div>
      <button type="button" onClick={handleClear}>
        CLEAR
      </button>
      <button type="button" onClick={toggleClose}>
        TOGGLE CLOSE
      </button>
      <button type="button" onClick={toggleCirculer}>
        TOGGLE CIRCULER
      </button>
      <input
        type="range"
        min="0"
        max="300"
        step="5"
        onChange={handleChangeThrottle}
      />
    </>
  )
}
const main = () => {
  const el = document.getElementById('app')
  if (!el) return

  render(<App />, el)
}

main()
