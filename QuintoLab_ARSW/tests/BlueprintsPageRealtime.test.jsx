import { describe, it, expect, vi } from 'vitest'
import { act, screen, fireEvent } from '@testing-library/react'
import BlueprintsPage from '../src/pages/BlueprintsPage.jsx'
import { initialState } from '../src/features/blueprints/blueprintsSlice.js'
import { renderWithStore } from './utils.jsx'

// Cliente STOMP falso: el test decide cuándo conecta y qué mensajes llegan por el tópico.
const fake = vi.hoisted(() => ({ client: null, topic: null, onMsg: null, published: [] }))

vi.mock('../src/lib/stompClient.js', () => ({
  createStompClient: () => {
    fake.client = { connected: false, activate: () => {}, deactivate: () => {} }
    return fake.client
  },
  subscribeBlueprint: (client, author, name, onMsg) => {
    fake.topic = `blueprints.${author}.${name}`
    fake.onMsg = onMsg
    return () => {}
  },
  publishDraw: (client, author, name, point) => {
    if (!client?.connected) return false
    fake.published.push(point)
    return true
  },
}))

const preloadedState = {
  auth: { token: 't', status: 'idle', error: null },
  blueprints: {
    ...initialState,
    current: { author: 'juan', name: 'techo', points: [{ x: 1, y: 1 }] },
  },
}

describe('BlueprintsPage en tiempo real (STOMP)', () => {
  it('combina puntos propios y remotos sin duplicar el eco y los guarda juntos', () => {
    const { store } = renderWithStore(<BlueprintsPage />, { preloadedState })
    const canvas = screen.getByLabelText(/Lienzo interactivo/)

    // Sin conexión todavía: el punto se dibuja solo en local.
    fireEvent.click(canvas, { clientX: 5, clientY: 7 })
    expect(fake.published).toHaveLength(0)

    act(() => {
      fake.client.connected = true
      fake.client.onConnect()
    })
    expect(fake.topic).toBe('blueprints.juan.techo')
    expect(screen.getByTestId('rt-status')).toHaveTextContent('en vivo')

    // Conectado: el click se publica y el punto aparece cuando vuelve por el tópico.
    fireEvent.click(canvas, { clientX: 20, clientY: 30 })
    expect(fake.published).toEqual([{ x: 20, y: 30 }])
    act(() => fake.onMsg({ points: [{ x: 9, y: 9 }] })) // otra pestaña
    act(() => fake.onMsg({ points: [{ x: 20, y: 30 }] })) // eco del propio punto

    fireEvent.click(screen.getByText('Guardar cambios'))
    expect(store.getState().blueprints.current.points).toEqual([
      { x: 1, y: 1 },
      { x: 5, y: 7 },
      { x: 9, y: 9 },
      { x: 20, y: 30 },
    ])
  })

  it('con el selector en None no abre conexión', () => {
    renderWithStore(<BlueprintsPage />, { preloadedState })
    fireEvent.change(screen.getByLabelText(/Tiempo real/), { target: { value: 'none' } })
    expect(screen.getByTestId('rt-status')).toHaveTextContent('desconectado')
  })
})
