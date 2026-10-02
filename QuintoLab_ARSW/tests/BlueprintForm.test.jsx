import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BlueprintForm from '../src/components/BlueprintForm.jsx'

describe('BlueprintForm', () => {
  it('envía el formulario con puntos parseados', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), {
      target: { value: '[{"x":1,"y":2}]' },
    })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).toHaveBeenCalledWith({
      author: 'john',
      name: 'house',
      points: [{ x: 1, y: 2 }],
    })
  })

  it('muestra un error y no envía si el JSON es inválido', () => {
    const onSubmit = vi.fn()
    render(<BlueprintForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText(/Autor/i), { target: { value: 'john' } })
    fireEvent.change(screen.getByLabelText(/Nombre/i), { target: { value: 'house' } })
    fireEvent.change(screen.getByLabelText(/Puntos/i), { target: { value: '{no' } })
    fireEvent.submit(screen.getByText(/Guardar/i))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(/JSON de puntos inválido/)
  })

  it('agrega puntos al hacer click en el lienzo', () => {
    render(<BlueprintForm onSubmit={() => {}} />)
    fireEvent.click(screen.getByText(/Limpiar lienzo/i))
    const canvas = screen.getByLabelText(/haz click para dibujar/i)
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 520, height: 360 })
    fireEvent.click(canvas, { clientX: 5, clientY: 6 })
    expect(JSON.parse(screen.getByLabelText(/Puntos/i).value)).toEqual([{ x: 5, y: 6 }])
  })
})
