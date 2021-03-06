import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  ChangeEvent,
} from 'react'
import { render } from 'react-dom'
import styled from 'styled-components'
import { Drawing, DrawingMode } from './drawing'

const DrawArea: any = styled.div.attrs(
  ({ size }: { size: number } = { size: 500 }) => ({
    style: { width: size, height: size },
  })
)`
  border: 1px solid #000;
`

const colorList = [
  'none',
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#ddd',
  '#9E9E9E',
  '#444',
  'black',
]

const getCanvasSize = () =>
  window.innerHeight > window.innerWidth
    ? window.innerWidth * 0.9
    : window.innerHeight * 0.9
const App = () => {
  const targetRef = useRef<any>()
  const [mode, changeMode] = useState(DrawingMode.Pencil)
  const [close, setClose] = useState(false)
  const [circuler, setCirculer] = useState(true)
  const [fill, setFill] = useState('none')
  const [stroke, setStroke] = useState('black')
  const [delay, setDelay] = useState(20)
  const [strokeWidth, setStrokeWidth] = useState(1)
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [loaded, setLoaded] = useState(false)

  const [canvasSize, setCanvasSize] = useState(getCanvasSize())
  const handleClear = useCallback(() => {
    if (!drawing) return
    drawing.clear()
  }, [drawing])

  const handleUndo = useCallback(() => {
    if (!drawing) return
    drawing.undo()
  }, [drawing])

  const handleRedo = useCallback(() => {
    if (!drawing) return
    drawing.redo()
  }, [drawing])

  const toggleClose = useCallback(() => {
    if (!drawing) return
    drawing.pathClose = !close
    setClose(!close)
  }, [drawing, close])

  const toggleCirculer = useCallback(() => {
    if (!drawing) return
    drawing.pathCirculer = !circuler
    setCirculer(!circuler)
  }, [drawing, circuler])

  const handleChangeMode = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      if (!drawing) return
      changeMode(Number(e.target.value) as any)
      drawing.changeMode(Number(e.target.value) as any)
    },
    [drawing]
  )

  const handleChangeThrottle = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (!drawing) return
      drawing.updatePencil(Number(e.target.value))
      setDelay(Number(e.target.value))
    },
    [drawing]
  )

  const updateFill = useCallback(
    (color: string) => {
      if (!drawing) return
      drawing.fill = color
      setFill(color)
    },
    [drawing]
  )

  const handleChangeFill = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateFill(e.target.value)
    },
    [updateFill]
  )

  const handleClickFill = useCallback(
    (col: string) => () => {
      updateFill(col)
    },
    [updateFill]
  )

  const updateStroke = useCallback(
    (color: string) => {
      if (!drawing) return
      drawing.stroke = color
      setStroke(color)
    },
    [drawing]
  )
  const handleChangeStroke = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      updateStroke(e.target.value)
    },
    [updateStroke]
  )

  const handleClickStroke = useCallback(
    (col: string) => () => {
      updateStroke(col)
    },
    [updateStroke]
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

  const handleDownload = useCallback(
    (ext: 'png' | 'svg' | 'jpg') => () => {
      if (!drawing) return

      drawing.download(ext)
    },
    [drawing]
  )

  useEffect(() => {
    if (loaded) return
    if (!targetRef.current) return
    setLoaded(true)
    setDrawing(
      new Drawing(targetRef.current, {
        fill,
        stroke,
        strokeWidth,
        pathClose: close,
        pathCirculer: circuler,
      })
    )
  }, [loaded, fill, stroke, strokeWidth, close, circuler])

  useEffect(() => {
    const changeCanvasSize = () => setCanvasSize(getCanvasSize())
    window.addEventListener('resize', changeCanvasSize)
    return () => window.removeEventListener('resize', changeCanvasSize)
  })
  return (
    <>
      <div>
        <div>
          MODE:
          <select value={mode} onChange={handleChangeMode}>
            <option value={DrawingMode.Pencil}>Pencil</option>
            <option value={DrawingMode.Pen}>Pen</option>
          </select>
        </div>
        <div>
          CLOSE:
          <input type="checkbox" checked={close} onChange={toggleClose} />
        </div>
        <div>
          CIRCULER:
          <input type="checkbox" checked={circuler} onChange={toggleCirculer} />
        </div>
        <div>
          STROKE WIDTH:
          <input
            type="number"
            min="1"
            max="20"
            step="1"
            value={strokeWidth}
            onChange={handleStrokeWidth}
          />
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={strokeWidth}
            onChange={handleStrokeWidth}
          />
        </div>
        {mode === DrawingMode.Pencil && (
          <div>
            PENCIL THROTTLE:
            <input
              type="number"
              min="0"
              max="300"
              step="5"
              value={delay}
              onChange={handleChangeThrottle}
            />
            <input
              type="range"
              min="0"
              max="300"
              step="5"
              value={delay}
              onChange={handleChangeThrottle}
            />
          </div>
        )}
      </div>
      <div>
        FILL:
        <input
          type="text"
          placeholder="#000 or black or rgba(0,0,0,1)"
          value={fill}
          onChange={handleChangeFill}
        />
      </div>
      <div>
        {colorList.map((col: string) => (
          <div
            key={col}
            style={{
              display: 'inline-block',
              width: '15px',
              height: '15px',
              backgroundColor: col,
              border: col === fill ? '2px solid #000' : '2px solid #999',
            }}
            onClick={handleClickFill(col)}
          />
        ))}
      </div>
      <div>
        STROKE:
        <input
          type="text"
          placeholder="#000 or black or rgba(0,0,0,1)"
          value={stroke}
          onChange={handleChangeStroke}
        />
      </div>
      <div>
        {colorList.map((col: string) => (
          <div
            key={col}
            style={{
              display: 'inline-block',
              width: '15px',
              height: '15px',
              backgroundColor: col,
              border: col === stroke ? '2px solid #000' : '2px solid #999',
            }}
            onClick={handleClickStroke(col)}
          />
        ))}
      </div>
      <DrawArea size={canvasSize} ref={targetRef} />
      <button type="button" onClick={handleClear}>
        CLEAR
      </button>
      <button type="button" onClick={handleUndo}>
        UNDO
      </button>
      <button type="button" onClick={handleRedo}>
        REDO
      </button>
      <button type="button" onClick={handleDownload('svg')}>
        DOWNLOAD SVG
      </button>
      <button type="button" onClick={handleDownload('png')}>
        DOWNLOAD PNG
      </button>
      <button type="button" onClick={handleDownload('jpg')}>
        DOWNLOAD JPEG
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
