import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import PrivateRoute from '../src/components/PrivateRoute.jsx'
import { initialState } from '../src/features/blueprints/blueprintsSlice.js'
import { renderWithStore } from './utils.jsx'

const app = (
  <Routes>
    <Route
      path="/secret"
      element={
        <PrivateRoute>
          <p>contenido protegido</p>
        </PrivateRoute>
      }
    />
    <Route path="/login" element={<p>pantalla de login</p>} />
  </Routes>
)

const auth = (token) => ({ blueprints: initialState, auth: { token, status: 'idle', error: null } })

describe('PrivateRoute', () => {
  it('redirige a /login sin token', () => {
    renderWithStore(app, { route: '/secret', preloadedState: auth(null) })
    expect(screen.getByText('pantalla de login')).toBeInTheDocument()
  })

  it('muestra el contenido con token', () => {
    renderWithStore(app, { route: '/secret', preloadedState: auth('abc') })
    expect(screen.getByText('contenido protegido')).toBeInTheDocument()
  })
})
