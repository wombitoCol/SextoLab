import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import BlueprintCanvas from '../src/components/BlueprintCanvas.jsx'

describe('BlueprintCanvas', () => {
  it('renderiza un canvas con id y dimensiones, y llama getContext', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const { container } = render(
      <BlueprintCanvas
        points={[
          { x: 10, y: 10 },
          { x: 50, y: 60 },
        ]}
      />,
    )
    const canvas = container.querySelector('canvas')
    expect(canvas).toBeInTheDocument()
    expect(canvas).toHaveAttribute('id', 'blueprint-canvas')
    expect(canvas).toHaveAttribute('width', '520')
    expect(canvas).toHaveAttribute('height', '360')
    expect(spy).toHaveBeenCalledWith('2d')
    spy.mockRestore()
  })

  it('dibuja un segmento por cada par consecutivo y marca cada punto', () => {
    const ctx = HTMLCanvasElement.prototype.getContext.call(document.createElement('canvas'))
    const lineTo = vi.spyOn(ctx, 'lineTo')
    const arc = vi.spyOn(ctx, 'arc')
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
    const points = [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]
    render(<BlueprintCanvas points={points} />)
    expect(lineTo).toHaveBeenCalledWith(2, 2)
    expect(lineTo).toHaveBeenCalledWith(3, 3)
    expect(arc).toHaveBeenCalledTimes(points.length)
    spy.mockRestore()
  })

  it('reporta el punto clickeado en coordenadas del canvas', () => {
    const onAddPoint = vi.fn()
    const { container } = render(<BlueprintCanvas onAddPoint={onAddPoint} />)
    const canvas = container.querySelector('canvas')
    // Simula el canvas escalado por CSS a la mitad de su tamaño.
    canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 260, height: 180 })
    fireEvent.click(canvas, { clientX: 60, clientY: 70 })
    expect(onAddPoint).toHaveBeenCalledWith({ x: 100, y: 100 })
  })
})
