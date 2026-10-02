import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { combineReducers, configureStore } from '@reduxjs/toolkit'
import blueprintsReducer from '../src/features/blueprints/blueprintsSlice.js'
import authReducer from '../src/features/auth/authSlice.js'

// Store real + middleware que registra los tipos de acción despachados.
export function renderWithStore(ui, { preloadedState, route = '/' } = {}) {
  const actions = []
  const store = configureStore({
    reducer: combineReducers({ blueprints: blueprintsReducer, auth: authReducer }),
    preloadedState,
    middleware: (getDefault) =>
      getDefault().concat(() => (next) => (action) => {
        actions.push(action)
        return next(action)
      }),
  })
  const utils = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  )
  return { store, actions, ...utils }
}
